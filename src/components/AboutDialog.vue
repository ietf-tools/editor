<template lang="pug">
q-dialog(ref='dialogRef', @hide='onDialogHide')
  q-card(style='min-width: 600px;')
    q-card-section.flex.items-center.bg-light-blue-10
      q-icon(name='mdi-information-outline', left, size='sm')
      span About DraftForge
      q-space
      q-btn(
        unelevated
        label='Close'
        color='primary'
        padding='xs md'
        @click='onDialogOK'
        )
    img(src='/images/draftforge-banner.png' alt="DraftForge")
    q-card-section.bg-black
      .text-caption App Version: #[strong {{ appVersion }}]
      .text-caption Execution Mode: #[strong {{ appMode }}]
      .text-caption Quasar Framework Version: #[strong {{ $q.version }}]

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

const appVersion = process.env.APP_VERSION ?? 'Unknown'
const appMode = process.env.MODE ?? 'Unknown'
</script>