<template>
  <router-view />
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

function helpAbout () {
  $q.dialog({
    component: defineAsyncComponent(() => import('components/AboutDialog.vue'))
  })
}

window.menuEmitter.subscribe('dialogAction', (evt, action) => {
  switch (action) {
    case 'helpAbout':
      helpAbout()
      break
  }
})
</script>
