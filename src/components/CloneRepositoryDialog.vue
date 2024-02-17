<template lang="pug">
q-dialog(ref='dialogRef' @hide='onDialogHide' no-backdrop-dismiss)
  q-card.mica(style='min-width: 800px;')
    q-card-section.flex.items-center.bg-light-blue-10
      q-icon(name='mdi-git', left, size='sm')
      span Clone Repository
    q-card-section.card-border
      q-card-section
        .row
          .col-12
            .text-body2 Git Repository URL
            .text-caption.text-grey-5 The HTTPS Web URL of the repository to clone.
          .col-12
            q-input.q-mt-sm(
              autofocus
              color='white'
              outlined
              dense
              placeholder='e.g. https://github.com/rfc-editor/draft-abc-def-ghi'
              clearable
              v-model='state.url'
              tabindex='0'
              )
              template(#prepend)
                q-icon(name='mdi-source-branch')
        .row.q-mt-lg
          .col-12
            .text-body2 Local Target Directory
            .text-caption.text-grey-5 The destination folder will be created automatically if it doesn't exist.
          .col-12
            q-input.q-mt-sm(
              autofocus
              color='white'
              dense
              outlined
              clearable
              v-model='state.target'
              tabindex='1'
              )
              template(#prepend)
                q-icon(name='mdi-folder-wrench-outline')
        .row.q-mt-lg
          .col
            .text-body2 Switch Working Directory
            .text-caption.text-grey-5 Automatically set the local target directory as the working directory.
          .col-auto
            q-toggle(
              v-model='editorStore.formatOnType'
            )
      q-card-actions(align='right')
        q-btn(
          outline
          label='Cancel'
          color='grey-5'
          padding='xs md'
          @click='onDialogCancel'
          tabindex='4'
          )
        q-btn(
          unelevated
          label='Clone'
          color='primary'
          padding='xs md'
          @click='cloneRepo'
          tabindex='3'
          )

</template>

<script setup>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { reactive } from 'vue'
// import { useDocsStore } from 'src/stores/docs'
import { useEditorStore } from 'src/stores/editor'

const $q = useQuasar()

// EMITS

defineEmits([
  ...useDialogPluginComponent.emits
])

// STORES

// const docsStore = useDocsStore()
const editorStore = useEditorStore()

// QUASAR

const { dialogRef, onDialogCancel, onDialogHide, onDialogOK } = useDialogPluginComponent()

// STATE

const state = reactive({
  url: '',
  target: editorStore.workingDirectory
})

// METHODS

async function cloneRepo () {
  try {
    if (!state.url) {
      throw new Error('You must enter a valid URL!')
    }
    if (!state.target) {
      throw new Error('You must enter a valid local target directory!')
    }

    $q.notify({
      message: 'Not yet implemented!',
      color: 'negative',
      icon: 'mdi-alert'
    })

    onDialogOK()
  } catch (err) {
    $q.notify({
      message: 'Failed to clone repository',
      caption: err.message,
      color: 'negative',
      icon: 'mdi-alert'
    })
  }
}

</script>
