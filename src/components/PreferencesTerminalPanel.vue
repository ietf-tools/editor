<template lang="pug">
q-form.q-gutter-md.q-pa-lg
  .row
    .col-8
      .text-body2 Shell Executable
      .text-caption.text-grey-5 The shell to use for the terminal.
    .col-4
      q-input(
        v-model.number='editorStore.terminalShell'
        outlined
        dense
        color='light-blue-4'
      )
  .row
    .col-8
      .text-body2 Shell Arguments
      .text-caption.text-grey-5 Additional arguments to supply to the shell executable.
    .col-4
      q-input(
        v-model.number='editorStore.terminalArgs'
        outlined
        dense
        color='light-blue-4'
      )
</template>

<script setup>
import { useEditorStore } from 'src/stores/editor'

const editorStore = useEditorStore()

</script>
