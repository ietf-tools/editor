<template lang="pug">
q-footer
  q-bar.bg-indigo(v-if='!docsStore.active')
    q-space
    span.text-caption.text-blue-grey-3 DraftForge
    q-space
  q-bar.footer-bar(v-else, :class='editorStore.hasErrors ? `bg-red-9` : `bg-green-9`')
    span.text-caption {{ docType }}
    q-separator.q-ml-md.q-mr-sm(vertical inset)
    template(v-if='editorStore.hasErrors')
      q-btn(
        padding="xs sm"
        flat
        no-caps
        color='white'
        @click='showNextError'
        )
        q-icon.q-mr-sm(name='mdi-alert-box' size='xs')
        span.text-caption #[strong {{ editorStore.errors.length }}] {{ editorStore.errors.length > 1 ? 'errors/warnings' : 'error/warning' }} found
        q-tooltip Show Next Error
      q-btn(
        padding="none sm"
        outline
        no-caps
        color='white'
        label='Clear'
        @click='editorStore.clearErrors'
        )
    template(v-else)
      q-icon.q-mr-sm(name='mdi-check' size='14px')
      span.text-caption: em No Schema Validation Error
    q-space
    span.text-caption Ln {{ editorStore.line }}, Col {{ editorStore.col }}
    q-separator.q-mx-md(vertical inset)
    span.text-caption Spaces: {{ editorStore.tabSize }}
    q-separator.q-mx-md(vertical inset)
    span.text-caption UTF-8
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

// METHODS

function showNextError () {
  EVENT_BUS.emit('editorAction', 'markerNext')
}
</script>

<style lang="scss">
.footer-bar {
  &.bg-green-9 {
    border-top: 1px solid $green-6;
    color: $green-2;
  }
  &.bg-red-9 {
    border-top: 1px solid $red-6;
    color: $red-2;
  }
}
</style>
