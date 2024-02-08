import { app, dialog } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function openDocument (mainWindow) {
  const files = await dialog.showOpenDialog(mainWindow, {
    title: 'Open RFC / Internet Draft...',
    filters: [
      {
        name: 'RFC/Internet Draft',
        extensions: ['txt', 'xml']
      }
    ],
    properties: ['openFile', 'multiSelections']
  })
  if (!files.canceled) {
    for (const fl of files.filePaths) {
      const fileContents = await fs.readFile(fl, 'utf8')
      mainWindow.webContents.send('openDocument', {
        path: fl,
        fileName: path.parse(fl).base,
        data: fileContents
      })
      app.addRecentDocument(fl)
    }
  }
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
