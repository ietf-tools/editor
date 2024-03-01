import { dialog } from 'electron'
import { spawn } from 'node:child_process'
import { deferred } from 'fast-defer'
import initOptions from './lsp/init-options.js'
import { createWriteStream } from 'node:fs'
import fs from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import got from 'got'
import { setTimeout } from 'node:timers/promises'

const platform = {
  darwin: {
    exec: 'lemminx-darwin',
    env: {}
  },
  linux: {
    exec: 'lemminx-linux',
    env: {}
  },
  win32: {
    exec: 'lemminx-win32.exe',
    env: {
      windowsHide: true
    }
  }
}

export default {
  lsp: null,
  requests: new Map(),
  requestIndex: 0,
  registeredCapabilities: [],
  isReady: deferred(),
  /**
   * Initialize the LSP
   */
  async init (mainWindow) {
    const platformOpts = platform[process.platform]
    if (!platformOpts) {
      dialog.showErrorBox('Unsupported Platform', 'The XML language server is not supported on this platform.')
      console.error('LSP: Unsupported platform')
      return
    }

    let isInstalled = false
    try {
      await fs.access(platformOpts.exec, fs.constants.X_OK)
      isInstalled = true
    } catch (err) {
      console.warn('LSP server executable missing. Will download...')
    }

    if (isInstalled) {
      try {
        this.startServer(mainWindow)
      } catch (err) {
        dialog.showErrorBox('LSP Server Initialization Failed', err.message)
      }
      this.startServer(mainWindow)
    } else {
      try {
        await this.downloadServer(mainWindow)
        this.startServer(mainWindow)
      } catch (err) {
        dialog.showErrorBox('LSP Server Download Failed', err.message)
      }
    }
  },
  async downloadServer (mainWindow) {
    const platformOpts = platform[process.platform]
    mainWindow.webContents.send('setProgressDialog', {
      isShown: true,
      message: 'Installing XML Language Server',
      caption: 'Downloading LemMinX executable...'
    })
    await setTimeout(1000)
    try {
      let downloadFile = platformOpts.exec
      if (process.platform === 'darwin') {
        downloadFile = `${downloadFile}-${process.arch}`
      }
      await pipeline(
        got.stream(`https://github.com/ietf-tools/lemminx/releases/latest/download/${downloadFile}`),
        createWriteStream(platformOpts.exec)
      )
      if (process.platform !== 'win32') {
        await fs.chmod(platformOpts.exec, '+x')
      }
      await fs.access(platformOpts.exec, fs.constants.X_OK)
    } catch (err) {
      console.warn(err)
      mainWindow.webContents.send('setProgressDialog', { isShown: false })
      try {
        await fs.unlink(platformOpts.exec)
      } catch (err) {}
      throw new Error(`${err.message}: ${err.options?.url?.href}`)
    }
    (async () => {
      mainWindow.webContents.send('setProgressDialog', {
        isShown: true,
        message: 'Installing XML Language Server',
        caption: 'Starting the LSP server...'
      })
      await setTimeout(2000)
      mainWindow.webContents.send('setProgressDialog', { isShown: false })
    })()
  },
  async startServer (mainWindow) {
    const platformOpts = platform[process.platform]

    // Spawn LSP process
    this.lsp = spawn(platformOpts.exec)

    // -> Handle stdio
    this.lsp.stdout.on('data', (data) => {
      console.info('--- INCOMING ---')
      console.info(data.toString())

      // Parse requests
      let cursorIndex = 0
      let bodySepIndex = data.indexOf('\r\n')
      while (bodySepIndex >= 0) {
        // -> Extract header + body
        const reqHeader = data.subarray(cursorIndex, bodySepIndex).toString()
        cursorIndex = bodySepIndex + 4
        const bodyLength = parseInt(reqHeader.split(':')[1].trim())
        const reqBody = data.subarray(cursorIndex, cursorIndex + bodyLength).toString()
        cursorIndex = cursorIndex + bodyLength
        bodySepIndex = data.indexOf('\r\n', cursorIndex)

        if (!reqBody) {
          break
        }

        // -> Convert JSON body
        let response
        try {
          response = JSON.parse(reqBody)
        } catch (err) {
          console.info(`Failed to parse LSP request: ${reqBody}`)
          continue
        }
        console.info(JSON.stringify(response, null, 2))
        if (response.id) {
          // -> Handle server increasing the request index
          const reqId = parseInt(response.id)
          if (reqId >= this.requestIndex) {
            this.requestIndex = reqId + 1
          }

          // -> Handle server requesting to register new capability
          if (response.method === 'client/registerCapability') {
            this.registeredCapabilities.push(...response.params.registrations)
            const ackReply = JSON.stringify({
              jsonrpc: '2.0',
              id: reqId
            })
            const ackReplyByteLength = Buffer.byteLength(ackReply, 'utf8')
            this.lsp.stdin.write(`Content-Length: ${ackReplyByteLength}\r\n\r\n${ackReply}`)
            continue
          }

          // -> Find corresponding request awaiting callback
          const cmd = this.requests.get(response.id)
          if (cmd) {
            if (response.error) {
              cmd.reject(response.error)
            } else {
              cmd.resolve(response.result)
            }
            this.requests.delete(response.id)
          } else {
            console.warn(`No matching LSP command ID: ${response.id}`)
          }
        } else {
          mainWindow.webContents.send('lspNotification', response)
        }
      }
    })

    this.lsp.stderr.on('data', (data) => {
      console.error(`Lemminx Process Error: ${data}`)
    })

    this.lsp.on('close', (code) => {
      console.log(`Lemminx process exited with code ${code}`)
    })

    // -> Send initialization sequence
    try {
      const initResult = await this.sendRequest('initialize', {
        ...initOptions,
        processId: process.pid
      })
      if (initResult?.capabilities?.textDocumentSync === 2) {
        this.sendNotification('initialized')
        this.isReady.resolve()
        console.info('LSP initialized successfully.')
      } else {
        throw new Error(`Unexpected response ${JSON.stringify(initResult)}`)
      }
    } catch (err) {
      this.isReady.reject()
      console.warn(`LSP Server Initialization Error: ${err.message}`)
    }
  },
  /**
   * Send a request
   *
   * @param {string} method Method name
   * @param {Object} [params] Parameters
   * @returns {Promise<Object>} Promise of the response
   */
  async sendRequest (method, params) {
    if (!this.lsp) { return }
    const reqDeferred = deferred()

    this.requestIndex++
    this.requests.set(this.requestIndex, reqDeferred)

    const request = JSON.stringify({
      jsonrpc: '2.0',
      id: this.requestIndex,
      method,
      ...(params && { params })
    })
    console.info('--- OUTGOING - REQUEST ---')
    console.info(JSON.stringify({
      jsonrpc: '2.0',
      method,
      ...(params && { params })
    }, null, 2))
    const requestByteLength = Buffer.byteLength(request, 'utf8')
    this.lsp.stdin.write(`Content-Length: ${requestByteLength}\r\n\r\n${request}`)

    return reqDeferred
  },
  /**
   * Send a notification
   *
   * @param {string} method Method name
   * @param {Object} [params] Parameters
   */
  sendNotification (method, params) {
    if (!this.lsp) { return }
    const request = JSON.stringify({
      jsonrpc: '2.0',
      method,
      ...(params && { params })
    })
    console.info('--- OUTGOING - NOTIFICATION ---')
    console.info(JSON.stringify({
      jsonrpc: '2.0',
      method,
      ...(params && { params })
    }, null, 2))
    const requestByteLength = Buffer.byteLength(request, 'utf8')
    this.lsp.stdin.write(`Content-Length: ${requestByteLength}\r\n\r\n${request}`)
  },
  /**
   * Shutdown the server
   *
   * @returns {Promise<void>} Promise
   */
  async shutdown (cleanup = false) {
    if (!this.lsp) { return }
    await this.sendRequest('shutdown')
    this.sendNotification('exit')
    if (cleanup) {
      this.lsp = null
      this.requests.clear()
      this.requestIndex = 0
      this.registeredCapabilities = []
      this.isReady = deferred()
    }
  }
}
