import { app, BrowserWindow, Menu, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tlm from './instrumentation.js'
import { trace } from '@opentelemetry/api'
import { registerMenu } from './menu.js'
import { loadDocument, registerCallbacks } from './handlers.js'
import { mergeWithHeaders } from './helpers.js'
import auth from './auth.js'
import git from './git.js'
import lsp from './lsp.js'
import updater from './updater.js'

const currentDir = fileURLToPath(new URL('.', import.meta.url))

// Initialize Instrumentation
tlm.initialize()
const tracer = trace.getTracer('draftforge', app.getVersion())

// needed in case process is undefined under Linux
// const platform = process.platform || os.platform()

// ensure only 1 instance of the app is running
const instanceLock = app.requestSingleInstanceLock()

// prevent electron from building a default menu
Menu.setApplicationMenu(null)

let splashWindow
let mainWindow
let mainMenu

function createWindow () {
  const span = tracer.startSpan('createWindow')

  // Show splash screen
  splashWindow = new BrowserWindow({
    width: 768,
    height: 280,
    transparent: true,
    frame: false,
    center: true,
    alwaysOnTop: true
  })
  splashWindow.loadFile(path.resolve(import.meta.dirname, process.env.QUASAR_PUBLIC_FOLDER, 'splash.html'))

  // -> Get primary screen dimensions
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  // -> Initial window options
  mainWindow = new BrowserWindow({
    show: false,
    icon: path.resolve(currentDir, 'icons/icon.png'), // tray icon
    width: Math.round(width * 0.9),
    height: Math.round(height * 0.9),
    minWidth: 1400,
    minHeight: 600,
    // useContentSize: true,
    center: true,
    frame: true,
    backgroundColor: '#000',
    // backgroundMaterial: 'auto',
    // vibrancy: 'under-window',
    darkTheme: true,
    webPreferences: {
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(currentDir, path.join(process.env.QUASAR_ELECTRON_PRELOAD_FOLDER, 'electron-preload' + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION)),
      sandbox: false,
      spellcheck: true
    }
  })

  // -> Set application menu
  mainMenu = registerMenu(mainWindow, updater)

  // -> Disable CORS
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(({ requestHeaders }, clb) => {
    mergeWithHeaders(requestHeaders, 'Access-Control-Allow-Origin', ['*'])
    clb({ requestHeaders })
  })
  mainWindow.webContents.session.webRequest.onHeadersReceived(({ responseHeaders }, clb) => {
    mergeWithHeaders(responseHeaders, 'Access-Control-Allow-Headers', ['*'])
    mergeWithHeaders(responseHeaders, 'Access-Control-Allow-Origin', ['*'])
    clb({ responseHeaders })
  })

  // -> Set spellchecker language
  mainWindow.webContents.session.setSpellCheckerLanguages(['en-US'])

  mainWindow.webContents.once('did-finish-load', () => {
    splashWindow.destroy()
    mainWindow.show()
    mainWindow.moveTop()
  })

  // -> Load start URL
  if (process.env.DEV) {
    mainWindow.loadURL(process.env.APP_URL)
  } else {
    mainWindow.loadFile('index.html')
  }

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools({
      activate: false,
      mode: 'detach',
      title: 'DraftForge DevTools'
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  auth.init(mainWindow)
  git.init()
  updater.init(mainWindow)

  registerCallbacks(mainWindow, mainMenu, auth, git, lsp, tlm)
  span.end()
}

if (!instanceLock) {
  app.exit()
} else {
  app.whenReady().then(createWindow)

  // Handle open document from Recent Files / drop onto macOS dock
  app.on('open-file', (ev, filePath) => {
    ev.preventDefault()
    loadDocument(mainWindow, filePath)
  })

  app.on('window-all-closed', async () => {
    // if (platform !== 'darwin') {
    await lsp.shutdown()
    app.quit()
    // }
  })

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    }
  })

  app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}
