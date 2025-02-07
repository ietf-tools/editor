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
  gitCloneRepository: (url, target, upstreamUrl, cloneInSubDir) => ipcRenderer.invoke('gitCloneRepository', { url, target, upstreamUrl, cloneInSubDir }),
  gitInitRepository: (target) => ipcRenderer.invoke('gitInitRepository', { target }),
  setGitWorkingDirectory: (dir) => ipcRenderer.invoke('gitSetWorkingDirectory', { dir }),
  gitPerformFetch: (remote) => ipcRenderer.invoke('gitPerformFetch', { remote }),
  gitListRemotes: () => ipcRenderer.invoke('gitListRemotes'),
  gitAddRemote: (remote, url) => ipcRenderer.invoke('gitAddRemote', { remote, url }),
  gitDeleteRemote: (remote) => ipcRenderer.invoke('gitDeleteRemote', { remote }),
  gitPull: (mode, remote, branch) => ipcRenderer.invoke('gitPull', { mode, remote, branch }),
  gitPush: (remote, branch) => ipcRenderer.invoke('gitPush', { remote, branch }),
  gitListBranches: (remote) => ipcRenderer.invoke('gitListBranches', { remote }),
  gitNewBranch: (branchName, source, tracking) => ipcRenderer.invoke('gitNewBranch', { branchName, source, tracking }),
  gitDeleteBranch: (branch) => ipcRenderer.invoke('gitDeleteBranch', { branch }),
  gitDeleteRemoteBranch: (remote, branch) => ipcRenderer.invoke('gitDeleteRemoteBranch', { remote, branch }),
  gitSetBranchTracking: (branch, tracking) => ipcRenderer.invoke('gitSetBranchTracking', { branch, tracking }),
  gitCheckoutBranch: (branch, tracking) => ipcRenderer.invoke('gitCheckoutBranch', { branch, tracking }),
  gitCommitsLog: () => ipcRenderer.invoke('gitCommitsLog'),
  gitStatusMatrix: () => ipcRenderer.invoke('gitStatusMatrix'),
  gitStageFiles: (files) => ipcRenderer.invoke('gitStageFiles', { files }),
  gitUnstageFiles: (files) => ipcRenderer.invoke('gitUnstageFiles', { files }),
  gitDiscardChanges: (files) => ipcRenderer.invoke('gitDiscardChanges', { files }),
  gitCommit: (message) => ipcRenderer.invoke('gitCommit', { message }),
  lspSendRequest: (method, params) => ipcRenderer.invoke('lspSendRequest', { method, params }),
  saveValidationResults: (output) => ipcRenderer.invoke('saveValidationResults', { output }),
  persistSession: (data) => ipcRenderer.invoke('persistSession', data),
  restoreSession: () => ipcRenderer.invoke('restoreSession')
})
