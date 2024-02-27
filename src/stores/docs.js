import { defineStore } from 'pinia'
import { find, last } from 'lodash-es'
import { DateTime } from 'luxon'
import { URI } from 'vscode-uri'

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
    /**
     * Open / Create a New Document
     *
     * @param {Object} doc Document options
     */
    async loadDocument (doc = {}) {
      // Select appropriate language for editor
      let lang = 'xmlrfc'
      switch (doc.type) {
        case 'xml': {
          lang = 'xmlrfc'
          break
        }
        case 'md': {
          lang = 'markdown'
          break
        }
        case 'txt': {
          lang = 'text'
          break
        }
      }
      // Create new document
      const docId = crypto.randomUUID()
      const newDoc = {
        id: docId,
        type: doc.type ?? 'xml',
        path: doc.path ?? '',
        fileName: doc.fileName ?? 'untitled-draft.xml',
        data: doc.data ?? '',
        activeData: doc.data ?? '',
        isModified: false,
        lastModifiedAt: DateTime.utc(),
        language: lang,
        uri: URI.file(doc.path ?? `/${docId}.${doc.type ?? 'xml'}`).toString(),
        version: 1
      }
      this.opened.push(newDoc)

      window.ipcBridge.emit('lspSendNotification', {
        method: 'textDocument/didOpen',
        params: {
          textDocument: {
            uri: newDoc.uri,
            languageId: newDoc.type,
            version: 1,
            text: newDoc.activeData
          }
        }
      })

      this.active = docId
    },
    /**
     * Switch active document
     *
     * @param {string} docId Document UUID
     */
    async switchToDocument (docId) {
      this.active = docId
    },
    /**
     * Open document from path
     *
     * @param {string} docPath Document Path
     */
    async openDocumentFromPath (docPath) {
      window.ipcBridge.emit('openFromPath', {
        path: docPath
      })
    },
    /**
     * Close a document
     *
     * @param {string} docId Document UUID
     */
    async closeDocument (docId) {
      this.opened = this.opened.filter(d => d.id !== docId)
      if (this.opened.length < 1) {
        this.active = null
      } else if (this.active === docId) {
        this.active = this.opened[0].id
      }
    },
    /**
     * Save active document
     *
     * @param {string} overridePath Override the document path / filename
     * @param {boolean} forcePromptSaveAs Force the main thread to prompt the user with the save as dialog
     */
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
  },
  persist: {
    paths: [
      'opened',
      'active'
    ]
  }
})
