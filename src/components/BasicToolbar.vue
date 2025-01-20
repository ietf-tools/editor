<template lang="pug">
q-bar.toolbar-basic
  .toolbar-drawer
    q-btn-group(
      unelevated
      stretch
      v-for='pane of drawerPanes'
      :key='pane.key'
      )
      q-btn(
        :icon='pane.icon'
        :color='pane.key === editorStore.drawerPane ? `blue-grey-7` : `blue-grey-9`'
        :text-color='pane.key === editorStore.drawerPane ? `white` : `blue-grey-3`'
        no-caps
        unelevated
        @click='editorStore.drawerPane = pane.key'
        :disabled='pane.needDocument && !docsStore.active'
        )
        q-tooltip {{ pane.label }}
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
        color='blue-grey-9'
        text-color='blue-grey-2'
        no-caps
        unelevated
        @click='switchToDocument(doc)'
        )
      q-btn(
        icon='mdi-close'
        color='blue-grey-9'
        text-color='blue-grey-3'
        size='xs'
        unelevated
        @click='closeDocument(doc)'
        )
    q-btn(
      v-if='editorStore.mode === `write`'
      icon='mdi-plus'
      color='light-blue-9'
      text-color='light-blue-2'
      unelevated
      square
      @click='newDocument'
      )
  q-space
  q-btn(
    flat
    icon='mdi-cog'
    color='blue-grey-3'
    @click='openPreferences'
    padding='xs sm'
    )
    q-tooltip Preferences
  q-separator.q-mx-sm(inset vertical)
  account-menu
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import AccountMenu from './AccountMenu.vue'

import { useDocsStore } from 'src/stores/docs'
import { useEditorStore } from 'src/stores/editor'

const router = useRouter()

const docsStore = useDocsStore()
const editorStore = useEditorStore()

const $q = useQuasar()

const drawerPanes = [
  {
    key: 'DrawerFiles',
    icon: 'mdi-folder-file',
    label: 'Files'
  },
  {
    key: 'DrawerGit',
    icon: 'mdi-git',
    label: 'Git'
  }
]

// METHODS

function switchToDocument (doc) {
  docsStore.switchToDocument(doc.id)
  router.push({ name: 'editor' })
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

function openPreferences () {
  $q.dialog({
    component: defineAsyncComponent(() => import('./PreferencesDialog.vue'))
  })
}
</script>

<style lang="scss">
@use "sass:color";

.toolbar-basic {
  height: 40px;
  background: radial-gradient(ellipse at bottom, $blue-grey-9, color.adjust($blue-grey-10, $lightness: -5%));
  border-bottom: 1px solid $blue-grey-5;
  border-left: 1px solid $blue-grey-5;

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
}
</style>
