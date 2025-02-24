<template lang="pug">
q-form.q-gutter-md.q-pa-lg
  .flex.items-center.text-red-5
    q-icon.animated.fadeIn.infinite.slower.q-mr-sm(name='mdi-alert' size='sm')
    span These settings are for development / debugging purposes only.
  q-separator.q-my-md(inset)
  .row
    .col
      .text-body2 Disable Unload Handlers
      .text-caption.text-grey-5 Prevent beforeUnload handlers from running.
    .col-auto
      q-toggle(
        v-model='editorStore.debugDisableUnload'
        color='red'
        checked-icon='mdi-check'
        unchecked-icon='mdi-close'
      )
  .row
    .col
      .text-body2 Enable Experimental Features
      .text-caption.text-grey-5 Show unfinished / untested features.
    .col-auto
      q-toggle(
        v-model='editorStore.debugExperimental'
        color='red'
        checked-icon='mdi-check'
        unchecked-icon='mdi-close'
      )
</template>

<script setup>
import { useEditorStore } from 'src/stores/editor'

const editorStore = useEditorStore()
</script>
