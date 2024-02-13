<template lang="pug">
q-bar.toolbar-main
  .toolbar-drawer
    q-btn-group(
      unelevated
      stretch
      v-for='pane of drawerPanes'
      :key='pane.key'
      )
      q-btn(
        :icon='pane.icon'
        :color='pane.key === editorStore.drawerPane ? `light-blue-7` : `light-blue-9`'
        :text-color='pane.key === editorStore.drawerPane ? `white` : `light-blue-3`'
        no-caps
        unelevated
        @click='editorStore.drawerPane = pane.key'
        )
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
        :color='doc.id === docsStore.active ? `light-blue-8` : `light-blue-9`'
        :text-color='doc.id === docsStore.active ? `white` : `light-blue-2`'
        no-caps
        unelevated
        @click='docsStore.switchToDocument(doc.id)'
        )
      q-btn(
        icon='mdi-close'
        :color='doc.id === docsStore.active ? `light-blue-8` : `light-blue-9`'
        :text-color='doc.id === docsStore.active ? `light-blue-2` : `light-blue-3`'
        size='xs'
        unelevated
        @click='closeDocument(doc)'
        )
    q-btn(
      icon='mdi-plus'
      color='light-blue-9'
      text-color='light-blue-2'
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
import { defineAsyncComponent } from 'vue'
import { useQuasar } from 'quasar'

import { useDocsStore } from 'src/stores/docs'
import { useEditorStore } from 'src/stores/editor'

const docsStore = useDocsStore()
const editorStore = useEditorStore()

const $q = useQuasar()

const drawerPanes = [
  {
    key: 'DrawerFiles',
    icon: 'mdi-folder-file'
  },
  {
    key: 'DrawerGit',
    icon: 'mdi-git'
  },
  {
    key: 'DrawerTools',
    icon: 'mdi-tools'
  },
  {
    key: 'DrawerSnippets',
    icon: 'mdi-library-shelves'
  }
]

// METHODS

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

function newDocument () {
  $q.dialog({
    component: defineAsyncComponent(() => import('components/NewDraftDialog.vue'))
  })
}

</script>

<style lang="scss">
.toolbar-main {
  height: 40px;
  background: radial-gradient(ellipse at bottom, $light-blue-9, darken($light-blue-10, 5%));
  border-bottom: 1px solid $light-blue-5;
}
.toolbar-drawer {
  width: 330px;
  padding-top: 7px;
  height: 32px;

  .q-btn {
    margin-right: 1px;
  }
}
.toolbar-docs {
  height: 32px;
  padding-top: 7px;
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
