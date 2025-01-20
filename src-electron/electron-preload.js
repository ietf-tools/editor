import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('ipcBridge', {
  emit (channel, data) {
    ipcRenderer.send(channel, data)
  },

  subscribe (channel, callback) {
    ipcRenderer.on(channel, callback)
  },

  unsubscribe (channel, callback) {
    ipcRenderer.off(channel, callback)
  },

  versions: process.versions,

  createNewDocument: (type, filename, data) => ipcRenderer.invoke('createNewDocument', { type, filename, data }),
  promptSelectDirectory: (current, title) => ipcRenderer.invoke('promptSelectDirectory', { current, title }),
  readDirectory: (dirPath) => ipcRenderer.invoke('readDirectory', { dirPath }),
  fetchGitConfig: () => ipcRenderer.invoke('fetchGitConfig'),
  clearGitKey: () => ipcRenderer.invoke('clearGitKey'),
  gitCloneRepository: (url, target, upstreamUrl) => ipcRenderer.invoke('gitCloneRepository', { url, target, upstreamUrl }),
  setGitWorkingDirectory: (dir) => ipcRenderer.invoke('gitSetWorkingDirectory', { dir }),
  gitPerformFetch: (remote) => ipcRenderer.invoke('gitPerformFetch', { remote }),
  gitListRemotes: () => ipcRenderer.invoke('gitListRemotes'),
  gitAddRemote: (remote, url) => ipcRenderer.invoke('gitAddRemote', { remote, url }),
  gitDeleteRemote: (remote) => ipcRenderer.invoke('gitDeleteRemote', { remote }),
  gitPull: (remote, branch, mode) => ipcRenderer.invoke('gitPull', { remote, branch, mode }),
  gitListBranches: (remote) => ipcRenderer.invoke('gitListBranches', { remote }),
  gitCommitsLog: () => ipcRenderer.invoke('gitCommitsLog'),
  gitStatusMatrix: () => ipcRenderer.invoke('gitStatusMatrix'),
  gitStageFiles: (files) => ipcRenderer.invoke('gitStageFiles', { files }),
  gitUnstageFiles: (files) => ipcRenderer.invoke('gitUnstageFiles', { files }),
  gitCommit: (message) => ipcRenderer.invoke('gitCommit', { message }),
  lspSendRequest: (method, params) => ipcRenderer.invoke('lspSendRequest', { method, params }),
  persistSession: (data) => ipcRenderer.invoke('persistSession', data),
  restoreSession: () => ipcRenderer.invoke('restoreSession')
})
