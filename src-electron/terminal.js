import os from 'node:os'
import { spawn } from 'node:child_process'

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash'

export default {
  term: null,
  /**
   * Initialize PTY
   */
  initialize (mainWindow, cwd) {
    if (this.term) { return }
    this.term = spawn(shell, [], {
      windowsHide: true,
      cwd
    })
    this.term.stdout.on('data', data => {
      mainWindow.webContents.send('terminal.incomingData', data)
    })
    this.term.stderr.on('data', data => {
      mainWindow.webContents.send('terminal.incomingData', data)
    })
    this.term.on('exit', () => {
      this.term = null
    })
  },
  write (data) {
    if (this.term) {
      this.term.stdin.write(data)
    }
  },
  /**
   * Destroy PTY
   */
  destroy () {
    if (this.term) {
      this.term.kill()
    }
  }
}
