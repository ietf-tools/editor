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
        icon='mdi-file-document-outline'
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
        @click='docsStore.closeDocument(doc.id)'
        )
    q-btn(
      icon='mdi-plus'
      color='light-blue-9'
      unelevated
      square
      @click='newDocument'
      )
  q-space
  q-btn(padding="xs sm" flat no-caps)
    span.text-body2 ada.lovelace@acme.org
    q-icon.q-ml-sm(name='mdi-account-circle')
</template>

<script setup>
import { useDocsStore } from 'src/stores/docs'

const docsStore = useDocsStore()

function newDocument () {
  docsStore.loadDocument({
    data: ''
  })
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
