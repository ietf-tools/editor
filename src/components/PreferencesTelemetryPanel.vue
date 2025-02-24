<template lang="pug">
q-form.q-gutter-md.q-pa-lg
  .row
    .col
      .text-body2 Send telemetry to the IETF Tools team
      .text-caption.text-grey-5 Application traces, errors and performance metrics will be sent to the IETF Tools team for debugging and general improvement purposes.
    .col-auto
      q-toggle(
        v-model='editorStore.telemetry'
        color='primary'
        checked-icon='mdi-check'
        unchecked-icon='mdi-close'
        @update:model-value='updateTelemetryState'
      )
</template>

<script setup>
import { useEditorStore } from 'src/stores/editor'

const editorStore = useEditorStore()

// METHODS

function updateTelemetryState (newState) {
  window.ipcBridge.emit('setTelemetryState', { enabled: newState })
}
</script>
