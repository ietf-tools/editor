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
        color: 'info',
        icon: 'mdi-package-variant-closed-check'
      })
    })
    autoUpdater.on('error', (err) => {
      dialog.showErrorBox('Update Check Failed', `Error: ${err}`)
      // mainWindow.webContents.send('notify', {
      //   message: 'Update Check Failed',
      //   caption: err,
      //   color: 'negative',
      //   icon: 'mdi-alert-octagon'
      // })
    })
  },
  async checkForUpdates () {
    autoUpdater.checkForUpdatesAndNotify()
  }
}
