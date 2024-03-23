<template lang='pug'>
.app-layout(:class='currentModeClass')
  app-mode-sidebar
  .app-main
    router-view
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter, useRoute } from 'vue-router'
import { useDocsStore } from 'src/stores/docs'
import { useEditorStore } from 'src/stores/editor'
import { useUserStore } from 'src/stores/user'
import AppModeSidebar from 'components/AppModeSidebar.vue'

const $q = useQuasar()

const docsStore = useDocsStore()
const editorStore = useEditorStore()
const userStore = useUserStore()

const router = useRouter()
const route = useRoute()

const currentModeClass = computed(() => {
  if (route.name === 'editor' && route.query.mode === 'review') {
    return 'route-review'
  }
  return `route-${route.name}`
})

// WATCHERS

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

window.ipcBridge.subscribe('authUpdate', (evt, authInfo) => {
  userStore.$patch({
    isLoggedIn: authInfo.isLoggedIn,
    expireAt: authInfo.expireAt,
    profile: {
      email: authInfo.email,
      name: authInfo.name,
      picture: authInfo.picture
    }
  })
})

// -> Handle translucency flags
watch(() => editorStore.translucencyEffects, (newValue) => {
  if (newValue) {
    document.body.classList.remove('no-translucency')
  } else {
    document.body.classList.add('no-translucency')
  }
}, { immediate: true })

// -> Handle animation flags
watch(() => editorStore.animationEffects, (newValue) => {
  if (newValue) {
    document.body.classList.remove('no-animations')
  } else {
    document.body.classList.add('no-animations')
  }
}, { immediate: true })

// -> Handle mode switch
watch(() => editorStore.mode, (newValue) => {
  switch (newValue) {
    case 'submit': {
      router.push('/submit')
      break
    }
    default: {
      router.push('/')
      break
    }
  }
})

// MOUNTED

onMounted(async () => {
  window.ipcBridge.emit('authFetchInfo')
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

<style lang="scss">
.app-layout {
  display: flex;
}
.app-main {
  display: block;
  flex: 1;
  position: relative;
}
</style>
