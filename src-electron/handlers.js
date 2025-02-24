import { app, clipboard, dialog, ipcMain, shell } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pick, orderBy } from 'lodash-es'
import { encode, decode } from '@msgpack/msgpack'
import { getExtraFilePath } from './helpers'

/**
 * Show the Open Dialog
 */
export async function openDocument () {
  const files = await dialog.showOpenDialog(DFG.mainWindow, {
    title: 'Open Internet Draft / RFC...',
    filters: [
      {
        name: 'Internet Draft/RFC',
        extensions: ['md', 'txt', 'xml']
      }
    ],
    properties: ['openFile', 'multiSelections']
  })
  if (!files.canceled) {
    for (const fl of files.filePaths) {
      await loadDocument(DFG.mainWindow, fl)
    }
  }
}

/**
 * Load a document from the file system
 *
 * @param {*} filePath Path of the document to load
 */
export async function loadDocument (filePath) {
  const fileContents = await fs.readFile(filePath, 'utf8')
  let fileExtra = {}
  try {
    fileExtra = JSON.parse(await fs.readFile(getExtraFilePath(filePath), 'utf8'))
  } catch (err) {
    console.info(`No _draftforge.json extra file found or invalid format for ${filePath}.`)
  }
  const pathInfo = path.parse(filePath)
  DFG.mainWindow.webContents.send('openDocument', {
    type: pathInfo.ext.slice(1),
    path: filePath,
    fileName: pathInfo.base,
    data: fileContents,
    extra: fileExtra
  })
  app.addRecentDocument(filePath)
}

/**
 * Save a document to the file system
 *
 * @param {string} filePath Path where to save the document
 * @param {string} contents Contents of the file
 */
export async function saveDocument (filePath, contents, extra) {
  try {
    await fs.writeFile(filePath, contents, 'utf8')
    if (extra && Object.keys(extra).length > 0) {
      await fs.writeFile(getExtraFilePath(filePath), JSON.stringify(extra, null, 2), 'utf8')
    }
    DFG.mainWindow.webContents.send('notify', {
      message: 'Saved successfully.',
      color: 'positive',
      icon: 'mdi-check'
    })
  } catch (err) {
    console.warn(err)
    DFG.mainWindow.webContents.send('notify', {
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
 * @param {string} type File Type
 * @param {string} defaultFileName Default filename
 */
export async function saveDocumentAs (type, defaultFileName) {
  const saveOpts = await dialog.showSaveDialog(DFG.mainWindow, {
    title: 'Save As...',
    defaultPath: defaultFileName,
    filters: getFiltersForType(type),
    properties: ['showOverwriteConfirmation', 'createDirectory']
  })
  if (!saveOpts.canceled) {
    DFG.mainWindow.webContents.send('save', saveOpts.filePath)
  }
}

/**
 * Create new document
 *
 * @param {string} type File Type
 * @param {string} defaultFileName Default filename
 */
export async function createNewDocument (type, defaultFileName, contents) {
  const saveOpts = await dialog.showSaveDialog(DFG.mainWindow, {
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
 * @param {string} [current] Initial path
 * @param {string} title Dialog title
 * @returns {Promise<string>} Selected directory path
 */
export async function selectDirectory (current, title) {
  const setWdOpts = await dialog.showOpenDialog(DFG.mainWindow, {
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
 * @param {Object} mainMenu MainMenu instance
 * @param {Object} auth Auth instance
 * @param {Object} git Git instance
 * @param {Object} lsp LSP instance
 */
export function registerCallbacks () {
  // ----------------------------------------------------------
  // FILE SYSTEM
  // ----------------------------------------------------------
  ipcMain.handle('createNewDocument', (ev, opts) => {
    return createNewDocument(opts.type, opts.filename, opts.data)
  })
  ipcMain.on('open', (ev) => {
    openDocument()
  })
  ipcMain.on('save', (ev, opts) => {
    saveDocument(opts.path, opts.data, opts.extra)
  })
  ipcMain.handle('promptSave', async (ev, opts) => {
    return DFG.git.performFetch({ dir: opts.dir, remote: opts.remote })
  })
  ipcMain.on('promptSaveAs', (ev, opts) => {
    saveDocumentAs(opts.type, opts.fileName)
  })
  ipcMain.on('openFromPath', (ev, opts) => {
    loadDocument(opts.path)
  })
  ipcMain.handle('promptSelectDirectory', async (ev, opts) => {
    return selectDirectory(opts.current, opts.title ?? 'Select Directory...')
  })
  ipcMain.handle('readDirectory', async (ev, opts) => {
    return readDirectory(opts.dirPath)
  })
  // ----------------------------------------------------------
  // GIT
  // ----------------------------------------------------------
  ipcMain.handle('fetchGitConfig', async (ev) => {
    return {
      ...DFG.git.conf,
      pgpKey: Boolean(DFG.git.conf.publicKey)
    }
  })
  ipcMain.on('updateGitConfig', async (ev, conf) => {
    DFG.git.conf = {
      ...DFG.git.conf,
      ...conf
    }
    try {
      await DFG.git.saveConfig()
      if (DFG.git.conf.safeStorageEnabled) {
        await DFG.git.saveAuthConfig()
      } else if (DFG.git.conf.password || DFG.git.conf.publicKey) {
        DFG.mainWindow.webContents.send('notify', {
          message: 'Cannot save git auth settings',
          caption: 'Encrypted safe storage is not available on this system.',
          color: 'negative',
          icon: 'mdi-alert'
        })
      }
    } catch (err) {
      console.warn(err)
      DFG.mainWindow.webContents.send('notify', {
        message: 'Failed to save git config',
        caption: err.message,
        color: 'negative',
        icon: 'mdi-alert'
      })
    }
  })
  ipcMain.on('copyGitPublicKey', async (ev) => {
    clipboard.writeText(DFG.git.conf.publicKey)
  })
  ipcMain.handle('clearGitKey', async (ev) => {
    return DFG.git.clearSigningKey()
  })
  ipcMain.handle('gitSetWorkingDirectory', async (ev, opts) => {
    return DFG.git.setWorkingDirectory({ dir: opts.dir })
  })
  ipcMain.handle('gitPerformFetch', async (ev, opts) => {
    return DFG.git.performFetch({ remote: opts.remote })
  })
  ipcMain.handle('gitListRemotes', async (ev, opts) => {
    return DFG.git.listRemotes()
  })
  ipcMain.handle('gitAddRemote', async (ev, opts) => {
    return DFG.git.addRemote({ remote: opts.remote, url: opts.url })
  })
  ipcMain.handle('gitDeleteRemote', async (ev, opts) => {
    return DFG.git.deleteRemote({ remote: opts.remote })
  })
  ipcMain.handle('gitPull', async (ev, opts = {}) => {
    return DFG.git.pull({ remote: opts.remote, branch: opts.branch, mode: opts.mode })
  })
  ipcMain.handle('gitPush', async (ev, opts) => {
    return DFG.git.push({ remote: opts.remote, branch: opts.branch })
  })
  ipcMain.handle('gitListBranches', async (ev, opts) => {
    return DFG.git.listBranches({ remote: opts.remote })
  })
  ipcMain.handle('gitNewBranch', async (ev, opts) => {
    return DFG.git.newBranch({ branchName: opts.branchName, source: opts.source, tracking: opts.tracking })
  })
  ipcMain.handle('gitDeleteBranch', async (ev, opts) => {
    return DFG.git.deleteBranch({ branch: opts.branch })
  })
  ipcMain.handle('gitDeleteRemoteBranch', async (ev, opts) => {
    return DFG.git.deleteRemoteBranch({ branch: opts.branch, remote: opts.remote })
  })
  ipcMain.handle('gitSetBranchTracking', async (ev, opts) => {
    return DFG.git.setBranchTracking({ branch: opts.branch, tracking: opts.tracking })
  })
  ipcMain.handle('gitCheckoutBranch', async (ev, opts) => {
    return DFG.git.checkoutBranch({ branch: opts.branch, tracking: opts.tracking })
  })
  ipcMain.handle('gitCommitsLog', async (ev, opts) => {
    return DFG.git.commitsLog()
  })
  ipcMain.handle('gitStatusMatrix', async (ev, opts) => {
    return DFG.git.statusMatrix()
  })
  ipcMain.handle('gitStageFiles', async (ev, opts) => {
    return DFG.git.stageFiles({ files: opts.files })
  })
  ipcMain.handle('gitUnstageFiles', async (ev, opts) => {
    return DFG.git.unstageFiles({ files: opts.files })
  })
  ipcMain.handle('gitDiscardChanges', async (ev, opts) => {
    return DFG.git.discardChanges({ files: opts.files })
  })
  ipcMain.handle('gitCommit', async (ev, opts) => {
    return DFG.git.commit({ message: opts.message })
  })
  ipcMain.handle('gitCloneRepository', async (ev, opts) => {
    return DFG.git.repoClone({
      dir: opts.target,
      url: opts.url,
      upstreamUrl: opts.upstreamUrl,
      cloneInSubDir: opts.cloneInSubDir
    })
  })
  ipcMain.handle('gitInitRepository', async (ev, opts) => {
    return DFG.git.repoInit({
      dir: opts.target
    })
  })
  // ----------------------------------------------------------
  // LSP
  // ----------------------------------------------------------
  ipcMain.on('lspInitialize', (ev) => {
    DFG.lsp.init()
  })
  ipcMain.handle('lspSendRequest', async (ev, opts) => {
    return DFG.lsp.sendRequest(opts.method, opts.params)
  })
  ipcMain.on('lspSendNotification', (ev, opts) => {
    DFG.lsp.sendNotification(opts.method, opts.params)
  })
  // ----------------------------------------------------------
  // SAVE GENERIC CONTENT TO FILE
  // ----------------------------------------------------------
  ipcMain.handle('saveContentToFile', async (ev, opts) => {
    const saveOpts = await dialog.showSaveDialog(DFG.mainWindow, {
      title: opts.title ?? 'Save As...',
      defaultPath: opts.filePath || path.join(app.getPath('desktop'), 'output.txt'),
      filters: [{
        name: 'Plain Text',
        extensions: ['txt']
      }],
      properties: ['showOverwriteConfirmation', 'createDirectory']
    })
    if (!saveOpts.canceled) {
      try {
        await fs.writeFile(saveOpts.filePath, opts.output)
        return true
      } catch (err) {
        console.error(err)
        throw err
      }
    }
    return false
  })
  // ----------------------------------------------------------
  // TERMINAL
  // ----------------------------------------------------------
  ipcMain.on('terminalInit', (ev, opts) => {
    DFG.terminal.initialize(pick(opts, ['cwd', 'shell', 'args']))
  })
  ipcMain.on('terminalInput', (ev, data) => {
    DFG.terminal.write(data)
  })
  ipcMain.on('terminalDestroy', (ev, opts) => {
    DFG.terminal.destroy()
  })
  // ----------------------------------------------------------
  // MISC
  // ----------------------------------------------------------
  ipcMain.on('setMenuItemCheckedState', (ev, opts) => {
    const mItem = DFG.mainMenu.getMenuItemById(opts.id)
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
    DFG.tlm.conf.enabled = (opts.enabled === true)
    if (DFG.tlm.conf.enabled) {
      DFG.tlm.start()
    } else {
      DFG.tlm.stop()
    }
    DFG.tlm.saveConfig()
  })
  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------
  ipcMain.on('login', () => {
    DFG.auth.login()
  })
  ipcMain.on('logout', () => {
    DFG.auth.logout()
  })
  ipcMain.on('authFetchInfo', () => {
    DFG.auth.notify()
  })
}
