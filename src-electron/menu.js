import { Menu, shell } from 'electron'
import os from 'os'

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
          accelerator: 'CommandOrControl+N'
        },
        {
          label: 'Open...',
          accelerator: 'CommandOrControl+O'
        },
        {
          label: 'Open Recent',
          role: 'recentDocuments',
          submenu: [],
          enabled: false
        },
        {
          type: 'separator'
        },
        {
          label: 'Save',
          accelerator: 'CommandOrControl+S'
        },
        {
          label: 'Save As...',
          accelerator: 'CommandOrControl+Shift+S'
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
        { role: 'undo' },
        { role: 'redo' },
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
              accelerator: 'CommandOrControl+F'
            },
            {
              label: 'Find and Replace',
              accelerator: 'CommandOrControl+H'
            },
            {
              label: 'Find Next'
            },
            {
              label: 'Find Previous'
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
          accelerator: 'CommandOrControl+A'
        },
        {
          label: 'Expand Selection',
          accelerator: 'Shift+Alt+Right'
        },
        {
          label: 'Shrink Selection',
          accelerator: 'Shift+Alt+Left'
        },
        { type: 'separator' },
        {
          label: 'Copy Line Up',
          accelerator: 'Shift+Alt+Up'
        },
        {
          label: 'Copy Line Down',
          accelerator: 'Shift+Alt+Down'
        },
        {
          label: 'Move Line Up',
          accelerator: 'Alt+Up'
        },
        {
          label: 'Move Line Down',
          accelerator: 'Alt+Down'
        },
        {
          label: 'Duplicate Selection'
        },
        { type: 'separator' },
        {
          label: 'Add Cursor Above',
          accelerator: 'CommandOrControl+Alt+Up'
        },
        {
          label: 'Add Cursor Below',
          accelerator: 'CommandOrControl+Alt+Down'
        },
        {
          label: 'Add Cursors to Line Ends Below',
          accelerator: 'Shift+Alt+I'
        },
        {
          label: 'Add Next Occurence',
          accelerator: 'CommandOrControl+D'
        },
        {
          label: 'Add Previous Occurence'
        },
        {
          label: 'Select All Occurences',
          accelerator: 'CommandOrControl+Shift+L'
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
          label: 'Check ID Nits'
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
