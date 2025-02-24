import os from 'node:os'
import * as pty from '@lydell/node-pty'

const defaultShell = {
  cmd: 'bash',
  args: ''
}
switch (os.platform()) {
  case 'darwin':
    defaultShell.cmd = 'zsh'
    defaultShell.args = '-i'
    break
  case 'win32':
    defaultShell.cmd = 'pwsh.exe'
    defaultShell.args = '-NoLogo -NoProfile'
    break
}

export default {
  term: null,
  /**
   * Initialize PTY
   */
  initialize (opts = {}) {
    if (this.term) { return }
    this.term = pty.spawn(opts.shell || defaultShell.cmd, (opts.args ?? defaultShell.args).split(' ').filter(a => a), {
      name: 'draftforge-terminal',
      cols: 80,
      rows: 30,
      cwd: opts.cwd,
      env: process.env
    })
    this.term.onData(data => {
      DFG.mainWindow.webContents.send('terminal.incomingData', data)
    })
    this.term.onExit(() => {
      this.term = null
    })
  },
  /**
   * Stdin
   */
  write (data) {
    if (this.term) {
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
