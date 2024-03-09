import { app, dialog } from 'electron'
import { spawn } from 'node:child_process'
import { deferred } from 'fast-defer'
import { makeInitConfig } from './lsp/init-options.js'
import { createWriteStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import got from 'got'
import { setTimeout } from 'node:timers/promises'
import ansicolor from 'ansicolor'
// import { URI } from 'vscode-uri'

const platform = {
  darwin: {
    exec: 'lemminx-darwin',
    execPath: path.join(app.getPath('appData'), app.name, 'lemminx-darwin'),
    env: {}
  },
  linux: {
    exec: 'lemminx-linux',
    execPath: path.join(app.getPath('appData'), app.name, 'lemminx-linux'),
    env: {}
  },
  win32: {
    exec: 'lemminx-win32.exe',
    execPath: path.join(app.getPath('appData'), app.name, 'lemminx-win32.exe'),
    env: {
      windowsHide: true
    }
  }
}

const debugIgnoreCommands = [
  'textDocument/formatting',
  'textDocument/rangeFormatting',
  'textDocument/completion',
  'textDocument/foldingRange',
  'textDocument/publishDiagnostics',
  'textDocument/didOpen',
  'textDocument/didClose',
  'textDocument/didChange'
  // 'client/registerCapability'
]

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
    console.info('Initializing LSP...')
    const platformOpts = platform[process.platform]
    if (!platformOpts) {
      dialog.showErrorBox('Unsupported Platform', 'The XML language server is not supported on this platform.')
      console.error('LSP: Unsupported platform')
      return
    }

    let isInstalled = false
    try {
      await fs.access(platformOpts.execPath, fs.constants.X_OK)
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
    } else {
      try {
        await this.downloadServer(mainWindow)
        this.startServer(mainWindow)
      } catch (err) {
        dialog.showErrorBox('LSP Server Download Failed', err.message)
      }
    }
  },
  /**
   * Downloads and installs the XML Language Server.
   *
   * @param {Electron.BrowserWindow} mainWindow - The main browser window.
   * @returns {Promise<void>} - A promise that resolves when the server is downloaded and installed.
   * @throws {Error} - If there is an error during the download or installation process.
   */
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
        createWriteStream(platformOpts.execPath)
      )
      if (process.platform !== 'win32') {
        await fs.chmod(platformOpts.execPath, 0o775)
      }
      await fs.access(platformOpts.execPath, fs.constants.X_OK)
    } catch (err) {
      console.warn(err)
      mainWindow.webContents.send('setProgressDialog', { isShown: false })
      try {
        await fs.unlink(platformOpts.execPath)
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
  /**
   * Starts the LSP (Language Server Protocol) server.
   *
   * @param {Electron.BrowserWindow} mainWindow - The main Electron browser window.
   * @returns {Promise<void>} - A promise that resolves when the server is started successfully.
   * @throws {Error} - If there is an error during server initialization.
   */
  async startServer (mainWindow) {
    const platformOpts = platform[process.platform]

    // Install RNC files

    try {
      await fs.cp(
        path.join(process.cwd(), 'public/rnc/'),
        path.join(app.getPath('appData'), app.name, 'rnc/'),
        {
          mode: fs.constants.COPYFILE_FICLONE,
          errorOnExist: false,
          force: true,
          recursive: true
        }
      )
    } catch (err) {
      console.error(err)
      dialog.showErrorBox('XML Schema RelaxNG copy failed.', err.message)
    }

    // Spawn LSP process
    this.lsp = spawn(platformOpts.execPath)

    // -> Handle stdio
    this.lsp.stdout.on('data', (data) => {
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

        // -> Debug
        if (process.env.DEBUGGING) {
          if (response.method === 'window/logMessage') {
            console.log(ansicolor.yellow('<<< INCOMING - LOG MSG <<<') + '\n' + response.params.message + '\n')
          } else if (debugIgnoreCommands.includes(response.method) || (!response.method && response.id)) {
            if (response.method) {
              console.log(ansicolor.lightYellow('<<< INCOMING < ') + response.method)
            }
          } else {
            console.log(ansicolor.yellow('<<< INCOMING <<<'))
            console.log(JSON.stringify(response, null, 2))
          }
        }

        // -> Handle callback requests
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
      console.info(path.join(app.getPath('appData'), app.name, 'rnc/rfc7991bis.rnc'))
      const initResult = await this.sendRequest('initialize', makeInitConfig({
        fileAssociations: [
          {
            systemId: path.join(app.getPath('appData'), app.name, 'rnc/rfc7991bis.rnc'),
            pattern: '*'
          }
        ]
      }))
      if (initResult?.capabilities?.textDocumentSync === 2) {
        this.sendNotification('initialized')
        this.isReady.resolve()
        console.info('LSP initialized successfully.')
        this.registerRNC()
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

    // -> Debug
    if (process.env.DEBUGGING) {
      if (!debugIgnoreCommands.includes(method)) {
        console.log(ansicolor.lightCyan('>>> OUTGOING >>>'))
        console.log(JSON.stringify({
          id: this.requestIndex,
          method,
          ...(params && { params })
        }, null, 2))
      } else {
        console.log(ansicolor.lightCyan('>>> OUTGOING > ') + method)
      }
    }

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

    // -> Debug
    if (process.env.DEBUGGING) {
      if (!debugIgnoreCommands.includes(method)) {
        console.log(ansicolor.lightCyan('>>> OUTGOING >>>'))
        console.info(JSON.stringify({
          method,
          ...(params && { params })
        }, null, 2) + '\n')
      } else {
        console.log(ansicolor.lightCyan('>>> OUTGOING > ') + method)
      }
    }

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
  },

  async registerRNC () {
    // await setTimeout(2000)
    // this.sendNotification('workspace/didChangeWorkspaceFolders', {
    //   event: {
    //     added: [
    //       {
    //         uri: URI.file('C:/Users/ngpix/Desktop/testdraft').toString(),
    //         name: 'workspace'
    //       }
    //     ],
    //     removed: []
    //   }
    // })
    // const rnc = await fs.readFile(path.resolve(app.getAppPath(), process.env.QUASAR_PUBLIC_FOLDER, 'rnc/rfc7991bis.rnc'), 'utf8')
    // this.sendNotification('textDocument/didOpen', {
    //   textDocument: {
    //     uri: 'file:///rfc7991bis.rnc',
    //     languageId: 'rnc',
    //     version: 1,
    //     text: rnc
    //   }
    // })
  }
}
