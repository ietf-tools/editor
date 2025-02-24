<template lang="pug">
q-form.q-gutter-md.q-pa-lg
  .row
    .col
      .text-body2 Persist Session on Close
      .text-caption.text-grey-5 Save your current session on close to be able to restore it the next time you launch the editor.
    .col-auto
      q-toggle(
        v-model='editorStore.persistSession'
        checked-icon='mdi-check'
        unchecked-icon='mdi-close'
      )
  .row(v-if='editorStore.persistSession')
    .col
      .text-body2 Restore Last Session on Launch
      .text-caption.text-grey-5 Automatically restore the last session when launching the editor.
    .col-auto
      q-toggle(
        v-model='editorStore.restoreSession'
        checked-icon='mdi-check'
        unchecked-icon='mdi-close'
      )
  .row
    .col
      .text-body2 Confirm Before Closing
      .text-caption.text-grey-5 Whether to prompt for confirmation before exiting.
    .col-auto
      q-toggle(
        v-model='editorStore.confirmExit'
        checked-icon='mdi-check'
        unchecked-icon='mdi-close'
      )
  q-separator
  .row
    .col
      .text-body2 Enable Translucency Effects
      .text-caption.text-grey-5 Show translucent background effects on modals and menu UI elements.
    .col-auto
      q-toggle(
        v-model='editorStore.translucencyEffects'
        checked-icon='mdi-check'
        unchecked-icon='mdi-close'
      )
  .row
    .col
      .text-body2 Enable Animations
      .text-caption.text-grey-5 Use transition animations for modals and dialogs.
    .col-auto
      q-toggle(
        v-model='editorStore.animationEffects'
        checked-icon='mdi-check'
        unchecked-icon='mdi-close'
      )
  q-separator
  .row
    .col
      .text-body2 Automatically Check for Updates
      .text-caption.text-grey-5 The application will automatically check for new versions at launch.
    .col-auto
      q-toggle(
        v-model='editorStore.checkForUpdates'
        checked-icon='mdi-check'
        unchecked-icon='mdi-close'
      )
    q-separator.q-ml-sm.q-mr-md(vertical, inset)
    .col-auto
      q-btn(
        label='Check Now'
        unelevated
        color='primary'
        no-caps
        @click='checkForUpdates'
      )
</template>

<script setup>
import { useEditorStore } from 'src/stores/editor'

const editorStore = useEditorStore()

// METHODS

function checkForUpdates () {
  window.ipcBridge.emit('checkForUpdates')
}

</script>

<style lang="scss">

</style>
