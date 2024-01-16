import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('menuEmitter', {
  emit (channel, data) {
    ipcRenderer.send(channel, data)
  },

  subscribe (channel, callback) {
    ipcRenderer.on(channel, callback)
  }
})
