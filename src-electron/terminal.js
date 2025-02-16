import os from 'node:os'
// import { spawn } from 'node:child_process'
import * as pty from '@lydell/node-pty'

const shell = os.platform() === 'win32'
  ? {
      cmd: 'powershell.exe',
      args: ['-NoLogo']
    }
  : {
      cmd: 'bash',
      args: []
    }

export default {
  term: null,
  /**
   * Initialize PTY
   */
  initialize (mainWindow, cwd) {
    if (this.term) { return }
    this.term = pty.spawn(shell.cmd, shell.args, {
      name: 'draftforge-terminal',
      cols: 80,
      rows: 30,
      cwd,
      env: process.env
    })
    this.term.onData(data => {
      mainWindow.webContents.send('terminal.incomingData', data)
    })
    this.term.onExit(() => {
      this.term = null
    })
    // this.term = spawn(shell, [], {
    //   windowsHide: true,
    //   cwd
    // })
    // this.term.stdout.on('data', data => {
    //   mainWindow.webContents.send('terminal.incomingData', data)
    // })
    // this.term.stderr.on('data', data => {
    //   mainWindow.webContents.send('terminal.incomingData', data)
    // })
    // this.term.on('exit', () => {
    //   this.term = null
    // })
  },
  write (data) {
    if (this.term) {
      // this.term.stdin.write(data)
      this.term.write(data)
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
