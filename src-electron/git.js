import { simpleGit } from 'simple-git'
import path from 'node:path'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { app, clipboard, safeStorage } from 'electron'
import { createHash } from 'node:crypto'
import * as openpgp from 'openpgp'
import { find } from 'lodash-es'

export default {
  git: simpleGit({
    timeout: {
      block: 60000
    }
  }),
  conf: {
    signCommits: true,
    useCredMan: true,
    name: '',
    email: '',
    username: '',
    password: '',
    publicKey: '',
    privateKey: '',
    revocationCertificate: '',
    fingerprint: '',
    safeStorageEnabled: false,
    currentRemote: 'origin'
  },
  /**
   * Initialize Git Integration
   */
  async init () {
    await this.loadConfig()
    if (safeStorage.isEncryptionAvailable()) {
      this.conf.safeStorageEnabled = true
      this.loadAuthConfig()
    } else {
      console.warn('safeStorage is not available on this system. Cannot store or load git auth data.')
    }
  },
  /**
   * Set Git Working Directory
   */
  async setWorkingDirectory ({ dir }) {
    return this.git.cwd(dir)
  },
  /**
   * Load configuration from disk
   */
  async loadConfig () {
    const confPath = path.join(app.getPath('userData'), 'draftforge-gitconf.json')
    try {
      const confFromDisk = JSON.parse(await fs.readFile(confPath, 'utf8'))
      if (confFromDisk) {
        this.conf = {
          ...this.conf,
          ...confFromDisk
        }
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('No git config exists yet. [ OK ]')
      } else {
        console.log(`Failed to read git config. [${err.message}]`)
      }
    }
  },
  /**
   * Save configuration to disk
   */
  async saveConfig () {
    const confPath = path.join(app.getPath('userData'), 'draftforge-gitconf.json')
    try {
      await fs.writeFile(confPath, JSON.stringify({
        name: this.conf.name,
        email: this.conf.email,
        signCommits: this.conf.signCommits,
        useCredMan: this.conf.useCredMan,
        currentRemote: this.conf.currentRemote
      }, null, 2), 'utf8')
    } catch (err) {
      console.log(`Failed to write git config to disk. [${err.message}]`)
    }
  },
  /**
   * Load auth configuration from disk
   */
  async loadAuthConfig () {
    const authPath = path.join(app.getPath('userData'), 'draftforge-gitauth.bin')
    try {
      const authFromDisk = JSON.parse(safeStorage.decryptString(await fs.readFile(authPath)))
      if (authFromDisk) {
        this.conf = {
          ...this.conf,
          ...authFromDisk
        }
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('No git auth file exists yet. [ OK ]')
      } else {
        console.log(`Failed to read git auth file. [${err.message}]`)
      }
    }
  },
  /**
   * Save auth configuration to disk
   */
  async saveAuthConfig () {
    const authPath = path.join(app.getPath('userData'), 'draftforge-gitauth.bin')
    try {
      await fs.writeFile(authPath, safeStorage.encryptString(JSON.stringify({
        username: this.conf.username,
        password: this.conf.password,
        publicKey: this.conf.publicKey,
        privateKey: this.conf.privateKey,
        revocationCertificate: this.conf.revocationCertificate,
        fingerprint: this.conf.fingerprint
      })))
    } catch (err) {
      console.log(`Failed to write git keys file to disk. [${err.message}]`)
    }
  },
  /**
   * Clear OpenPGP Signing Key
   */
  async clearSigningKey () {
    clipboard.writeText(this.conf.revocationCertificate)
    this.conf.publicKey = ''
    this.conf.privateKey = ''
    this.conf.revocationCertificate = ''
    this.conf.fingerprint = ''
    await this.saveAuthConfig()
    return true
  },
  /**
   * Clone a git repository
   *
   * @param {Object} param0 Options
   * @returns {Promise<void>} Promise
   */
  async repoClone ({ dir, url, upstreamUrl, cloneInSubDir }) {
    let targetDir = dir.trim()
    if (cloneInSubDir) {
      let lastUrlPart = url.split('/').at(-1)
      if (lastUrlPart.endsWith('.git')) {
        lastUrlPart = lastUrlPart.slice(0, -4)
      }
      targetDir = process.env.OS_PLATFORM === 'win32' ? `${targetDir}\\${lastUrlPart}` : `${targetDir}/${lastUrlPart}`
    }

    await fs.mkdir(targetDir, { recursive: true })
    await this.git.cwd(targetDir)
    await this.git.clone(url, '.')
    this.conf.currentRemote = 'origin'

    if (upstreamUrl) {
      await this.git.addRemote('upstream', upstreamUrl)
    }

    return targetDir
  },
  /**
   * Initialize a git repository
   *
   * @param {Object} param0 Options
   * @returns {Promise<void>} Promise
   */
  async repoInit ({ dir, branch = 'main' }) {
    const targetDir = dir.trim()

    await fs.mkdir(targetDir, { recursive: true })
    await this.git.cwd(targetDir)
    await this.git.init(['-b', branch])

    await fs.writeFile(path.join(targetDir, 'README.md'), '# New Draft Repository')
    await this.git.add(['README.md'])
    await this.commit({ message: 'Initial commit' })

    return targetDir
  },
  /**
   * Perform fetch on remote
   */
  async performFetch () {
    return this.git.fetch(['--all'])
  },
  /**
   * List remotes
   *
   * @param {Object} param0 Options
   * @returns {Promise<Array>} List of remotes
   */
  async listRemotes () {
    return this.git.getRemotes(true)
  },
  /**
   * Add a remote
   *
   * @param {Object} param0 Options
   * @returns {Promise<void>}
   */
  async addRemote ({ remote, url }) {
    await this.git.addRemote(remote, url)
    await this.git.fetch([remote])
  },
  /**
   * Delete a remote
   *
   * @param {Object} param0 Options
   * @returns {Promise<void>}
   */
  async deleteRemote ({ remote }) {
    return this.git.removeRemote(remote)
  },
  /**
   * Pulls the latest changes from the specified remote repository.
   *
   * @param {Object} options - The options for the pull operation.
   * @param {string} options.remote - The name of the remote repository.
   * @param {string} options.branch - The name of the working branch.
   * @param {string} options.mode - Pull mode to use: ff, rebase (or empty for default ff + merge)
   * @returns {Promise<Object>} - A promise that resolves with the result of the pull operation.
   */
  async pull ({ remote, branch, mode } = {}) {
    const pullArgs = []
    if (mode === 'ff') {
      pullArgs.push('--ff-only')
    } else if (mode === 'rebase') {
      pullArgs.push('--rebase')
    }
    if (remote) {
      pullArgs.push(remote)
    }
    if (branch) {
      pullArgs.push(branch)
    }
    return this.git.pull(pullArgs)
  },
  /**
   * Push commits to remote repository
   *
   * @returns {Promise<Object>} - A promise that resolves with the result of the push operation.
   */
  async push ({ remote, branch }) {
    return this.git.push(remote, branch)
  },
  /**
   * List branches
   *
   * @param {Object} param0 Options
   * @returns {Promise<Array>} List of branches
   */
  async listBranches () {
    const localBranches = await this.git.branchLocal()
    const remoteBranches = await this.git.branch()

    console.info(localBranches)

    return {
      current: localBranches.current,
      local: localBranches.all.filter(br => !['list', 'remotes'].includes(br)),
      remote: remoteBranches.all.filter(br => br.startsWith('remotes/')).map(br => {
        const parts = br.slice(8).split('/')
        return {
          remote: parts[0],
          branch: parts.slice(1).join('/')
        }
      })
    }
  },
  /**
   * Create new branch from source
   *
   * @param {Object} param0 Options
   * @param {Promise<void>} Promise
   */
  async newBranch ({ branchName, source, tracking }) {
    await this.git.checkoutBranch(branchName, source)
    if (tracking) {
      await this.git.branch(['-u', tracking, branchName])
    }
  },
  /**
   * Delete local branch
   *
   * @param {*} param0 Options
   * @param {Promise<void>} Promise
   */
  async deleteBranch ({ branch }) {
    await this.git.deleteLocalBranch(branch)
  },
  /**
 * Delete remote branch
 *
 * @param {*} param0 Options
 * @param {Promise<void>} Promise
 */
  async deleteRemoteBranch ({ branch, remote }) {
    await this.git.push(['-d', remote, branch])
    await this.git.fetch(['--all', '--prune'])
  },
  /**
   * Set branch tracking remote
   *
   * @param {*} param0 Options
   * @param {Promise<void>} Promise
   */
  async setBranchTracking ({ branch, tracking }) {
    await this.git.branch(['-u', tracking, branch])
  },
  /**
   * Checkout branch
   *
   * @param {*} param0 Options
   * @param {Promise<void>} Promise
   */
  async checkoutBranch ({ branch, tracking }) {
    if (tracking) {
      await this.git.raw(['checkout', '-b', branch, '--track', tracking])
    } else {
      await this.git.checkout(branch)
    }
  },
  /**
   * Fetch commits history
   *
   * @param {Object} param0 Options
   * @returns {Promise<Array>} List of commits
   */
  async commitsLog ({ depth = 500 } = {}) {
    return this.git.log({
      maxCount: depth
    }).then(results => results.all.map(c => {
      const normalizedEmail = c.author_email?.toLowerCase() ?? 'unknown'
      c.author_email_hash = createHash('sha256').update(normalizedEmail).digest('hex')
      return c
    }))
  },
  /**
   * Get the status of files in the working directory
   *
   * @param {object} param0 Options
   * @returns {Promise<Array>} Array of changes
   */
  async statusMatrix () {
    return this.git.status(['--no-renames']).then(results => {
      return {
        currentBranch: results.current,
        tracking: results.tracking,
        staged: results.staged.map(f => ({
          path: f,
          state: find(results.files, ['path', f])?.index
        })),
        unstaged: results.files.filter(f => f.working_dir !== ' ').map(f => ({
          path: f.path,
          state: f.working_dir
        }))
      }
    })
  },
  /**
   * Stage Files
   *
   * @param {Object} param0 Options
   * @returns {Promise<void>} Promise
   */
  async stageFiles ({ files }) {
    await this.git.add(files.map(f => f.path))
  },
  /**
   * Unstage Files
   *
   * @param {Object} param0 Options
   * @returns {Promise<void>} Promise
   */
  async unstageFiles ({ files }) {
    for (const fl of files.map(f => f.path)) {
      await this.git.reset('mixed', ['--', fl])
    }
  },
  /**
   * Discard Chnages
   *
   * @param {*} param0 Options
   * @returns {Promise<void>} Promise
   */
  async discardChanges ({ files }) {
    for (const fl of files) {
      await this.git.raw(['restore', fl])
    }
  },
  /**
   * Commits changes to the git repository.
   *
   * @param {Object} params - The parameters for the commit.
   * @param {string} params.message - The commit message.
   * @returns {Promise<Object>} The result of the git commit operation.
   */
  async commit ({ message }) {
    const commitOpts = {
      '--author': `"${this.conf.name} <${this.conf.email}>"`
    }
    if (this.conf.signCommits) {
      commitOpts['-S'] = null
    }
    return this.git.commit(message, null, commitOpts)
  },
  /**
   * Authentication event handler
   *
   * @param {string} url Git remote URL
   * @returns {Promise<Object>} User/Pass object
   */
  async onAuth (url) {
    if (this.conf.useCredMan) {
      const { protocol, host } = new URL(url)
      return new Promise((resolve, reject) => {
        const output = []
        const process = spawn('git', ['credential', 'fill'])
        process.on('close', (code) => {
          if (code) return reject(code)
          const { username, password } = output.join('\n').split('\n').reduce((acc, line) => {
            if (line.startsWith('username') || line.startsWith('password')) {
              const [key, val] = line.split('=')
              acc[key] = val
            }
            return acc
          }, {})
          resolve({ username, password })
        })
        process.stdout.on('data', (data) => output.push(data.toString().trim()))
        process.stdin.write(`protocol=${protocol.slice(0, -1)}\nhost=${host}\n\n`)
      })
    } else {
      return {
        username: this.conf.username,
        password: this.conf.password
      }
    }
  },
  /**
   * Signs the given payload using the provided secret key.
   *
   * @param {Object} params - The parameters for the signing operation.
   * @param {string} params.payload - The data to be signed.
   * @param {string} params.secretKey - The secret key used for signing.
   * @returns {Promise<Object>} A promise that resolves to an object containing the signature.
   */
  async onSign ({ payload, secretKey }) {
    const enc = new TextEncoder()
    // -> Convert to binary to avoid mangling the line endings
    const unsignedMessage = await openpgp.createMessage({ binary: enc.encode(payload) })
    const privateKeys = await openpgp.readPrivateKey({ armoredKey: secretKey })
    const signature = await openpgp.sign({
      message: unsignedMessage,
      signingKeys: privateKeys,
      format: 'armored',
      detached: true
    })
    return { signature }
  }
}
