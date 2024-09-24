<template lang="pug">
q-dialog(v-model='state.shown' seamless position='bottom' no-focus allow-focus-outside)
  q-card.bg-dark-4(style='width:400px')
    q-linear-progress(
      v-if='state.working'
      indeterminate
      color='blue-6'
      )

    q-item
      q-item-section(side)
        q-icon(name='mdi-swap-vertical-bold')
      q-item-section
        q-item-label {{ state.message }}

    q-card-actions(v-if='state.actionsShown')
      q-space
      q-btn(
        label='Ignore'
        unelevated
        color='grey-8'
        icon='mdi-close'
        no-caps
        @click='discard'
        )
      q-btn(
        label='Update Now'
        unelevated
        color='primary'
        icon='mdi-tray-arrow-down'
        no-caps
        @click='updateNow'
        )
</template>

<script setup>
import { reactive } from 'vue'

// STATE

const state = reactive({
  shown: false,
  working: true,
  actionsShown: false,
  message: 'Checking for updates...'
})

// EVENT LISTENERS

window.ipcBridge.subscribe('setUpdaterDialog', (evt, opts) => {
  state.shown = opts.shown ?? false
  state.working = opts.working ?? true
  state.actionsShown = opts.actionsShown ?? false
  state.message = opts.message ?? 'Checking for updates...'
})

// METHODS

function updateNow () {
  window.ipcBridge.emit('updateNow')
}

function discard () {
  state.shown = false
}

</script>
