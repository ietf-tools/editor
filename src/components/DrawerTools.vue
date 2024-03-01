<template lang="pug">
q-list(padding)
  q-item-label.text-caption.text-light-blue-3(header): strong Tools
  q-item(clickable @click='inclusiveLangCheck')
    q-item-section(side)
      q-icon(name='mdi-atom-variant' size='xs' color='light-blue-4')
    q-item-section
      q-item-label Inclusive Language Check
      q-item-label.text-light-blue-3(caption) Check for usage of non-inclusive terms
  q-item(clickable @click='reindent')
    q-item-section(side)
      q-icon(name='mdi-page-previous-outline' size='xs' color='light-blue-4')
    q-item-section
      q-item-label Reindent
      q-item-label.text-light-blue-3(caption) Reformat Document Indentation
</template>

<script setup>
import { useQuasar } from 'quasar'
import { checkInclusiveLanguage } from 'src/tools/inclusive-language'
import { useDocsStore } from 'src/stores/docs'
import { useEditorStore } from 'src/stores/editor'
import { modelStore } from 'src/stores/models'

const $q = useQuasar()

// STORES

const docsStore = useDocsStore()
const editorStore = useEditorStore()

function inclusiveLangCheck () {
  editorStore.errors = checkInclusiveLanguage(modelStore[docsStore.activeDocument.id].getValue())
  if (editorStore.errors.length < 1) {
    $q.notify({
      message: 'Looks good!',
      caption: 'No non-inclusive terms found.',
      color: 'positive',
      icon: 'mdi-check'
    })
  } else {
    setTimeout(() => {
      EVENT_BUS.emit('editorCommand', 'editor.action.marker.next')
    })
  }
}

function reindent () {
  EVENT_BUS.emit('lspCommand', 'formatting')
}
</script>
