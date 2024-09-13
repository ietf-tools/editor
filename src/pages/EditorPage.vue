<template lang="pug">
q-page.row.items-stretch
  .col-12(
    ref='monacoContainer'
    :class='{ "col-lg-6": editorStore.previewPaneShown }'
    )
  .col-12.col-lg-6(
    v-if='editorStore.previewPaneShown'
    :class='editorStore.isDarkTheme ? `bg-dark-5 text-white` : `bg-grey-2 text-black`'
    )
    .q-ma-lg Preview
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as monaco from 'monaco-editor/esm/vs/editor/edcore.main'
import { modelStore, decorationsStore } from 'src/stores/models'
import * as lspHelpers from 'src/helpers/lsp'
import { registerThemes } from 'src/helpers/monaco-themes'
import { registerMarkdownLanguage } from 'src/languages/markdown'
import { registerXMLRFCLanguage } from 'src/languages/xmlrfc'
import { handleEditorAction } from 'src/helpers/monaco-handlers'

import { useEditorStore } from 'stores/editor'
import { useDocsStore } from 'src/stores/docs'

// STORES

const docsStore = useDocsStore()
const editorStore = useEditorStore()

// ROUTER

const router = useRouter()

watch(() => docsStore.active, (newValue) => {
  if (!newValue) {
    editorStore.drawerPane = 'DrawerFiles'
    router.replace('/')
  }
})

// MONACO

const monacoContainer = ref(null)
let editor = null

registerThemes(monaco)
registerMarkdownLanguage(monaco)
registerXMLRFCLanguage(monaco)

// MOUNTED

onMounted(async () => {
  // -> Initialize Monaco editor
  editor = monaco.editor.create(monacoContainer.value, {
    automaticLayout: true,
    cursorStyle: editorStore.cursorStyle,
    cursorBlinking: editorStore.cursorBlinking,
    fontSize: editorStore.fontSize,
    formatOnType: editorStore.formatOnType,
    glyphMargin: true,
    language: 'xmlrfc',
    lineNumbersMinChars: 4,
    linkedEditing: true,
    model: modelStore[docsStore.activeDocument.id],
    padding: { top: 10, bottom: 10 },
    scrollBeyondLastLine: false,
    stickyScroll: {
      enabled: true
    },
    tabSize: editorStore.tabSize,
    theme: editorStore.theme,
    wordWrap: editorStore.wordWrap ? 'on' : 'off'
  })

  // -> Create decorations collections
  decorationsStore.clear()
  for (const key in editorStore.validationChecks) {
    decorationsStore.set(key, editor.createDecorationsCollection())
  }

  // -> Handle cursor movement
  editor.onDidChangeCursorPosition(ev => {
    editorStore.$patch({
      line: ev.position.lineNumber,
      col: ev.position.column
    })
  })

  // -> Post init
  editor.focus()

  // -> Finish
  docOpenFinished(docsStore.activeDocument)

  // -> Register handlers
  window.ipcBridge.subscribe('editorAction', handleEditorActions)
  window.ipcBridge.subscribe('lspNotification', handleLspNotification)
  EVENT_BUS.on('editorAction', handleEditorActions)
  EVENT_BUS.on('revealPosition', handleRevealPosition)

  // -> Remove initial loading screen
  document.getElementById('app-loading')?.remove()
})

// BEFORE UNMOUNT

onBeforeUnmount(() => {
  if (editor) {
    decorationsStore.clear()
    editor.dispose()
  }

  // -> Deregister handlers
  window.ipcBridge.subscribe('editorAction', handleEditorActions)
  window.ipcBridge.unsubscribe('lspNotification', handleLspNotification)
  EVENT_BUS.off('editorAction', handleEditorActions)
  EVENT_BUS.off('revealPosition', handleRevealPosition)
})

// WATCHERS

watch(() => docsStore.active, (newValue) => {
  if (newValue && editor) {
    if (editorStore.validationChecksDirty) {
      editorStore.clearErrors()
    }
    editor.setModel(modelStore[docsStore.activeDocument.id])
    docOpenFinished(docsStore.activeDocument)
  }
})

watch(() => editorStore.cursorStyle, (newValue) => {
  if (newValue && editor) {
    editor.updateOptions({ cursorStyle: newValue })
  }
})
watch(() => editorStore.cursorBlinking, (newValue) => {
  if (newValue && editor) {
    editor.updateOptions({ cursorBlinking: newValue })
  }
})
watch(() => editorStore.fontSize, (newValue) => {
  if (newValue && editor) {
    editor.updateOptions({ fontSize: newValue })
  }
})
watch(() => editorStore.formatOnType, (newValue) => {
  if (editor) {
    editor.updateOptions({ formatOnType: newValue })
  }
})
watch(() => editorStore.tabSize, (newValue) => {
  if (newValue && editor) {
    editor.updateOptions({ tabSize: newValue })
  }
})
watch(() => editorStore.theme, (newValue) => {
  if (newValue && editor) {
    editor.updateOptions({ theme: newValue })
  }
})
watch(() => editorStore.wordWrap, (newValue) => {
  if (editor) {
    editor.updateOptions({ wordWrap: newValue ? 'on' : 'off' })
  }
  window.ipcBridge.emit('setMenuItemCheckedState', {
    id: 'viewWordWrap',
    value: newValue
  })
})
watch(() => editorStore.previewPaneShown, (newValue) => {
  window.ipcBridge.emit('setMenuItemCheckedState', {
    id: 'viewShowPreviewPane',
    value: newValue
  })
})

watch(() => editorStore.errors, (newValue) => {
  if (newValue && newValue.length > 0) {
    monaco.editor.setModelMarkers(modelStore[docsStore.activeDocument.id], 'errors', newValue)
  } else {
    monaco.editor.removeAllMarkers('errors')
  }
})

// METHODS

function docOpenFinished (doc) {
  if (doc.language === 'xmlrfc') {
    window.ipcBridge.emit('lspSendNotification', {
      method: 'textDocument/didOpen',
      params: {
        textDocument: {
          uri: doc.uri,
          languageId: doc.type,
          version: modelStore[doc.id].getVersionId(),
          text: doc.data
        }
      }
    })
  }
  // const banner = document.createElement('div')
  // banner.innerHTML = 'TEST!'
  // editor.setBanner(banner, 50)
}

function handleEditorActions (evt, action) {
  const properAction = action ?? evt
  handleEditorAction(editor, properAction)
}

async function handleLspNotification (evt, data) {
  switch (data.method) {
    case 'textDocument/publishDiagnostics': {
      const modelId = docsStore.getDocumentByURI(data.params.uri)?.id
      if (modelId) {
        monaco.editor.setModelMarkers(modelStore[modelId], 'lsp', data.params.diagnostics.map(d => {
          return {
            code: d.code,
            message: d.message,
            source: d.source,
            severity: lspHelpers.convertLSPSeverityToMonaco(d.severity),
            ...lspHelpers.convertLSPRangeToMonaco(d.range)
          }
        }))
        editorStore.schemaValidationErrors = data.params.diagnostics?.length ?? 0
      } else {
        console.warn(`textDocument/publishDiagnostics: opened document ${data.params.uri} not found.`)
      }
      break
    }
    default: {
      console.info(data)
      break
    }
  }
}

function handleRevealPosition (pos) {
  if (editor) {
    editor.focus()
    editor.revealPositionNearTop(pos, monaco.editor.ScrollType.Smooth)
    editor.setPosition(pos, 'DrawerSymbols')
  }
}
</script>

<style lang="scss">
.dec {
  &-info {
    border-bottom: 3px dashed $light-blue-5;

    &-margin {
      background-color: rgba($light-blue, .2);
      border-radius: 0 50% 50% 0;

      &::before {
        content: '';
        display: block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: $light-blue;
        z-index: 10;
      }
    }
  }
  &-warning {
    border-bottom: 3px dashed $orange-5;

    &-margin {
      background-color: rgba($orange, .2);
      border-radius: 0 50% 50% 0;

      &::before {
        content: '';
        display: block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: $orange-5;
        z-index: 10;
      }
    }
  }
}

</style>
