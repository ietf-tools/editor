import { Menu, app, dialog, shell } from 'electron'
import os from 'node:os'
import fs from 'node:fs/promises'
import path from 'node:path'

export function registerMenu (mainWindow) {
  const platform = process.platform || os.platform()
  const isMac = platform === 'darwin'

  /**
   * Menu Template
   */
  const menuTemplate = [
    ...isMac ? [{ role: 'appMenu' }] : [],
    {
      role: 'fileMenu',
      submenu: [
        {
          label: 'New Draft...',
          accelerator: 'CommandOrControl+N',
          click () {
            mainWindow.webContents.send('dialogAction', 'newDraft')
          }
        },
        {
          label: 'Open...',
          accelerator: 'CommandOrControl+O',
          async click () {
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
        },
        {
          label: 'Open from URL...',
          click () {
            mainWindow.webContents.send('dialogAction', 'openFromURL')
          }
        },
        {
          label: 'Open Recent',
          role: 'recentDocuments',
          submenu: [
            {
              label: 'Clear Recent',
              role: 'clearRecentDocuments',
              click () {
                app.clearRecentDocuments()
              }
            }
          ]
        },
        {
          type: 'separator'
        },
        {
          label: 'Save',
          accelerator: 'CommandOrControl+S',
          click () {

          }
        },
        {
          label: 'Save As...',
          accelerator: 'CommandOrControl+Shift+S',
          async click () {
            const saveOpts = await dialog.showSaveDialog(mainWindow, {
              title: 'Save As...',
              filters: [
                {
                  name: 'RFC/Internet Draft',
                  extensions: ['txt', 'xml']
                }
              ],
              properties: ['showOverwriteConfirmation', 'createDirectory']
            })
            if (!saveOpts.canceled) {
              mainWindow.webContents.send('saveAs', saveOpts.filePath)
            }
          }
        },
        {
          label: 'Move To...'
        },
        {
          label: 'Export',
          submenu: [
            {
              label: 'All'
            },
            {
              label: 'HTML'
            },
            {
              label: 'PDF'
            },
            {
              label: 'Text'
            },
            {
              label: 'Comments'
            },
            {
              label: 'Code Components'
            },
            {
              label: 'XML'
            }
          ]
        },
        {
          type: 'separator'
        },
        {
          label: 'Preferences'
        },
        {
          type: 'separator'
        },
        {
          role: isMac ? 'close' : 'quit'
        }
      ]
    },
    {
      label: 'Edit',
      role: 'editMenu',
      submenu: [
        {
          role: 'undo',
          click () {
            mainWindow.webContents.send('editorAction', 'undo')
          }
        },
        {
          role: 'redo',
          click () {
            mainWindow.webContents.send('editorAction', 'redo')
          }
        },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        {
          label: 'Find',
          submenu: [
            {
              label: 'Find',
              accelerator: 'CommandOrControl+F',
              click () {
                mainWindow.webContents.send('editorAction', 'find')
              }
            },
            {
              label: 'Find and Replace',
              accelerator: 'CommandOrControl+H',
              click () {
                mainWindow.webContents.send('editorAction', 'findAndReplace')
              }
            },
            {
              label: 'Find Next',
              click () {
                mainWindow.webContents.send('editorAction', 'findNext')
              }
            },
            {
              label: 'Find Previous',
              click () {
                mainWindow.webContents.send('editorAction', 'findPrevious')
              }
            },
            {
              label: 'Find BCP14 Keywords'
            },
            {
              label: 'Find Xrefs'
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Spelling and Grammar',
          submenu: [
            {
              label: 'Check Spelling'
            },
            {
              label: 'Check Grammar'
            },
            {
              label: 'Check for Common Typos'
            },
            {
              label: 'Check for Duplicates'
            }
          ]
        }
      ]
    },
    {
      label: 'Selection',
      submenu: [
        {
          label: 'Select All',
          accelerator: 'CommandOrControl+A',
          click () {
            mainWindow.webContents.send('editorAction', 'selectAll')
          }
        },
        {
          label: 'Expand Selection',
          accelerator: 'Shift+Alt+Right',
          click () {
            mainWindow.webContents.send('editorAction', 'expandSelection')
          }
        },
        {
          label: 'Shrink Selection',
          accelerator: 'Shift+Alt+Left',
          click () {
            mainWindow.webContents.send('editorAction', 'shrinkSelection')
          }
        },
        { type: 'separator' },
        {
          label: 'Copy Line Up',
          accelerator: 'Shift+Alt+Up',
          click () {
            mainWindow.webContents.send('editorAction', 'copyLineUp')
          }
        },
        {
          label: 'Copy Line Down',
          accelerator: 'Shift+Alt+Down',
          click () {
            mainWindow.webContents.send('editorAction', 'copyLineDown')
          }
        },
        {
          label: 'Move Line Up',
          accelerator: 'Alt+Up',
          click () {
            mainWindow.webContents.send('editorAction', 'moveLineUp')
          }
        },
        {
          label: 'Move Line Down',
          accelerator: 'Alt+Down',
          click () {
            mainWindow.webContents.send('editorAction', 'moveLineDown')
          }
        },
        {
          label: 'Duplicate Selection',
          click () {
            mainWindow.webContents.send('editorAction', 'duplicateSelection')
          }
        },
        { type: 'separator' },
        {
          label: 'Add Cursor Above',
          accelerator: 'CommandOrControl+Alt+Up',
          click () {
            mainWindow.webContents.send('editorAction', 'addCursorAbove')
          }
        },
        {
          label: 'Add Cursor Below',
          accelerator: 'CommandOrControl+Alt+Down',
          click () {
            mainWindow.webContents.send('editorAction', 'addCursorBelow')
          }
        },
        {
          label: 'Add Cursors to Line Ends',
          accelerator: 'Shift+Alt+I',
          click () {
            mainWindow.webContents.send('editorAction', 'addCursorsToLineEnds')
          }
        },
        {
          label: 'Add Next Occurence',
          accelerator: 'CommandOrControl+D',
          click () {
            mainWindow.webContents.send('editorAction', 'addNextOccurence')
          }
        },
        {
          label: 'Add Previous Occurence',
          click () {
            mainWindow.webContents.send('editorAction', 'addPreviousOccurence')
          }
        },
        {
          label: 'Select All Occurences',
          accelerator: 'CommandOrControl+Shift+L',
          click () {
            mainWindow.webContents.send('editorAction', 'selectAllOccurences')
          }
        }
      ]
    },
    {
      role: 'viewMenu',
      submenu: [
        {
          label: 'Command Palette...',
          accelerator: 'F1',
          click () {
            mainWindow.webContents.send('editorAction', 'commandPalette')
          }
        },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CommandOrControl+=',
          click () {
            mainWindow.webContents.send('editorAction', 'zoomIn')
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CommandOrControl+-',
          click () {
            mainWindow.webContents.send('editorAction', 'zoomOut')
          }
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CommandOrControl+0',
          click () {
            mainWindow.webContents.send('editorAction', 'zoomReset')
          }
        },
        { type: 'separator' },
        {
          label: 'Preview Output',
          submenu: [
            {
              label: 'HTML',
              type: 'radio',
              checked: true
            },
            {
              label: 'Text',
              type: 'radio'
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Word Wrap',
          type: 'checkbox',
          checked: true,
          accelerator: 'Alt+Z',
          click () {
            mainWindow.webContents.send('editorAction', 'wordWrap')
          }
        }
      ]
    },
    {
      label: 'Insert',
      submenu: [
        {
          label: 'Insert BCP14 Tags'
        },
        {
          label: 'Insert Empty Reference'
        },
        {
          label: 'Create Table'
        }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Validate RFCXML'
        },
        {
          label: 'Check ID Nits',
          click () {
            mainWindow.webContents.send('editorAction', 'checkIdNits')
          }
        },
        {
          label: 'Check References'
        },
        {
          label: 'Check non-ASCII'
        },
        {
          label: 'Check PDF Fonts'
        },
        {
          label: 'Check Inclusive Language'
        },
        {
          label: 'Check SVG'
        }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Documentation'
        },
        {
          label: 'RFCXML Vocabulary'
        },
        { type: 'separator' },
        {
          label: 'Release Notes',
          click () {
            shell.openExternal('https://github.com/ietf-tools/editor/releases')
          }
        },
        {
          label: 'Report Issue',
          click () {
            shell.openExternal('https://github.com/ietf-tools/editor/issues')
          }
        },
        {
          label: 'View License',
          click () {
            shell.openExternal('https://github.com/ietf-tools/editor/blob/main/LICENSE')
          }
        },
        { type: 'separator' },
        {
          label: 'Check for Updates...'
        },
        { type: 'separator' },
        {
          label: 'Debug',
          submenu: [
            {
              role: 'reload'
            },
            {
              role: 'forceReload'
            },
            {
              role: 'toggleDevTools'
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'About',
          click () {
            mainWindow.webContents.send('dialogAction', 'helpAbout')
          }
        }
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
}
