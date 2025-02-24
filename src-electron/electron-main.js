import { app, dialog, BrowserWindow, Menu, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cmdExists from 'command-exists'
import tlm from './instrumentation.js'
import { trace } from '@opentelemetry/api'
import { registerMenu } from './menu.js'
import { loadDocument, registerCallbacks } from './handlers.js'
import { mergeWithHeaders } from './helpers.js'
import auth from './auth.js'
import git from './git.js'
import lsp from './lsp.js'
import updater from './updater.js'
import terminal from './terminal.js'
import { createKeybindingsHandler } from './keyhandler.js'

const DFG = {
  currentDir: fileURLToPath(new URL('.', import.meta.url)),
  mainWindow: null,
  mainMenu: null,
  auth,
  git,
  lsp,
  updater,
  terminal,
  tlm
}
global.DFG = DFG

// Initialize Instrumentation
DFG.tlm.initialize()
const tracer = trace.getTracer('draftforge', app.getVersion())

// ensure only 1 instance of the app is running
const instanceLock = app.requestSingleInstanceLock()

// prevent electron from building a default menu
Menu.setApplicationMenu(null)

let splashWindow

const menuHandlers = createKeybindingsHandler({
  'Escape d': () => {
    console.info('SHIFT + D')
  },
  'y e e t': () => {
    console.info("The keys 'y', 'e', 'e', and 't' were pressed in order")
  },
  '$mod+([0-9])': (event, input) => {
    console.info(`Either 'Control+${input.key}' or 'Meta+${input.key}' were pressed`)
  },
})

async function createWindow () {
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

  // Ensure git is install
  try {
    await cmdExists('git')
  } catch (err) {
    splashWindow.destroy()
    dialog.showErrorBox('Missing Git Dependency', 'Git is not installed or is not in path. Install git first and then launch DraftForge again.')
    app.exit(1)
  }

  // -> Get primary screen dimensions
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  // -> Initial window options
  DFG.mainWindow = new BrowserWindow({
    show: false,
    icon: path.resolve(DFG.currentDir, 'icons/icon.png'), // tray icon
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
      preload: path.resolve(DFG.currentDir, path.join(process.env.QUASAR_ELECTRON_PRELOAD_FOLDER, 'electron-preload' + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION)),
      sandbox: false,
      spellcheck: true
    }
  })

  // -> Set application menu
  DFG.mainMenu = registerMenu()

  // -> Disable CORS
  DFG.mainWindow.webContents.session.webRequest.onBeforeSendHeaders(({ requestHeaders }, clb) => {
    mergeWithHeaders(requestHeaders, 'Access-Control-Allow-Origin', ['*'])
    clb({ requestHeaders })
  })
  DFG.mainWindow.webContents.session.webRequest.onHeadersReceived(({ responseHeaders }, clb) => {
    mergeWithHeaders(responseHeaders, 'Access-Control-Allow-Headers', ['*'])
    mergeWithHeaders(responseHeaders, 'Access-Control-Allow-Origin', ['*'])
    clb({ responseHeaders })
  })

  // -> Set spellchecker language
  DFG.mainWindow.webContents.session.setSpellCheckerLanguages(['en-US'])

  DFG.mainWindow.webContents.once('did-finish-load', () => {
    splashWindow.destroy()
    DFG.mainWindow.show()
    DFG.mainWindow.moveTop()

    DFG.mainWindow.webContents.on('before-input-event', (evt, input) => {
      if (input?.type === 'keyDown') {
        menuHandlers(evt, input)
      }
    })
  })

  // -> Load start URL
  if (process.env.DEV) {
    DFG.mainWindow.loadURL(process.env.APP_URL)
  } else {
    DFG.mainWindow.loadFile('index.html')
  }

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    DFG.mainWindow.webContents.openDevTools({
      activate: false,
      mode: 'detach',
      title: 'DraftForge DevTools'
    })
  }

  DFG.mainWindow.on('closed', () => {
    DFG.mainWindow = null
  })

  DFG.auth.init()
  DFG.git.init()
  DFG.updater.init()

  registerCallbacks()
  span.end()
}

if (!instanceLock) {
  app.exit()
} else {
  app.whenReady().then(createWindow)

  // Handle open document from Recent Files / drop onto macOS dock
  app.on('open-file', (ev, filePath) => {
    ev.preventDefault()
    loadDocument(filePath)
  })

  app.on('window-all-closed', async () => {
    await DFG.lsp.shutdown()
    app.quit()
  })

  app.on('activate', () => {
    if (DFG.mainWindow === null) {
      createWindow()
    }
  })

  app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
    // Someone tried to run a second instance, we should focus our window.
    if (DFG.mainWindow) {
      if (DFG.mainWindow.isMinimized()) {
        DFG.mainWindow.restore()
      }
      DFG.mainWindow.focus()
    }
  })
}
