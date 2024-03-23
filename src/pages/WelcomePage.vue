<template lang="pug">
q-page.welcome.bg-dark-5
  .welcome-container.q-pa-lg
    .welcome-logo
      img(src='../assets/draftforge-logotext.svg', alt='DraftForge')
    .welcome-text.q-mt-lg
      .text-body1: strong Welcome to DraftForge
      .text-caption.text-blue-grey-3 The editor for writing, reviewing, refining and submit Internet-Drafts.
    q-list.q-mt-md.rounded-borders(
      separator
      bordered
      )
      q-item(clickable, @click='newDocument')
        q-item-section(side)
          q-icon(name='mdi-file-document-plus-outline')
        q-item-section
          q-item-label New Draft
        q-item-section(side)
          q-icon(name='mdi-chevron-right', color='blue-grey-7')
      q-item(clickable, @click='openDocument')
        q-item-section(side)
          q-icon(name='mdi-file-document-edit-outline')
        q-item-section
          q-item-label Open...
        q-item-section(side)
          q-icon(name='mdi-chevron-right', color='blue-grey-7')
      q-item(clickable, @click='openRemoteDocument')
        q-item-section(side)
          q-icon(name='mdi-tray-arrow-down')
        q-item-section
          q-item-label Open from URL...
        q-item-section(side)
          q-icon(name='mdi-chevron-right', color='blue-grey-7')

    q-list.q-mt-md.rounded-borders(
      separator
      bordered
      )
      q-item(clickable, @click='restoreSession')
        q-item-section(side)
          q-icon(name='mdi-history', color='indigo-3')
        q-item-section
          q-item-label.text-indigo-3 Restore last session...
        q-item-section(side)
          q-icon(name='mdi-chevron-right', color='blue-grey-7')
    .welcome-copyright.q-mt-xl
      .text-caption: strong DraftForge {{ appVersion }}
      .text-caption Brought to you with #[q-icon(name='mdi-heart')] by the IETF Tools team!
      .text-caption #[a(@click.stop.prevent='viewGitHub', href='#') GitHub] | #[a(@click.stop.prevent='reportBug', href='#') Report Bug] | #[a(@click.stop.prevent='viewLicense', href='#') View license]
</template>

<script setup>
import { useQuasar } from 'quasar'
import { defineAsyncComponent, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDocsStore } from 'src/stores/docs'

const $q = useQuasar()

const appVersion = process.env.APP_VERSION ?? 'Unknown'

// STORES

const docsStore = useDocsStore()

// ROUTER

const router = useRouter()

// WATCH

watch(() => docsStore.active, (newValue) => {
  if (newValue) {
    router.replace('/editor')
  }
})

// METHODS

function newDocument () {
  $q.dialog({
    component: defineAsyncComponent(() => import('components/NewDraftDialog.vue'))
  })
}

function openDocument () {
  window.ipcBridge.emit('open')
}

function openRemoteDocument () {
  $q.dialog({
    component: defineAsyncComponent(() => import('components/OpenFromUrlDialog.vue'))
  })
}

async function restoreSession () {
  try {
    await docsStore.restoreSession()
  } catch (err) {
    $q.notify({
      message: 'Could not restore',
      caption: err.message,
      color: 'negative',
      icon: 'mdi-alert'
    })
  }
}

function viewGitHub () {
  window.ipcBridge.emit('launchBrowser', { url: 'https://github.com/ietf-tools/editor' })
}
function reportBug () {
  window.ipcBridge.emit('launchBrowser', { url: 'https://github.com/ietf-tools/editor/issues' })
}
function viewLicense () {
  window.ipcBridge.emit('launchBrowser', { url: 'https://github.com/ietf-tools/editor/blob/main/LICENSE' })
}

// MOUNTED

onMounted(() => {
  document.getElementById('app-loading')?.remove()
})
</script>

<style lang="scss">
.welcome {
  background: linear-gradient(45deg, darken($dark-4, 2%), $dark-6);

  &-container {
    max-width: 650px;
    margin: 0 auto;
    padding-top: calc(50vh - 350px);
  }

  &-logo {
    opacity: .15;
    width: 100%;
  }

  &-copyright {
    color: $blue-grey-5;
  }
}
</style>
