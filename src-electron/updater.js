import electronUpdater from 'electron-updater'
import { dialog } from 'electron'
const { autoUpdater } = electronUpdater

export default {
  refMainWindow: null,
  init (mainWindow) {
    this.refMainWindow = mainWindow
    autoUpdater.on('update-not-available', () => {
      mainWindow.webContents.send('notify', {
        message: 'Up to date',
        caption: 'You are running the latest version.',
        color: 'success',
        icon: 'mdi-package-variant-closed-check'
      })
    })
    autoUpdater.on('update-available', (info) => {
      mainWindow.webContents.send('notify', {
        message: 'Update available!',
        caption: 'A new version is available for installation.',
        color: 'info',
        icon: 'mdi-cloud-download'
      })
    })
    autoUpdater.on('error', (err) => {
      dialog.showErrorBox('Update Check Failed', `Error: ${err}`)
    })
  },
  async checkForUpdates () {
    autoUpdater.checkForUpdatesAndNotify()
  }
}
