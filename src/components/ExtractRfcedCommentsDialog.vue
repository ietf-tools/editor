<template lang="pug">
q-dialog(
  ref='dialogRef'
  @hide='onDialogHide'
  :transition-show='editorStore.animationEffects ? `jump-up` : `none`'
  :transition-hide='editorStore.animationEffects ? `jump-down` : `none`'
  )
  q-card.mica(style='min-width: 800px;')
    q-card-section.flex.items-center.bg-light-blue-10
      q-icon(name='mdi-comment-arrow-right-outline', left, size='sm')
      span Extract [rfced] Comments
    q-card-section.card-border
      q-card-section.q-pa-sm(style='max-height: 520px')
        q-input(
          autofocus
          color='light-blue-4'
          outlined
          v-model='state.output'
          tabindex='0'
          type='textarea'
          autogrow
          input-style='max-height: 500px;'
          )
      q-card-actions(align='right')
        q-btn(
          outline
          label='Close'
          color='grey-5'
          padding='xs md'
          @click='onDialogCancel'
          tabindex='3'
          )
        q-btn(
          unelevated
          label='Copy to Clipboard'
          color='primary'
          padding='xs md'
          @click='copyToClipboard'
          tabindex='2'
          )
        q-btn(
          unelevated
          label='Save to File'
          color='primary'
          padding='xs md'
          @click='saveToFile'
          tabindex='1'
          )

</template>

<script setup>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { onMounted, reactive } from 'vue'
import { useDocsStore } from 'src/stores/docs'
import { useEditorStore } from 'src/stores/editor'
import { modelStore } from 'src/stores/models'

const commentsRgx = /<!-- \[rfced\]([^]+?)-->/gmi

const $q = useQuasar()

// EMITS

defineEmits([
  ...useDialogPluginComponent.emits
])

// STORES

const docsStore = useDocsStore()
const editorStore = useEditorStore()

// QUASAR

const { dialogRef, onDialogCancel, onDialogHide } = useDialogPluginComponent()

// STATE

const state = reactive({
  output: ''
})

// METHODS

function copyToClipboard () {
  window.ipcBridge.emit('writeToClipboard', {
    text: state.output
  })
  $q.notify({
    message: 'Comments copied!',
    caption: 'Comments have been copied to the clipboard successfully.',
    color: 'positive',
    icon: 'mdi-clipboard'
  })
}

async function saveToFile () {
  let filePath = docsStore.activeDocument.path
  const extPosition = filePath.lastIndexOf('.')
  if (extPosition >= 0) {
    filePath = filePath.slice(0, extPosition)
  }
  filePath = `${filePath}-comments.txt`

  if (await window.ipcBridge.saveContentToFile(state.output, filePath, 'Save Comments As...')) {
    $q.notify({
      message: 'Comments saved!',
      caption: 'Comments have been saved to file successfully.',
      color: 'positive',
      icon: 'mdi-comment-check-outline'
    })
  }
}

// MOUNTED

onMounted(() => {
  const contents = modelStore[docsStore.activeDocument.id].getValue()
  const comments = []
  for (const match of contents.matchAll(commentsRgx)) {
    comments.push(match[1].trim())
  }
  if (comments.length > 0) {
    state.output = comments.join('\n\n============\n\n')
  } else {
    $q.notify({
      message: 'No comments found.',
      caption: 'No comments found in the active document.',
      color: 'negative',
      icon: 'mdi-alert'
    })
    setTimeout(() => {
      onDialogCancel()
    })
  }
})

</script>
