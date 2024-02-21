<template lang="pug">
q-dialog(ref='dialogRef' @hide='onDialogHide' no-backdrop-dismiss)
  q-card.mica(style='min-width: 800px;')
    q-card-section.flex.items-center.bg-light-blue-10
      q-icon(name='mdi-key-variant', left, size='sm')
      span Setup OpenPGP Signing Key
    q-card-section.card-border
      q-card-section
        .row
          .col-6
            .text-body2 Name
            .text-caption.text-grey-5 Enter your name.
          .col-6
            q-input(
              autofocus
              color='white'
              outlined
              dense
              v-model='state.name'
              tabindex='0'
              )
              template(#prepend)
                q-icon(name='mdi-account')
        .row.q-mt-lg
          .col-6
            .text-body2 Email Address
            .text-caption.text-grey-5 This #[strong.text-red-3 MUST] match your git provider email.
          .col-6
            q-input(
              autofocus
              color='white'
              outlined
              dense
              v-model='state.email'
              tabindex='1'
              type='email'
              )
              template(#prepend)
                q-icon(name='mdi-email-outline')
        .row.q-mt-lg
          .col-12
            q-btn.full-width(
              label='Generate Key'
              color='primary'
              no-caps
              tabindex='2'
              @click='generatePGPKey'
              icon='mdi-key'
              :loading='state.isLoading'
            )
        q-separator.q-mt-lg
        .row.q-mt-lg
          .col-12
            q-input(
              type='textarea'
              autofocus
              color='white'
              dense
              outlined
              v-model='state.publicKey'
              tabindex='3'
              readonly
              rows='12'
              )
        .row.q-mt-lg
          .col-7
            .text-body2 Add a new OpenPGP key to your git provider
            .text-caption.text-grey-5 Copy the public key above and save it on your git provider.
          .col-5
            q-btn.full-width(
              label='Go to GitHub Account GPG keys'
              color='primary'
              no-caps
              tabindex='2'
              @click='launchGitHubKeys'
              icon='mdi-open-in-app'
            )
      q-card-actions(align='right')
        q-btn(
          outline
          label='Cancel'
          color='grey-5'
          padding='xs md'
          @click='onDialogCancel'
          tabindex='5'
          )
        q-btn(
          unelevated
          label='Save Key'
          color='primary'
          padding='xs md'
          @click='saveKey'
          tabindex='4'
          :disabled='!state.publicKey'
          )

</template>

<script setup>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { onBeforeUnmount, onMounted, reactive } from 'vue'
import * as openpgp from 'openpgp'
import { useEditorStore } from 'src/stores/editor'

const $q = useQuasar()

// EMITS

defineEmits([
  ...useDialogPluginComponent.emits
])

// STORES

const editorStore = useEditorStore()

// QUASAR

const { dialogRef, onDialogCancel, onDialogHide, onDialogOK } = useDialogPluginComponent()

// STATE

const state = reactive({
  name: '',
  email: '',
  publicKey: '',
  privateKey: '',
  revocationCertificate: '',
  fingerprint: '',
  isLoading: false
})

// METHODS

function launchGitHubKeys () {
  window.ipcBridge.emit('launchBrowser', {
    url: 'https://github.com/settings/keys'
  })
}

async function generatePGPKey () {
  if (state.name.length < 2 || state.email.indexOf('@') < 1) {
    $q.notify({
      message: 'Invalid Name / Email',
      caption: 'Enter a valid name and email address.',
      color: 'negative',
      icon: 'mdi-alert'
    })
    return
  }
  state.isLoading = true
  try {
    const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
      type: 'rsa',
      rsaBits: 4096,
      userIDs: [{ name: state.name, email: state.email }]
    })

    window.ipcBridge.emit('writeToClipboard', {
      text: publicKey
    })

    state.privateKey = privateKey
    state.publicKey = publicKey
    state.revocationCertificate = revocationCertificate

    // Get fingerprint from signature

    const privateKeyRaw = await openpgp.readPrivateKey({ armoredKey: privateKey })
    const message = await openpgp.createMessage({ text: 'message' })
    const armoredSignature = await openpgp.sign({
      message,
      signingKeys: privateKeyRaw,
      detached: true
    })
    const signature = await openpgp.readSignature({ armoredSignature })
    state.fingerprint = signature.getSigningKeyIDs().map(x => x.toHex())[0]

    $q.notify({
      message: 'Public key copied to clipboard.',
      color: 'positive',
      icon: 'mdi-clipboard-check-outline'
    })
  } catch (err) {
    console.error(err)
    $q.notify({
      message: 'Failed to generate key',
      caption: err.message,
      color: 'negative',
      icon: 'mdi-alert'
    })
  }
  state.isLoading = false
}

async function saveKey () {
  try {
    editorStore.gitName = state.name
    editorStore.gitEmail = state.email
    editorStore.gitPgpKeySet = true
    editorStore.gitFingerprint = state.fingerprint

    window.ipcBridge.emit('updateGitConfig', {
      name: state.name,
      email: state.email,
      privateKey: state.privateKey,
      publicKey: state.publicKey,
      revocationCertificate: state.revocationCertificate,
      fingerprint: state.fingerprint
    })

    $q.notify({
      message: 'OpenPGP Signing Key saved successfully!',
      color: 'positive',
      icon: 'mdi-check'
    })

    onDialogOK()
  } catch (err) {
    $q.notify({
      message: 'Failed to save OpenPGP Signing Key',
      caption: err.message,
      color: 'negative',
      icon: 'mdi-alert'
    })
  }
}

// LIFECYCLE HOOKS

onBeforeUnmount(() => {
  state.privateKey = ''
  state.revocationCertificate = ''
})

onMounted(() => {
  state.name = editorStore.gitName
  state.email = editorStore.gitEmail
})

</script>
