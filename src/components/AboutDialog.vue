<template lang="pug">
q-dialog(ref='dialogRef', @hide='onDialogHide')
  q-card(style='min-width: 600px;')
    q-card-section.flex.items-center.bg-light-blue-10
      q-icon(name='mdi-information-outline', left, size='sm')
      span About DraftForge
      q-space
      q-btn(
        unelevated
        icon='mdi-close'
        color='primary'
        padding='xs'
        @click='onDialogOK'
        )
    img(src='../assets/draftforge-banner.png' alt="DraftForge")
    q-card-section.bg-black
      .text-caption App Version: #[strong {{ appVersion }}]
      .text-caption Quasar Framework Version: #[strong {{ $q.version }}]
      .text-caption Electron Version: #[strong {{ electronVersion }}]
      .text-caption Chrome Version: #[strong {{ chromeVersion }}]
      .text-caption Node.js Version: #[strong {{ nodeVersion }}]
      .q-mt-md.text-amber-5
        .text-caption Licensed under BSD 3-Clause
        .text-caption Copyright © 2023-{{ currentYear }}, The IETF Trust
        .text-caption All rights reserved.

</template>

<script setup>
import { useDialogPluginComponent, useQuasar } from 'quasar'

const $q = useQuasar()

// EMITS

defineEmits([
  ...useDialogPluginComponent.emits
])

// QUASAR

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

// INFO

console.info(window.ipcBridge.versions)

const appVersion = process.env.APP_VERSION ?? 'Unknown'
const currentYear = new Date().getFullYear()
const chromeVersion = window.ipcBridge.versions.chrome
const electronVersion = window.ipcBridge.versions.electron
const nodeVersion = window.ipcBridge.versions.node
</script>
