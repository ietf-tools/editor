<template lang="pug">
q-footer
  q-bar(:class='editorStore.hasErrors ? `bg-red-9` : `bg-green-9`')
    span.text-caption.text-green-2 RFC XML v3
    q-separator.q-ml-md.q-mr-sm(vertical inset)
    q-btn(padding="xs sm" flat no-caps)
      span.text-caption No Error
</template>

<script setup>
import { useEditorStore } from 'src/stores/editor'

// STORES

const editorStore = useEditorStore()
</script>
