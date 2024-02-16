<template>
  <router-view />
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import { useQuasar } from 'quasar'
import { useDocsStore } from 'src/stores/docs'
import { useEditorStore } from 'src/stores/editor'

const $q = useQuasar()

const docsStore = useDocsStore()
const editorStore = useEditorStore()

window.ipcBridge.subscribe('dialogAction', (evt, action) => {
  switch (action) {
    case 'helpAbout': {
      $q.dialog({
        component: defineAsyncComponent(() => import('components/AboutDialog.vue'))
      })
      break
    }
    case 'newDraft': {
      $q.dialog({
        component: defineAsyncComponent(() => import('components/NewDraftDialog.vue'))
      })
      break
    }
    case 'openFromURL': {
      $q.dialog({
        component: defineAsyncComponent(() => import('components/OpenFromUrlDialog.vue'))
      })
      break
    }
    case 'preferences': {
      $q.dialog({
        component: defineAsyncComponent(() => import('components/PreferencesDialog.vue'))
      })
      break
    }
  }
})
window.ipcBridge.subscribe('notify', (evt, opts) => {
  $q.notify(opts)
})
window.ipcBridge.subscribe('openDocument', (evt, doc) => {
  docsStore.loadDocument(doc)
})
window.ipcBridge.subscribe('save', (evt, filePath) => {
  docsStore.saveDocument(filePath)
})
window.ipcBridge.subscribe('saveAs', () => {
  docsStore.saveDocument(null, true)
})
window.ipcBridge.subscribe('setWorkingDirectory', (evt, dirPath) => {
  editorStore.workingDirectory = dirPath
})

</script>
