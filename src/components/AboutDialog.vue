<template lang="pug">
q-dialog(
  ref='dialogRef'
  @hide='onDialogHide'
  :transition-show='editorStore.animationEffects ? `jump-up` : `none`'
  :transition-hide='editorStore.animationEffects ? `jump-down` : `none`'
  )
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
      .q-mt-md.text-blue-2
        .text-caption Brought to you with #[q-icon(name='mdi-heart')] by the IETF Tools team!
        .text-caption #[a(@click.stop.prevent='viewGitHub', href='#') GitHub] | #[a(@click.stop.prevent='reportBug', href='#') Report Bug] | #[a(@click.stop.prevent='viewLicense', href='#') View license]

</template>

<script setup>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { useEditorStore } from 'src/stores/editor'

const editorStore = useEditorStore()

const $q = useQuasar()

// EMITS

defineEmits([
  ...useDialogPluginComponent.emits
])

// QUASAR

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

// INFO

const appVersion = process.env.APP_VERSION ?? 'Unknown'
const chromeVersion = window.ipcBridge.versions.chrome
const electronVersion = window.ipcBridge.versions.electron
const nodeVersion = window.ipcBridge.versions.node

// METHODS

function viewGitHub () {
  window.ipcBridge.emit('launchBrowser', { url: 'https://github.com/ietf-tools/editor' })
}
function reportBug () {
  window.ipcBridge.emit('launchBrowser', { url: 'https://github.com/ietf-tools/editor/issues' })
}
function viewLicense () {
  window.ipcBridge.emit('launchBrowser', { url: 'https://github.com/ietf-tools/editor/blob/main/LICENSE' })
}
</script>
