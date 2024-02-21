import git from 'isomorphic-git'
import path from 'node:path'
import fs from 'node:fs/promises'
import http from 'isomorphic-git/http/node/index.js'
import { spawn } from 'node:child_process'
import { app, clipboard, safeStorage } from 'electron'

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
    safeStorageEnabled: false
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
        useCredMan: this.conf.useCredMan
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
   * Revoke OpenPGP Signing Key
   */
  async revokeSigningKey () {
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
  async repoClone ({ dir, url }) {
    return git.clone({
      fs,
      http,
      dir,
      url,
      onAuth: this.onAuth
    })
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
