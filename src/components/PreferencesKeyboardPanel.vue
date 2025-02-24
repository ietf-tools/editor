<template lang="pug">
q-form.q-gutter-md.q-pa-lg
  .row
    .col-8
      .text-body2 Mode Preset
      .text-caption.text-grey-5 Keyboard shortcuts mode to use with the editor.
    .col-4
      q-select(
        outlined
        v-model='editorStore.keybindings'
        :options='keybindings'
        dense
        color='light-blue-4'
        emit-value
        map-options
        )
  q-separator
  .row
    .col
      .text-body2 Control Modifier
      .text-caption.text-grey-5 Set the key to use as the Control modifier
    .col-auto.self-center
      q-chip(color='purple-2', square, outline) ControlLeft
    q-separator.q-ml-sm.q-mr-md(vertical, inset)
    .col-auto
      q-btn(
        label='Change'
        unelevated
        color='primary'
        no-caps
      )
  .row
    .col
      .text-body2 Meta Modifier
      .text-caption.text-grey-5 Set the key to use as the Meta modifier
    .col-auto.self-center
      q-chip(color='purple-2', square, outline) Escape
    q-separator.q-ml-sm.q-mr-md(vertical, inset)
    .col-auto
      q-btn(
        label='Change'
        unelevated
        color='primary'
        no-caps
      )
</template>

<script setup>
import { useEditorStore } from 'src/stores/editor'

const editorStore = useEditorStore()

// STATE

const keybindings = [
  {
    label: 'VS Code (default)',
    value: 'default'
  },
  {
    label: 'Emacs',
    value: 'emacs'
  },
]

</script>

<style lang="scss">

</style>
