import { defineStore } from 'pinia'
import { cloneDeep, find, last } from 'lodash-es'
import { DateTime } from 'luxon'
import * as monaco from 'monaco-editor/esm/vs/editor/edcore.main'
import { modelStore } from 'src/stores/models'
import { useEditorStore } from 'src/stores/editor'

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
     * Retrieves a document from the opened documents list based on the provided URI.
     *
     * @param {string} uri - The URI of the document to retrieve.
     * @returns {Object|null} - The document object if found, or null if not found.
     */
    getDocumentByURI (uri) {
      return find(this.opened, ['uri', uri])
    },
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
      const docURI = doc.path ? monaco.Uri.file(doc.path) : monaco.Uri.parse(`inmemory://${docId}.${doc.type ?? 'xml'}`)
      this.createModel(docId, doc.data ?? '', lang, docURI)
      const newDoc = {
        id: docId,
        type: doc.type ?? 'xml',
        path: doc.path ?? '',
        fileName: doc.fileName ?? 'untitled-draft.xml',
        data: doc.data ?? '',
        isModified: false,
        lastModifiedAt: DateTime.utc(),
        lastSavedVersion: modelStore[docId].getAlternativeVersionId(),
        language: lang,
        uri: docURI.toString()
      }
      this.opened.push(newDoc)

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
      const editorStore = useEditorStore()
      const docToClose = find(this.opened, ['id', docId])

      // -> Clear validation checks
      if (editorStore.validationChecksDirty) {
        editorStore.clearErrors()
      }

      // -> Remove from opened documents
      this.opened = this.opened.filter(d => d.id !== docId)
      if (this.opened.length < 1) {
        this.active = null
      } else if (this.active === docId) {
        this.active = this.opened[0].id
      }

      // -> Dispose of model
      if (modelStore[docId]) {
        modelStore[docId].dispose()
        delete modelStore[docId]
      }

      // -> Notify LSP
      if (docToClose) {
        window.ipcBridge.emit('lspSendNotification', {
          method: 'textDocument/didClose',
          params: {
            textDocument: {
              uri: docToClose.uri
            }
          }
        })
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
          data: modelStore[this.activeDocument.id].getValue()
        })
        this.activeDocument.data = modelStore[this.activeDocument.id].getValue()
        this.activeDocument.isModified = false
        this.activeDocument.lastModifiedAt = DateTime.utc()
        this.activeDocument.lastSavedVersion = modelStore[this.activeDocument.id].getAlternativeVersionId()

        window.ipcBridge.emit('lspSendNotification', {
          method: 'textDocument/didSave',
          params: {
            textDocument: {
              uri: this.activeDocument.uri
            }
          }
        })
      }
    },
    /**
     * Persists the session by saving the contents of the opened documents.
     *
     * @returns {Promise<void>} A promise that resolves when the session is persisted.
     */
    async persistSession () {
      const modelContents = {}
      for (const doc of this.opened) {
        if (modelStore[doc.id]) {
          modelContents[doc.id] = modelStore[doc.id].getValue()
        }
      }
      await window.ipcBridge.persistSession({
        active: cloneDeep(this.active),
        opened: cloneDeep(this.opened),
        models: modelContents
      })
    },
    /**
     * Restores the previous session by retrieving the session data from the IPC bridge.
     * If a previous session exists, it creates models for each opened document and sets the active document.
     * If no previous session exists, it throws an error.
     *
     * @throws {Error} If no previous session to restore.
     * @returns {Promise<void>} A promise that resolves when the session is restored.
     */
    async restoreSession () {
      const data = await window.ipcBridge.restoreSession()
      if (data?.active) {
        for (const doc of data.opened) {
          this.createModel(doc.id, data.models[doc.id], doc.language, monaco.Uri.parse(doc.uri))
          this.opened.push(doc)
        }
        this.active = data.active
      } else {
        throw new Error('No previous session to restore.')
      }
    },
    /**
     * Creates a new model and stores it in the modelStore.
     *
     * @param {string} id - The ID of the model.
     * @param {string} data - The data for the model.
     * @param {string} language - The language of the model.
     * @param {string} uri - The URI of the model.
     */
    createModel (id, data, language, uri) {
      const editorStore = useEditorStore()

      modelStore[id] = monaco.editor.createModel(data, language, uri)

      modelStore[id].onDidChangeContent(ev => {
        if (editorStore.errors.length > 0 || editorStore.validationChecksDirty) {
          editorStore.clearErrors()
        }

        this.activeDocument.isModified = this.activeDocument.lastSavedVersion !== modelStore[id].getAlternativeVersionId()
        this.activeDocument.lastModifiedAt = DateTime.utc()

        if (language === 'xmlrfc') {
          window.ipcBridge.emit('lspSendNotification', {
            method: 'textDocument/didChange',
            params: {
              textDocument: {
                uri: uri.toString(),
                version: ev.versionId
              },
              contentChanges: ev.changes.map(chg => ({
                range: {
                  start: {
                    line: chg.range.startLineNumber - 1,
                    character: chg.range.startColumn - 1
                  },
                  end: {
                    line: chg.range.endLineNumber - 1,
                    character: chg.range.endColumn - 1
                  }
                },
                rangeLength: chg.rangeLength,
                text: chg.text
              }))
            }
          })
        }
      })
    }
  },
  persist: {
    pick: []
  }
})
