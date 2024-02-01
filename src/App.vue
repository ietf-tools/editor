<template>
  <router-view />
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

window.menuEmitter.subscribe('dialogAction', (evt, action) => {
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

</script>
