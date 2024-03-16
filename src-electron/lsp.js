import { app, dialog, net } from 'electron'
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
import { createMessageConnection, StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc'

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
  'textDocument/didChange',
  'client/registerCapability'
]

export default {
  lsp: null,
  connection: null,
  requests: new Map(),
  requestIndex: 0,
  registeredCapabilities: [],
  responseRemainingBytes: 0,
  responseChunk: '',
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

    // Download RNC files
    const schemasUrlBase = 'https://github.com/ietf-tools/rfcxml-templates-and-schemas/raw/main/'
    const schemasPathBase = path.join(app.getPath('appData'), app.name, 'rnc')
    try {
      await fs.mkdir(schemasPathBase)
      await fs.access(path.join(schemasPathBase, 'rfc7991bis.rnc'), fs.constants.R_OK)
      await fs.access(path.join(schemasPathBase, 'SVG-1.2-RFC.rnc'), fs.constants.R_OK)
    } catch (err) {
      if (net.isOnline()) {
        try {
          await pipeline(
            got.stream(`${schemasUrlBase}/rfc7991bis.rnc`),
            createWriteStream(path.join(schemasPathBase, 'rfc7991bis.rnc'))
          )
          await pipeline(
            got.stream(`${schemasUrlBase}/SVG-1.2-RFC.rnc`),
            createWriteStream(path.join(schemasPathBase, 'SVG-1.2-RFC.rnc'))
          )
        } catch (err) {
          console.warn(err)
          dialog.showErrorBox('XML RelaxNG Schema files download failed.', 'Schema validation will not be available.')
        }
      } else {
        dialog.showErrorBox('XML RelaxNG Schema files are missing and you are currently offline.', 'Schema validation will not be available.')
      }
    }

    // Spawn LSP process
    this.lsp = spawn(platformOpts.execPath)

    this.connection = createMessageConnection(
      new StreamMessageReader(this.lsp.stdout),
      new StreamMessageWriter(this.lsp.stdin)
    )

    this.connection.onRequest((method, params) => {
      if (method === 'client/registerCapability') {
        this.registeredCapabilities.push(...params.registrations)
        console.log(ansicolor.yellow('<<< INCOMING - REGISTER CAPABILITY <<< ') + params.registrations?.map(r => r.method).join(', '))
        return {}
      } else if (method === 'workspace/configuration') {
        const confArray = []
        for (const item of params.items) {
          switch (item.section) {
            case 'xml.format.insertSpaces': {
              confArray.push(true)
              break
            }
            case 'xml.format.tabSize': {
              confArray.push(2)
              break
            }
          }
        }
        return confArray
      } else {
        console.warn(ansicolor.red(`Unexpected LSP request: ${method} -> ${JSON.stringify(params)}`))
        return null
      }
    })
    this.connection.onNotification((method, params) => {
      if (process.env.DEBUGGING) {
        if (method === 'window/logMessage') {
          console.log(ansicolor.yellow('<<< INCOMING - LOG MSG <<<') + '\n' + params.message + '\n')
        } else if (debugIgnoreCommands.includes(method)) {
          console.log(ansicolor.lightYellow('<<< INCOMING < ') + method)
        } else {
          console.log(ansicolor.yellow('<<< INCOMING <<< ') + method)
          console.log(JSON.stringify(params, null, 2))
        }
      }
      mainWindow.webContents.send('lspNotification', { method, params })
    })

    this.connection.listen()

    this.connection.onError((data) => {
      console.error(`Lemminx Process Error: ${data}`)
    })

    this.connection.onClose(() => {
      console.log('Lemminx process exited')
    })

    // -> Send initialization sequence
    try {
      const initResult = await this.connection.sendRequest('initialize', makeInitConfig({
        fileAssociations: [
          {
            systemId: path.join(app.getPath('appData'), app.name, 'rnc/rfc7991bis.rnc'),
            pattern: '**/*.xml'
          }
        ]
      }))
      if (initResult?.capabilities?.textDocumentSync === 2) {
        this.connection.sendNotification('initialized')
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

    // -> Debug
    if (process.env.DEBUGGING) {
      if (!debugIgnoreCommands.includes(method)) {
        console.log(ansicolor.lightCyan('>>> OUTGOING >>>'))
        console.log(JSON.stringify({
          method,
          ...(params && { params })
        }, null, 2))
      } else {
        console.log(ansicolor.lightCyan('>>> OUTGOING > ') + method)
      }
    }

    return this.connection.sendRequest(method, params)
  },
  /**
   * Send a notification
   *
   * @param {string} method Method name
   * @param {Object} [params] Parameters
   */
  sendNotification (method, params) {
    if (!this.lsp) { return }

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

    this.connection.sendNotification(method, params)
  },
  /**
   * Shutdown the server
   *
   * @returns {Promise<void>} Promise
   */
  async shutdown (cleanup = false) {
    if (!this.lsp) { return }
    await this.sendRequest('shutdown', {})
    this.sendNotification('exit')
    if (cleanup) {
      this.connection.end()
      this.connection.dispose()
      this.lsp = null
      this.requests.clear()
      this.requestIndex = 0
      this.registeredCapabilities = []
      this.isReady = deferred()
    }
  }
}
