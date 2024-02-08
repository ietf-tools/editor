import { defineStore } from 'pinia'
import { find, last } from 'lodash-es'
import { DateTime } from 'luxon'

export const useDocsStore = defineStore('docs', {
  state: () => ({
    opened: [],
    active: null
  }),
  getters: {
    activeDocument (state) {
      return state.active ? find(state.opened, ['id', state.active]) : {}
    }
  },
  actions: {
    async loadDocument (doc = {}) {
      const docId = crypto.randomUUID()
      this.opened.push({
        id: docId,
        type: doc.type ?? 'xml',
        path: doc.path ?? '',
        fileName: doc.fileName ?? 'untitled-draft.xml',
        data: doc.data ?? '',
        activeData: doc.data ?? '',
        isModified: false,
        lastModifiedAt: DateTime.utc()
      })
      this.active = docId
    },
    async switchToDocument (docId) {
      this.active = docId
    },
    async closeDocument (docId) {
      this.opened = this.opened.filter(d => d.id !== docId)
      if (this.opened.length < 1) {
        this.loadDocument()
      } else if (this.active === docId) {
        this.active = this.opened[0].id
      }
    },
    async saveDocument (overridePath, forcePromptSaveAs = false) {
      if (overridePath) {
        this.activeDocument.path = overridePath
        this.activeDocument.fileName = overridePath.indexOf('\\') >= 0 ? last(overridePath.split('\\')) : last(overridePath.split('/'))
      }
      if (!this.activeDocument.path || forcePromptSaveAs) {
        window.ipcBridge.emit('promptSaveAs', {
          fileName: this.activeDocument.fileName,
          type: this.activeDocument.type
        })
      } else {
        window.ipcBridge.emit('save', {
          path: this.activeDocument.path,
          data: this.activeDocument.activeData
        })
        this.activeDocument.data = this.activeDocument.activeData
        this.activeDocument.isModified = false
        this.activeDocument.lastModifiedAt = DateTime.utc()
      }
    }
  }
})
