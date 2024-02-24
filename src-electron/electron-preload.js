import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('ipcBridge', {
  emit (channel, data) {
    ipcRenderer.send(channel, data)
  },

  subscribe (channel, callback) {
    ipcRenderer.on(channel, callback)
  },

  versions: process.versions,

  promptSelectDirectory: (current, title) => ipcRenderer.invoke('promptSelectDirectory', { current, title }),
  readDirectory: (dirPath) => ipcRenderer.invoke('readDirectory', { dirPath }),
  fetchGitConfig: () => ipcRenderer.invoke('fetchGitConfig'),
  clearGitKey: () => ipcRenderer.invoke('clearGitKey'),
  gitCloneRepository: (url, target, upstreamUrl) => ipcRenderer.invoke('gitCloneRepository', { url, target, upstreamUrl }),
  gitPerformFetch: (dir, remote) => ipcRenderer.invoke('gitPerformFetch', { dir, remote }),
  gitListRemotes: (dir) => ipcRenderer.invoke('gitListRemotes', { dir }),
  gitAddRemote: (dir, remote, url) => ipcRenderer.invoke('gitAddRemote', { dir, remote, url }),
  gitDeleteRemote: (dir, remote) => ipcRenderer.invoke('gitDeleteRemote', { dir, remote }),
  gitListBranches: (dir, remote) => ipcRenderer.invoke('gitListBranches', { dir, remote }),
  gitCommitsLog: (dir) => ipcRenderer.invoke('gitCommitsLog', { dir }),
  gitStatusMatrix: (dir) => ipcRenderer.invoke('gitStatusMatrix', { dir }),
  gitStageFiles: (dir, files) => ipcRenderer.invoke('gitStageFiles', { dir, files }),
  gitUnstageFiles: (dir, files) => ipcRenderer.invoke('gitUnstageFiles', { dir, files })
})
