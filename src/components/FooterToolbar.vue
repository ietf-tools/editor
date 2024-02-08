<template lang="pug">
q-footer
  q-bar.footer-bar(:class='editorStore.hasErrors ? `bg-red-9` : `bg-green-9`')
    span.text-caption.text-green-2 {{ docType }}
    q-separator.q-ml-md.q-mr-sm(vertical inset)
    q-btn(padding="xs sm" flat no-caps)
      span.text-caption No Error
    q-space
    span.text-caption.text-green-2 Ln {{ editorStore.line }}, Col {{ editorStore.col }}
    q-separator.q-mx-md(vertical inset)
    span.text-caption.text-green-2 Spaces: {{ editorStore.tabSize }}
    q-separator.q-mx-md(vertical inset)
    span.text-caption.text-green-2 UTF-8
</template>

<script setup>
import { computed } from 'vue'

import { useDocsStore } from 'src/stores/docs'
import { useEditorStore } from 'src/stores/editor'

// STORES

const docsStore = useDocsStore()
const editorStore = useEditorStore()

// COMPUTED

const docType = computed(() => {
  switch (docsStore.activeDocument.type) {
    case 'xml':
      return 'RFC XML v3'
    case 'md':
      return 'Markdown'
    case 'txt':
      return 'Plain Text'
    default:
      return 'Unknown Format'
  }
})
</script>

<style lang="scss">
.footer-bar {
  border-top: 1px solid $green-6;
}
</style>
