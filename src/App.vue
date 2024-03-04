<template>
  <router-view />
</template>

<script setup>
import { defineAsyncComponent, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useDocsStore } from 'src/stores/docs'
import { useEditorStore } from 'src/stores/editor'

const $q = useQuasar()

const docsStore = useDocsStore()
const editorStore = useEditorStore()

let progressDiag
let shouldExit = false

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

window.ipcBridge.subscribe('setProgressDialog', (evt, opts) => {
  if (opts.isShown) {
    if (progressDiag) {
      progressDiag.update(opts)
    } else {
      progressDiag = $q.dialog({
        component: defineAsyncComponent(() => import('components/ProgressDialog.vue')),
        componentProps: opts
      }).onDismiss(() => {
        progressDiag = null
      })
    }
  } else {
    progressDiag.hide()
  }
})

onMounted(async () => {
  await editorStore.fetchGitConfig()
  window.ipcBridge.emit('lspInitialize')

  // -> Auto-restore last session
  if (editorStore.persistSession && editorStore.restoreSession) {
    try {
      await docsStore.restoreSession()
    } catch (err) {}
  }
})

window.onbeforeunload = (ev) => {
  if (shouldExit || (!editorStore.confirmExit && !editorStore.persistSession) || editorStore.debugDisableUnload) {
    return
  }
  ev.returnValue = false

  if (editorStore.confirmExit) {
    $q.dialog({
      title: 'Confirm',
      message: 'Are you sure you want to close DraftEditor?',
      persistent: true,
      ok: {
        label: 'Exit',
        color: 'negative',
        unelevated: true
      },
      cancel: {
        label: 'Cancel',
        color: 'grey',
        flat: true
      }
    }).onOk(async () => {
      if (editorStore.persistSession) {
        await docsStore.persistSession()
      }
      shouldExit = true
      window.close()
    })
  } else {
    (async () => {
      await docsStore.persistSession()
      shouldExit = true
      window.close()
    })()
  }
}

</script>
