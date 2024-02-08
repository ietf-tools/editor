<template lang="pug">
q-dialog(ref='dialogRef' @hide='onDialogHide' no-backdrop-dismiss)
  q-card.mica(style='min-width: 800px;')
    q-card-section.flex.items-center.bg-light-blue-10
      q-icon(name='mdi-tray-arrow-down', left, size='sm')
      span Open from URL
    q-card-section.card-border
      q-card-section
        q-input(
          autofocus
          color='white'
          outlined
          label='Document URL'
          clearable
          v-model='state.url'
          tabindex='0'
          @keyup.enter='load'
          )
          template(#prepend)
            q-icon(name='mdi-link-variant')
      q-card-actions(align='right')
        q-btn(
          outline
          label='Cancel'
          color='grey-5'
          padding='xs md'
          @click='onDialogCancel'
          tabindex='2'
          )
        q-btn(
          unelevated
          label='Open'
          color='primary'
          padding='xs md'
          @click='load'
          tabindex='1'
          )

</template>

<script setup>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { reactive } from 'vue'
import { useDocsStore } from 'src/stores/docs'
import { last } from 'lodash-es'

const $q = useQuasar()

// EMITS

defineEmits([
  ...useDialogPluginComponent.emits
])

// STORES

const docsStore = useDocsStore()

// QUASAR

const { dialogRef, onDialogCancel, onDialogHide, onDialogOK } = useDialogPluginComponent()

// STATE

const state = reactive({
  url: ''
})

// METHODS

async function load () {
  try {
    if (!state.url) {
      throw new Error('You must enter a valid URL!')
    }
    const urlInfo = new URL(state.url)
    let filename = last(urlInfo.pathname.split('/'))
    let type = null

    const baseDocReq = await fetch(state.url)
    const baseDoc = await baseDocReq.text()

    if (filename.endsWith('.xml')) {
      type = 'xml'
    } else if (filename.endsWith('.txt')) {
      type = 'txt'
    } else if (baseDocReq.headers.get('content-type') === 'text/xml' || baseDoc.startsWith('<?xml')) {
      type = 'xml'
      filename = `${filename}.xml`
    } else if (baseDocReq.headers.get('content-type') === 'text/plain') {
      type = 'txt'
      filename = `${filename}.txt`
    } else {
      throw new Error('Could not determine a valid document type from the extension or the content type.')
    }

    docsStore.loadDocument({
      type,
      fileName: filename,
      data: baseDoc
    })
    onDialogOK()
  } catch (err) {
    $q.notify({
      message: 'Failed to fetch document',
      caption: err.message,
      color: 'negative',
      icon: 'mdi-alert'
    })
  }
}

</script>
