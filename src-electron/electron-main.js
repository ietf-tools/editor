import { app, BrowserWindow, nativeTheme, screen } from 'electron'
import { initialize, enable } from '@electron/remote/main'
import path from 'path'
import os from 'os'

import { registerMenu } from './menu'
import { registerCallbacks } from './handlers'

/**
 * Merge new header with existing headers, handling lowercase header duplicates
 *
 * @param {Object} headers Existing headers
 * @param {string} key New Header Key, in normal ccase
 * @param {string} value New Header Value
 */
function mergeWithHeaders (headers = {}, key, value) {
  const lowerKey = key.toLowerCase()
  if (lowerKey in headers) {
    headers[lowerKey] = value
  } else {
    headers[key] = value
  }
}

// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

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

  /**
   * Initial window options
   */
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
      sandbox: false
    }
  })

  mainMenu = registerMenu(mainWindow)
  // mainWindow.setMenu(null)

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

app.whenReady().then(createWindow)

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
