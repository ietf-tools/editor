<template lang="pug">
.q-pa-md
  .flex.items-center
    .text-caption.text-light-blue-3
      strong Git
    q-space
    q-btn(
      flat
      size='sm'
      icon='mdi-cog-outline'
      padding='xs xs'
      text-color='light-blue-3'
      @click='gitSettings'
      )
      q-tooltip Git Settings
  q-btn.full-width.q-mt-sm(
    icon='mdi-cloud-download'
    label='Clone Repository...'
    color='primary'
    no-caps
    unelevated
    @click='cloneRepo'
  )
  q-btn.full-width.q-mt-sm(
    icon='mdi-git'
    label='Initialize New...'
    color='primary'
    no-caps
    unelevated
  )
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import { useQuasar } from 'quasar'
// import { useEditorStore } from 'src/stores/editor'

const $q = useQuasar()

// const editorStore = useEditorStore()

// METHODS

function gitSettings () {
  $q.dialog({
    component: defineAsyncComponent(() => import('components/PreferencesDialog.vue')),
    componentProps: {
      tab: 'git'
    }
  })
}

function cloneRepo () {
  $q.dialog({
    component: defineAsyncComponent(() => import('components/CloneRepositoryDialog.vue'))
  })
}

</script>
