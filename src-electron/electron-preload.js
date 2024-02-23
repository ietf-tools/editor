import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('ipcBridge', {
  emit (channel, data) {
    ipcRenderer.send(channel, data)
  },

  subscribe (channel, callback) {
    ipcRenderer.on(channel, callback)
  },

  promptSelectDirectory: (current, title) => ipcRenderer.invoke('promptSelectDirectory', { current, title }),
  readDirectory: (dirPath) => ipcRenderer.invoke('readDirectory', { dirPath }),
  fetchGitConfig: () => ipcRenderer.invoke('fetchGitConfig'),
  clearGitKey: () => ipcRenderer.invoke('clearGitKey'),
  gitCloneRepository: (url, target) => ipcRenderer.invoke('gitCloneRepository', { url, target }),
  gitFetchOrigin: (dir) => ipcRenderer.invoke('gitFetchOrigin', { dir }),
  gitCommitsLog: (dir) => ipcRenderer.invoke('gitCommitsLog', { dir }),
  gitStatusMatrix: (dir) => ipcRenderer.invoke('gitStatusMatrix', { dir })
})
