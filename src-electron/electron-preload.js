import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('ipcBridge', {
  emit (channel, data) {
    ipcRenderer.send(channel, data)
  },

  subscribe (channel, callback) {
    ipcRenderer.on(channel, callback)
  },

  promptWorkingDirectory: (current) => ipcRenderer.invoke('promptWorkingDirectory', { current }),
  readDirectory: (dirPath) => ipcRenderer.invoke('readDirectory', { dirPath }),
  fetchGitConfig: () => ipcRenderer.invoke('fetchGitConfig'),
  revokeGitKey: () => ipcRenderer.invoke('revokeGitKey')
})
