<template lang="pug">
q-bar.toolbar-submit
  q-space
  q-btn(
    flat
    icon='mdi-cog'
    color='light-green-3'
    @click='openPreferences'
    padding='xs sm'
    )
    q-tooltip Preferences
  q-separator.q-mx-sm(inset vertical)
  account-menu
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import { useQuasar } from 'quasar'
import AccountMenu from './AccountMenu.vue'

const $q = useQuasar()

// METHODS

function openPreferences () {
  $q.dialog({
    component: defineAsyncComponent(() => import('./PreferencesDialog.vue'))
  })
}
</script>

<style lang="scss">
.toolbar-submit {
  height: 40px;
  background: radial-gradient(ellipse at bottom, $light-green-9, darken($light-green-10, 5%));
  border-bottom: 1px solid $light-green-5;
  border-left: 1px solid $light-green-5;
}
</style>
