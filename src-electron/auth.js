import { BrowserWindow, app, dialog, safeStorage } from 'electron'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

export default {
  clientId: '607998',
  authorizeUrl: 'https://auth.ietf.org/api/openid/authorize',
  tokenUrl: 'https://auth.ietf.org/api/openid/token',
  redirectUrl: 'https://draftforge.internal/oidc/callback',
  userInfoUrl: 'https://auth.ietf.org/api/openid/userinfo',
  logoutUrl: 'https://auth.ietf.org/api/openid/end-session',
  scope: ['openid', 'profile', 'email', 'roles'],
  accessToken: null,
  refreshToken: null,
  jwt: null,
  expireAt: Math.floor(Date.now() / 1000) - 1,
  profile: {},
  /**
   * Checks if the user is logged in.
   *
   * @returns {boolean} True if the user is logged in, false otherwise.
   */
  isLoggedIn () {
    return Boolean(this.accessToken && this.refreshToken)
  },
  /**
   * Checks if the authentication token has expired.
   *
   * @returns {boolean} True if the token has expired, false otherwise.
   */
  isExpired () {
    return this.expireAt <= Math.floor(Date.now() / 1000)
  },
  /**
   * Initialize
   */
  async init () {
    await this.load()
    if (this.isLoggedIn()) {
      if (this.isExpired()) {
        await this.renewToken()
      }
      await this.refreshUserInfo()
    }
  },
  /**
   * Clear user login
   */
  clear () {
    this.accessToken = null
    this.refreshToken = null
    this.jwt = null
    this.expireAt = Math.floor(Date.now() / 1000) - 1
    this.profile = {}
  },
  /**
   * Logs in the user by showing a login modal and performing the OIDC token exchange.
   *
   * @returns {Promise<void>} - A promise that resolves when the login process is complete.
   */
  async login () {
    const state = crypto.randomUUID()

    // -> Show login modal
    const loginWindow = new BrowserWindow({
      parent: DFG.mainWindow,
      modal: true,
      width: 1024,
      height: 768,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      closable: true,
      title: 'Login',
      darkTheme: true,
      backgroundColor: '#000'
    })
    loginWindow.setMenu(null)

    // -> Intercept login callback
    loginWindow.webContents.on('will-redirect', async ev => {
      const evUrl = new URL(ev.url)
      if (evUrl.hostname === 'draftforge.internal' && evUrl.pathname === '/oidc/callback') {
        loginWindow.close()

        if (evUrl.searchParams.get('state') !== state) {
          dialog.showErrorBox('Login Failed', 'Invalid OIDC auth state value.')
          return
        } else if (!evUrl.searchParams.get('code')) {
          dialog.showErrorBox('Login Failed', 'Login was cancelled by the user.')
          return
        }

        try {
          const res = await fetch(this.tokenUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              client_id: this.clientId,
              code: evUrl.searchParams.get('code'),
              redirect_uri: this.redirectUrl
            })
          }).then(res => res.json())

          this.accessToken = res.access_token
          this.refreshToken = res.refresh_token
          this.jwt = res.id_token
          this.expireAt = Math.floor(Date.now() / 1000) + res.expires_in

          await this.refreshUserInfo()

          await this.persist()
        } catch (err) {
          console.warn(err)
          this.clear()
          dialog.showErrorBox('Login Failed', err.message)
        }
      }
    })

    loginWindow.loadURL(`${this.authorizeUrl}?response_type=code&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUrl)}&scope=${this.scope.join('%20')}&state=${state}`)
    loginWindow.focus()
  },
  /**
   * Logs out the user.
   */
  logout () {
    const endSessionJWT = this.jwt
    this.clear()
    this.persist()
    this.notify()

    // -> Logout from oidc provider
    const logoutWindow = new BrowserWindow({
      parent: DFG.mainWindow,
      modal: true,
      width: 1024,
      height: 768,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      title: 'Logout',
      darkTheme: true,
      show: false
    })
    // -> Intercept logout callback
    logoutWindow.webContents.on('will-redirect', async ev => {
      const evUrl = new URL(ev.url)
      if (evUrl.hostname === 'draftforge.internal' && evUrl.pathname === '/oidc/callback') {
        console.info('Logged out from OIDC provider.')
        logoutWindow.close()
      }
    })
    logoutWindow.setMenu(null)
    logoutWindow.loadURL(`${this.logoutUrl}?id_token_hint=${endSessionJWT}&post_logout_redirect_uri=${encodeURIComponent(this.redirectUrl)}`)

    // -> Success message
    DFG.mainWindow.webContents.send('notify', {
      message: 'You are now logged out.',
      color: 'positive',
      icon: 'mdi-logout'
    })
  },
  /**
   * Refreshes the user information.
   *
   * @returns {Promise<boolean>} A promise that resolves to `true` if the user information was successfully refreshed, or `false` if the access token is expired.
   */
  async refreshUserInfo () {
    if (!this.isLoggedIn()) {
      return false
    }
    if (this.isExpired()) {
      await this.renewToken()
    }
    try {
      const res = await fetch(`${this.userInfoUrl}?access_token=${this.accessToken}`).then(res => { return res.json() })
      if (res) {
        this.profile = res
        this.notify()
        return true
      }
    } catch (err) {
      console.warn(err)
      dialog.showErrorBox('User Profile Refresh Failed', err.message)
    }
  },
  async renewToken () {
    if (!this.isLoggedIn) {
      console.warn('AUTH ERROR: Incorrectly attempting to renew token when user is not logged in!')
      return
    }
    try {
      const res = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          refresh_token: this.refreshToken
        })
      }).then(res => res.json())

      this.accessToken = res.access_token
      this.refreshToken = res.refresh_token
      this.jwt = res.id_token
      this.expireAt = Math.floor(Date.now() / 1000) + res.expires_in
    } catch (err) {
      console.warn(err)
      this.clear()
    }
  },
  /**
   * Persists the user authentication information to disk.
   *
   * @returns {Promise<void>} A promise that resolves when the authentication information is successfully written to disk.
   */
  async persist () {
    const authPath = path.join(app.getPath('userData'), 'draftforge-userauth.bin')
    try {
      await fs.writeFile(authPath, safeStorage.encryptString(JSON.stringify({
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        jwt: this.jwt,
        expireAt: this.expireAt,
        profile: this.profile
      })))
    } catch (err) {
      console.log(`Failed to write user auth info to disk. [${err.message}]`)
    }
  },
  /**
   * Loads the user authentication information from the disk.
   *
   * @returns {Promise<void>} A promise that resolves when the authentication information is loaded.
   */
  async load () {
    const authPath = path.join(app.getPath('userData'), 'draftforge-userauth.bin')
    try {
      const authFromDisk = JSON.parse(safeStorage.decryptString(await fs.readFile(authPath)))
      if (authFromDisk) {
        this.accessToken = authFromDisk.accessToken
        this.refreshToken = authFromDisk.refreshToken
        this.jwt = authFromDisk.jwt
        this.expireAt = authFromDisk.expireAt
        this.profile = authFromDisk.profile
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('No user auth info yet. [ OK ]')
      } else {
        console.log(`Failed to read git auth file. [${err.message}]`)
      }
    }
  },
  /**
   * Send current user info to the renderer
   */
  notify () {
    DFG.mainWindow.webContents.send('authUpdate', {
      ...this.profile,
      expireAt: this.expireAt,
      isLoggedIn: this.isLoggedIn()
    })
  }
}
