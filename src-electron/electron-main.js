import { app, BrowserWindow, Menu, nativeTheme, screen } from 'electron'
import { initialize, enable } from '@electron/remote/main'
import path from 'path'
import os from 'os'
import { registerMenu } from './menu'
import { loadDocument, registerCallbacks } from './handlers'
import { mergeWithHeaders } from './helpers'

// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

// ensure only 1 instance of the app is running
const instanceLock = app.requestSingleInstanceLock()

// prevent electron from building a default menu
Menu.setApplicationMenu(null)

try {
  if (platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(path.join(app.getPath('userData'), 'DevTools Extensions'))
  }
} catch (_) { }

let mainWindow
let mainMenu

function createWindow () {
  initialize()

  // -> Get primary screen dimensions
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  // -> Initial window options
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
    width: Math.round(width * 0.9),
    height: Math.round(height * 0.9),
    minWidth: 1400,
    minHeight: 600,
    // useContentSize: true,
    center: true,
    frame: true,
    // backgroundMaterial: 'auto',
    vibrancy: 'under-window',
    darkTheme: true,
    webPreferences: {
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
      sandbox: false,
      spellcheck: true
    }
  })

  // -> Set application menu
  mainMenu = registerMenu(mainWindow)

  enable(mainWindow.webContents)

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

  // -> Load start URL
  mainWindow.loadURL(process.env.APP_URL)

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    // mainWindow.webContents.openDevTools()
  }
  // } else {
  //   // we're on production; no access to devtools pls
  //   mainWindow.webContents.on('devtools-opened', () => {
  //     mainWindow.webContents.closeDevTools()
  //   })
  // }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  registerCallbacks(mainWindow, mainMenu)
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

  app.on('window-all-closed', () => {
    // if (platform !== 'darwin') {
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
