import electronUpdater from 'electron-updater'
import { dialog, ipcMain } from 'electron'
const { autoUpdater } = electronUpdater

export default {
  refMainWindow: null,
  init (mainWindow) {
    this.refMainWindow = mainWindow
    autoUpdater.on('checking-for-update', () => {
      this.refMainWindow.webContents.send('setUpdaterDialog', {
        shown: true,
        message: 'Checking for updates...',
      })
    })
    autoUpdater.on('update-not-available', () => {
      mainWindow.webContents.send('setUpdaterDialog', {
        shown: false,
        message: 'You are running the latest version.',
      })
    })
    autoUpdater.on('update-available', (info) => {
      mainWindow.webContents.send('setUpdaterDialog', {
        shown: true,
        message: 'A new version is available.',
      })
    })
    autoUpdater.on('error', (err) => {
      mainWindow.webContents.send('setUpdaterDialog', {
        shown: false,
        message: 'An error occured.',
      })
      dialog.showErrorBox('Update Check Failed', `Error: ${err}`)
    })
    autoUpdater.on('download-progress', (progressObj) => {
      this.refMainWindow.webContents.send('setUpdaterDialog', {
        shown: true,
        message: `Downloading latest update... (${Math.ceil(progressObj.percent)}%)`,
      })
    })
    autoUpdater.on('update-downloaded', (info) => {
      mainWindow.webContents.send('setUpdaterDialog', {
        shown: true,
        working: false,
        actionsShown: true,
        message: 'A new version is available.'
      })
    })

    ipcMain.on('checkForUpdates', (evt, opts = {}) => {
      if (process.env.DEV) {
        if (opts.silent) {
          return
        }
        mainWindow.webContents.send('notify', {
          message: 'Function Unavailable',
          caption: 'Checking for updates is not available in dev mode.',
          color: 'amber-9',
          icon: 'mdi-car-traction-control'
        })
      } else {
        autoUpdater.checkForUpdates()
      }
    })
    ipcMain.on('updateNow', () => {
      autoUpdater.quitAndInstall()
    })
  },
  async checkForUpdates () {
    autoUpdater.checkForUpdates()
  }
}
