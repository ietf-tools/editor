import { app, clipboard, dialog, ipcMain, shell } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { orderBy } from 'lodash-es'
import { encode, decode } from '@msgpack/msgpack'

/**
 * Show the Open Dialog
 *
 * @param {Object} mainWindow MainWindow instance
 */
export async function openDocument (mainWindow) {
  const files = await dialog.showOpenDialog(mainWindow, {
    title: 'Open RFC / Internet Draft...',
    filters: [
      {
        name: 'RFC/Internet Draft',
        extensions: ['md', 'txt', 'xml']
      }
    ],
    properties: ['openFile', 'multiSelections']
  })
  if (!files.canceled) {
    for (const fl of files.filePaths) {
      await loadDocument(mainWindow, fl)
    }
  }
}

/**
 * Load a document from the file system
 *
 * @param {Object} mainWindow MainWindow instance
 * @param {*} filePath Path of the document to load
 */
export async function loadDocument (mainWindow, filePath) {
  const fileContents = await fs.readFile(filePath, 'utf8')
  const pathInfo = path.parse(filePath)
  mainWindow.webContents.send('openDocument', {
    type: pathInfo.ext.slice(1),
    path: filePath,
    fileName: pathInfo.base,
    data: fileContents
  })
  app.addRecentDocument(filePath)
}

/**
 * Save a document to the file system
 *
 * @param {Object} mainWindow MainWindow instance
 * @param {string} filePath Path where to save the document
 * @param {string} contents Contents of the file
 */
export async function saveDocument (mainWindow, filePath, contents) {
  try {
    await fs.writeFile(filePath, contents, 'utf8')
    mainWindow.webContents.send('notify', {
      message: 'Saved successfully.',
      color: 'positive',
      icon: 'mdi-check'
    })
  } catch (err) {
    console.warn(err)
    mainWindow.webContents.send('notify', {
      message: 'Failed to save',
      caption: err.message,
      color: 'negative',
      icon: 'mdi-alert'
    })
  }
}

/**
 * Save a document as a new file (Save As)
 *
 * @param {Object} mainWindow MainWindow instance
 * @param {string} type File Type
 * @param {string} defaultFileName Default filename
 */
export async function saveDocumentAs (mainWindow, type, defaultFileName) {
  const saveOpts = await dialog.showSaveDialog(mainWindow, {
    title: 'Save As...',
    defaultPath: defaultFileName,
    filters: getFiltersForType(type),
    properties: ['showOverwriteConfirmation', 'createDirectory']
  })
  if (!saveOpts.canceled) {
    mainWindow.webContents.send('save', saveOpts.filePath)
  }
}

/**
 * Create new document
 *
 * @param {Object} mainWindow MainWindow instance
 * @param {string} type File Type
 * @param {string} defaultFileName Default filename
 */
export async function createNewDocument (mainWindow, type, defaultFileName, contents) {
  const saveOpts = await dialog.showSaveDialog(mainWindow, {
    title: 'New Document',
    defaultPath: defaultFileName,
    filters: getFiltersForType(type),
    properties: ['showOverwriteConfirmation', 'createDirectory']
  })
  if (!saveOpts.canceled) {
    const pathParts = path.parse(saveOpts.filePath)
    await fs.writeFile(saveOpts.filePath, contents, 'utf8')
    return {
      fileName: pathParts.base,
      filePath: saveOpts.filePath
    }
  } else {
    return null
  }
}

/**
 * Show the Select Directory dialog
 *
 * @param {Object} mainWindow MainWindow instance
 * @param {string} [current] Initial path
 * @param {string} title Dialog title
 * @returns {Promise<string>} Selected directory path
 */
export async function selectDirectory (mainWindow, current, title) {
  const setWdOpts = await dialog.showOpenDialog(mainWindow, {
    title,
    ...(current && { defaultPath: current }),
    properties: ['openDirectory', 'createDirectory', 'dontAddToRecent']
  })
  if (!setWdOpts.canceled && setWdOpts.filePaths.length > 0) {
    return setWdOpts.filePaths[0]
  } else {
    return ''
  }
}

/**
 * List all files / directories in a directory
 *
 * @param {string} dirPath Directory path
 * @returns {Promise<Array>} List of files / directories
 */
export async function readDirectory (dirPath) {
  const dirItems = []
  const files = await fs.readdir(dirPath, { withFileTypes: true })
  for (const file of files) {
    if (!file.isDirectory() && !file.isFile()) { continue }
    dirItems.push({
      isDirectory: file.isDirectory(),
      name: file.name,
      path: path.join(file.path, file.name)
    })
  }
  return orderBy(dirItems, ['isDirectory', 'name'], ['desc', 'asc'])
}

/**
 * Get Save Dialog filters based on the provided type.
 *
 * @param {string} type - The type of filters to retrieve.
 * @returns {Array} - An array of filters.
 */
function getFiltersForType (type) {
  const filters = []
  switch (type) {
    case 'xml': {
      filters.push({
        name: 'XML RFC v3',
        extensions: ['xml']
      })
      break
    }
    case 'md': {
      filters.push({
        name: 'Markdown',
        extensions: ['md']
      })
      break
    }
    case 'txt': {
      filters.push({
        name: 'Plain Text',
        extensions: ['txt']
      })
      break
    }
  }
  return filters
}

/**
 * Register callback handlers
 *
 * @param {Object} mainWindow MainWindow instance
 * @param {Object} mainMenu MainMenu instance
 * @param {Object} auth Auth instance
 * @param {Object} git Git instance
 * @param {Object} lsp LSP instance
 */
export function registerCallbacks (mainWindow, mainMenu, auth, git, lsp, tlm) {
  // ----------------------------------------------------------
  // FILE SYSTEM
  // ----------------------------------------------------------
  ipcMain.handle('createNewDocument', (ev, opts) => {
    return createNewDocument(mainWindow, opts.type, opts.filename, opts.data)
  })
  ipcMain.on('open', (ev) => {
    openDocument(mainWindow)
  })
  ipcMain.on('save', (ev, opts) => {
    saveDocument(mainWindow, opts.path, opts.data)
  })
  ipcMain.handle('promptSave', async (ev, opts) => {
    return git.performFetch({ dir: opts.dir, remote: opts.remote })
  })
  ipcMain.on('promptSaveAs', (ev, opts) => {
    saveDocumentAs(mainWindow, opts.type, opts.fileName)
  })
  ipcMain.on('openFromPath', (ev, opts) => {
    loadDocument(mainWindow, opts.path)
  })
  ipcMain.handle('promptSelectDirectory', async (ev, opts) => {
    return selectDirectory(mainWindow, opts.current, opts.title ?? 'Select Directory...')
  })
  ipcMain.handle('readDirectory', async (ev, opts) => {
    return readDirectory(opts.dirPath)
  })
  // ----------------------------------------------------------
  // GIT
  // ----------------------------------------------------------
  ipcMain.handle('fetchGitConfig', async (ev) => {
    return {
      ...git.conf,
      pgpKey: Boolean(git.conf.publicKey)
    }
  })
  ipcMain.on('updateGitConfig', async (ev, conf) => {
    git.conf = {
      ...git.conf,
      ...conf
    }
    try {
      await git.saveConfig()
      if (git.conf.safeStorageEnabled) {
        await git.saveAuthConfig()
      } else if (git.conf.password || git.conf.publicKey) {
        mainWindow.webContents.send('notify', {
          message: 'Cannot save git auth settings',
          caption: 'Encrypted safe storage is not available on this system.',
          color: 'negative',
          icon: 'mdi-alert'
        })
      }
    } catch (err) {
      console.warn(err)
      mainWindow.webContents.send('notify', {
        message: 'Failed to save git config',
        caption: err.message,
        color: 'negative',
        icon: 'mdi-alert'
      })
    }
  })
  ipcMain.on('copyGitPublicKey', async (ev) => {
    clipboard.writeText(git.conf.publicKey)
  })
  ipcMain.handle('clearGitKey', async (ev) => {
    return git.clearSigningKey()
  })
  ipcMain.handle('gitSetWorkingDirectory', async (ev, opts) => {
    return git.setWorkingDirectory({ dir: opts.dir })
  })
  ipcMain.handle('gitPerformFetch', async (ev, opts) => {
    return git.performFetch({ remote: opts.remote })
  })
  ipcMain.handle('gitListRemotes', async (ev, opts) => {
    return git.listRemotes()
  })
  ipcMain.handle('gitAddRemote', async (ev, opts) => {
    return git.addRemote({ remote: opts.remote, url: opts.url })
  })
  ipcMain.handle('gitDeleteRemote', async (ev, opts) => {
    return git.deleteRemote({ remote: opts.remote })
  })
  ipcMain.handle('gitPull', async (ev, opts = {}) => {
    return git.pull({ remote: opts.remote, branch: opts.branch, mode: opts.mode })
  })
  ipcMain.handle('gitListBranches', async (ev, opts) => {
    return git.listBranches({ remote: opts.remote })
  })
  ipcMain.handle('gitCommitsLog', async (ev, opts) => {
    return git.commitsLog()
  })
  ipcMain.handle('gitStatusMatrix', async (ev, opts) => {
    return git.statusMatrix()
  })
  ipcMain.handle('gitStageFiles', async (ev, opts) => {
    return git.stageFiles({ files: opts.files })
  })
  ipcMain.handle('gitUnstageFiles', async (ev, opts) => {
    return git.unstageFiles({ files: opts.files })
  })
  ipcMain.handle('gitDiscardChanges', async (ev, opts) => {
    return git.discardChanges({ files: opts.files })
  })
  ipcMain.handle('gitCommit', async (ev, opts) => {
    return git.commit({ message: opts.message })
  })
  ipcMain.handle('gitCloneRepository', async (ev, opts) => {
    return git.repoClone({
      dir: opts.target,
      url: opts.url,
      upstreamUrl: opts.upstreamUrl
    })
  })
  // ----------------------------------------------------------
  // LSP
  // ----------------------------------------------------------
  ipcMain.on('lspInitialize', (ev) => {
    lsp.init(mainWindow)
  })
  ipcMain.handle('lspSendRequest', async (ev, opts) => {
    return lsp.sendRequest(opts.method, opts.params)
  })
  ipcMain.on('lspSendNotification', (ev, opts) => {
    lsp.sendNotification(opts.method, opts.params)
  })
  // ----------------------------------------------------------
  // MISC
  // ----------------------------------------------------------
  ipcMain.on('setMenuItemCheckedState', (ev, opts) => {
    const mItem = mainMenu.getMenuItemById(opts.id)
    if (mItem) {
      mItem.checked = opts.value
    } else {
      dialog.showErrorBox('Internal Error', `Invalid Menu Item ${opts.id} [checked: ${opts.value}]`)
    }
  })
  ipcMain.on('writeToClipboard', (ev, opts) => {
    clipboard.writeText(opts.text)
  })
  ipcMain.on('launchBrowser', (ev, opts) => {
    if (opts.url?.startsWith('https://')) {
      shell.openExternal(opts.url, {
        activate: true
      })
    }
  })
  ipcMain.handle('persistSession', async (ev, data) => {
    const sessionPath = path.join(app.getPath('userData'), 'draftforge-session.bin')
    try {
      await fs.writeFile(sessionPath, encode(data))
    } catch (err) {
      console.error(err)
      throw err
    }
  })
  ipcMain.handle('restoreSession', async (ev) => {
    const sessionPath = path.join(app.getPath('userData'), 'draftforge-session.bin')
    try {
      const restoredData = await fs.readFile(sessionPath)
      return decode(restoredData)
    } catch (err) {
      console.error(err)
      return null
    }
  })
  ipcMain.on('setTelemetryState', (ev, opts) => {
    tlm.conf.enabled = (opts.enabled === true)
    if (tlm.conf.enabled) {
      tlm.start()
    } else {
      tlm.stop()
    }
    tlm.saveConfig()
  })
  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------
  ipcMain.on('login', () => {
    auth.login()
  })
  ipcMain.on('logout', () => {
    auth.logout()
  })
  ipcMain.on('authFetchInfo', () => {
    auth.notify()
  })
}
