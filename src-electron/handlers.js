import { app, dialog, ipcMain } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import orderBy from 'lodash/orderBy'

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
      await loadDocument(fl)
    }
  }
}

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

export async function saveDocumentAs (mainWindow, type, defaultFileName) {
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
  const saveOpts = await dialog.showSaveDialog(mainWindow, {
    title: 'Save As...',
    defaultPath: defaultFileName,
    filters,
    properties: ['showOverwriteConfirmation', 'createDirectory']
  })
  if (!saveOpts.canceled) {
    mainWindow.webContents.send('save', saveOpts.filePath)
  }
}

export async function selectWorkingDirectory (mainWindow, current) {
  const setWdOpts = await dialog.showOpenDialog(mainWindow, {
    title: 'Set Working Directory...',
    ...(current && { defaultPath: current }),
    properties: ['openDirectory', 'createDirectory', 'dontAddToRecent']
  })
  if (!setWdOpts.canceled && setWdOpts.filePaths.length > 0) {
    return setWdOpts.filePaths[0]
  } else {
    return ''
  }
}

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

export function registerCallbacks (mainWindow, mainMenu) {
  ipcMain.on('save', (ev, opts) => {
    saveDocument(mainWindow, opts.path, opts.data)
  })
  ipcMain.on('promptSaveAs', (ev, opts) => {
    saveDocumentAs(mainWindow, opts.type, opts.fileName)
  })
  ipcMain.on('openFromPath', (ev, opts) => {
    loadDocument(mainWindow, opts.path)
  })
  ipcMain.handle('promptWorkingDirectory', async (ev, opts) => {
    return selectWorkingDirectory(mainWindow, opts.current)
  })
  ipcMain.on('setMenuItemCheckedState', (ev, opts) => {
    const mItem = mainMenu.getMenuItemById(opts.id)
    if (mItem) {
      mItem.checked = opts.value
    } else {
      dialog.showErrorBox('Internal Error', `Invalid Menu Item ${opts.id} [checked: ${opts.value}]`)
    }
  })
  ipcMain.handle('readDirectory', async (evt, opts) => {
    return readDirectory(opts.dirPath)
  })
}
