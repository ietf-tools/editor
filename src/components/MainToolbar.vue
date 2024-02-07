<template lang="pug">
q-bar.toolbar-main
  .toolbar-docs
    q-btn-group(
      unelevated
      stretch
      v-for='doc of docsStore.opened'
      :key='doc.id'
      )
      q-btn(
        :icon='doc.isModified ? `mdi-file-document-edit-outline` : `mdi-file-document-outline`'
        :label='doc.fileName'
        :color='doc.id === docsStore.active ? `light-blue-7` : `light-blue-9`'
        no-caps
        unelevated
        @click='docsStore.switchToDocument(doc.id)'
        )
      q-btn(
        icon='mdi-close'
        :color='doc.id === docsStore.active ? `light-blue-7` : `light-blue-9`'
        size='xs'
        unelevated
        @click='closeDocument(doc)'
        )
    q-btn(
      icon='mdi-plus'
      color='light-blue-9'
      unelevated
      square
      )
      q-menu.mica(auto-close)
        q-list(separator)
          q-item(
            clickable
            @click='newDocument(`xml`)'
            )
            q-item-section(side)
              q-icon(name='mdi-xml')
            q-item-section New XML Internet Draft
          q-item(
            clickable
            @click='newDocument(`txt`)'
            )
            q-item-section(side)
              q-icon(name='mdi-text-long')
            q-item-section New Text Internet Draft
  q-space
  q-btn(padding="xs sm" flat no-caps)
    span.text-body2 ada.lovelace@acme.org
    q-icon.q-ml-sm(name='mdi-account-circle')
</template>

<script setup>
import { useQuasar } from 'quasar'

import { useDocsStore } from 'src/stores/docs'

const docsStore = useDocsStore()
const $q = useQuasar()

function newDocument (docType) {
  docsStore.loadDocument({
    fileName: `untitled-draft.${docType}`,
    data: ''
  })
}

function closeDocument (doc) {
  if (doc.isModified) {
    $q.dialog({
      title: 'Confirm',
      message: 'Are you sure you want to close this document and discard changes?',
      persistent: true,
      ok: {
        label: 'Confirm',
        color: 'negative',
        unelevated: true
      },
      cancel: {
        label: 'Cancel',
        color: 'grey',
        flat: true
      }
    }).onOk(() => {
      docsStore.closeDocument(doc.id)
    })
  } else {
    docsStore.closeDocument(doc.id)
  }
}

</script>

<style lang="scss">
.toolbar-main {
  height: 40px;
  background: radial-gradient(ellipse at bottom, $light-blue-9, $light-blue-10)
}
.toolbar-docs {
  height: 32px;
  padding-top: 8px;
  display: flex;

  .q-btn-group {
    margin-right: 8px;

    > .q-btn:last-child {
      padding: 5px;
      height: 28px;
    }
  }
}
</style>
