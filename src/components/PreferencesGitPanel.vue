<template lang="pug">
q-form.q-gutter-md.q-pa-lg
  .row
    .col-8
      .text-body2 Name
      .text-caption.text-grey-5 The name to use when creating commits.
    .col-4
      q-input(
        v-model.number='editorStore.gitName'
        outlined
        dense
        color='light-blue-4'
      )
  .row
    .col-8
      .text-body2 Email Address
      .text-caption.text-grey-5 The email address to use when creating commits. It should match your git provider email address.
    .col-4
      q-input(
        v-model.number='editorStore.gitEmail'
        outlined
        dense
        color='light-blue-4'
      )
  q-separator
  .row
    .col
      .text-body2 Sign Commits
      .text-caption.text-grey-5 Use OpenPGP signing when creating commits.
    .col-auto
      q-toggle(
        v-model='editorStore.gitSignCommits'
        checked-icon='mdi-check'
        unchecked-icon='mdi-close'
      )
  .row(v-if='editorStore.gitSignCommits && editorStore.debugExperimental')
    .col
      .text-body2 Use System Default Signing Key
      .text-caption.text-grey-5 Use the signing key configured globally in git on your system.
    .col-auto
      q-toggle(
        v-model='editorStore.gitUseDefaultSigningKey'
        checked-icon='mdi-check'
        unchecked-icon='mdi-close'
      )
  .row(v-if='editorStore.gitSignCommits && !editorStore.gitUseDefaultSigningKey && editorStore.debugExperimental')
    .col
      .text-body2 OpenPGP Signing Key
      .text-caption.text-grey-5 Set the key to use for signing commits.
      .text-caption.flex(v-if='editorStore.gitPgpKeySet')
        q-badge(label='ed25519', color='green-9')
        q-separator.q-mx-sm(vertical)
        .text-uppercase.text-purple-2 {{ editorStore.gitFingerprint }}
        q-separator.q-mx-sm(vertical)
        a.text-light-blue-3(href='#', @click.stop.prevent='copyPublicKey') Copy Public Key
    .col-auto
      q-btn(
        :label='editorStore.gitPgpKeySet ? `Generate New` : `Setup`'
        color='primary'
        no-caps
        @click='setupPGPKey'
      )
      q-btn.q-ml-sm(
        v-if='editorStore.gitPgpKeySet'
        label='Clear'
        color='negative'
        no-caps
        @click='clearPGPKey'
      )
</template>

<script setup>
import { defineAsyncComponent, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import { useEditorStore } from 'src/stores/editor'

const editorStore = useEditorStore()
const $q = useQuasar()

// METHODS

function setupPGPKey () {
  $q.dialog({
    component: defineAsyncComponent(() => import('components/OpenPGPSetupDialog.vue'))
  })
}

function clearPGPKey () {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to clear this OpenPGP signing key? Note that you must still remove the key from git provider afterwards.',
    persistent: true,
    focus: 'none',
    ok: {
      color: 'negative',
      textColor: 'white',
      unelevated: true,
      label: 'Clear',
      noCaps: true
    },
    cancel: {
      color: 'grey-3',
      outline: true,
      noCaps: true
    }
  }).onOk(async () => {
    const succeeded = await window.ipcBridge.clearGitKey()
    if (succeeded) {
      await editorStore.fetchGitConfig()
      $q.notify({
        message: 'Signing key cleared successfully.',
        caption: 'The revocation certificate has been copied to your clipboard.',
        color: 'positive',
        icon: 'mdi-check'
      })
    }
  })
}

function copyPublicKey () {
  window.ipcBridge.emit('copyGitPublicKey')
  $q.notify({
    message: 'Public key copied to clipboard.',
    color: 'positive',
    icon: 'mdi-clipboard-check-outline'
  })
}

onBeforeUnmount(() => {
  editorStore.saveGitConfig()
})

</script>
