<template>
  <router-view />
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import { useQuasar } from 'quasar'
import { useDocsStore } from 'src/stores/docs'

const $q = useQuasar()

const docsStore = useDocsStore()

window.ipcBridge.subscribe('dialogAction', (evt, action) => {
  switch (action) {
    case 'helpAbout': {
      $q.dialog({
        component: defineAsyncComponent(() => import('components/AboutDialog.vue'))
      })
      break
    }
    case 'openFromURL': {
      $q.dialog({
        component: defineAsyncComponent(() => import('components/OpenFromUrlDialog.vue'))
      })
      break
    }
  }
})

window.ipcBridge.subscribe('openDocument', (evt, doc) => {
  docsStore.loadDocument(doc)
})

</script>
