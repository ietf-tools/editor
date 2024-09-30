import git from 'isomorphic-git'
import path from 'node:path'
import fs from 'node:fs/promises'
import http from 'isomorphic-git/http/node/index.js'
import { spawn } from 'node:child_process'
import { app, clipboard, safeStorage } from 'electron'
import { createHash } from 'node:crypto'

export default {
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
  async repoClone ({ dir, url, upstreamUrl }) {
    await fs.mkdir(dir, { recursive: true })
    await git.clone({
      fs,
      http,
      dir,
      url,
      remote: 'origin',
      onAuth: (url) => {
        return this.onAuth(url)
      }
    })
    this.conf.currentRemote = 'origin'
    if (upstreamUrl) {
      await git.addRemote({
        fs,
        dir,
        remote: 'upstream',
        url: upstreamUrl
      })
    }
  },
  /**
   * Initialize a git repository
   *
   * @param {Object} param0 Options
   * @returns {Promise<void>} Promise
   */
  async repoInit ({ dir, branch = 'main' }) {
    return git.init({
      fs,
      dir,
      defaultBranch: branch
    })
  },
  /**
   * Perform fetch on remote
   */
  async performFetch ({ dir, remote }) {
    return git.fetch({
      fs,
      http,
      dir,
      remote,
      onAuth: (url) => {
        return this.onAuth(url)
      }
    })
  },
  /**
   * List remotes
   *
   * @param {Object} param0 Options
   * @returns {Promise<Array>} List of remotes
   */
  async listRemotes ({ dir }) {
    return git.listRemotes({
      fs,
      dir
    })
  },
  /**
   * Add a remote
   *
   * @param {Object} param0 Options
   * @returns {Promise<void>}
   */
  async addRemote ({ dir, remote, url }) {
    return git.addRemote({
      fs,
      dir,
      remote,
      url
    })
  },
  /**
   * Delete a remote
   *
   * @param {Object} param0 Options
   * @returns {Promise<void>}
   */
  async deleteRemote ({ dir, remote }) {
    return git.deleteRemote({
      fs,
      dir,
      remote
    })
  },
  /**
   * List branches
   *
   * @param {Object} param0 Options
   * @returns {Promise<Array>} List of branches
   */
  async listBranches ({ dir, remote }) {
    const currentBranch = await git.currentBranch({
      fs,
      dir
    })
    const localBranches = await git.listBranches({
      fs,
      dir
    })
    const remoteBranches = await git.listBranches({
      fs,
      dir,
      remote
    })

    return {
      current: currentBranch,
      local: localBranches,
      remote: remoteBranches.filter(br => br !== 'HEAD')
    }
  },
  /**
   * Fetch commits history
   *
   * @param {Object} param0 Options
   * @returns {Promise<Array>} List of commits
   */
  async commitsLog ({ dir, depth = 500 }) {
    return git.log({
      fs,
      dir,
      depth
    }).then(commits => commits.map(c => {
      const normalizedEmail = c.commit?.author?.email?.toLowerCase() ?? 'unknown'
      c.commit.author.emailHash = createHash('sha256').update(normalizedEmail).digest('hex')
      return c
    }))
  },
  /**
   * Get the status of files in the working directory
   * Reference: https://isomorphic-git.org/docs/en/statusMatrix
   *
   * @param {object} param0 Options
   * @returns {Promise<Array>} Array of changes
   */
  async statusMatrix ({ dir }) {
    return git.statusMatrix({
      fs,
      dir
    }).then(changes => changes.filter(row => !(row[1] === row[2] && row[1] === row[3])).map(row => {
      return {
        path: row[0],
        isStaged: row[2] === row[3] || (row[2] === 2 && row[3] === 3),
        isUnstaged: row[2] !== row[3], // can be both staged with unstaged changes
        isAdded: row[1] === 0 && row[2] === 2,
        isModified: row[1] === 1 && row[2] === 2,
        isDeleted: row[1] === 1 && row[2] === 0
      }
    }))
  },
  /**
   * Stage Files
   *
   * @param {Object} param0 Options
   * @returns {Promise<void>} Promise
   */
  async stageFiles ({ dir, files }) {
    const toAdd = files.filter(f => !f.isDeleted).map(f => f.path)
    const toRemove = files.filter(f => f.isDeleted).map(f => f.path)
    if (toAdd.length > 0) {
      await git.add({
        fs,
        dir,
        filepath: toAdd
      })
    }
    if (toRemove.length > 0) {
      for (const fl of toRemove) {
        await git.remove({
          fs,
          dir,
          filepath: fl
        })
      }
    }
  },
  /**
   * Unstage Files
   *
   * @param {Object} param0 Options
   * @returns {Promise<void>} Promise
   */
  async unstageFiles ({ dir, files }) {
    const toUndelete = files.filter(f => f.isDeleted).map(f => f.path)
    const toRemove = files.filter(f => !f.isDeleted).map(f => f.path)
    if (toUndelete.length > 0) {
      for (const fl of toUndelete) {
        await git.resetIndex({
          fs,
          dir,
          filepath: fl
        })
      }
    }
    if (toRemove.length > 0) {
      for (const fl of toRemove) {
        await git.remove({
          fs,
          dir,
          filepath: fl
        })
      }
    }
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
  }
}
