import { dialog } from 'electron'
import { spawn } from 'node:child_process'
import { deferred } from 'fast-defer'
import initOptions from './lsp/init-options.js'

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
    switch (process.platform) {
      case 'darwin': {
        this.lsp = spawn('./lemminx-osx-x86_64')
        break
      }
      case 'linux': {
        this.lsp = spawn('./lemminx-linux')
        break
      }
      case 'win32': {
        this.lsp = spawn('lemminx-win32.exe', {
          env: {
            windowsHide: true
          }
        })
        break
      }
      default: {
        dialog.showErrorBox('Unsupported Platform', 'The XML language server is not supported on this platform.')
        console.error('LSP: Unsupported platform')
        break
      }
    }

    // -> Handle stdio

    // this.lsp.stdout.setEncoding('utf8')
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

        // -> Convert JSON body
        const response = JSON.parse(reqBody)
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
