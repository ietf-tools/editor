<template lang="pug">
q-bar.toolbar-review(:class='{ "has-mode-sd": editorStore.modeSidebarShown }')
  .toolbar-drawer
    q-btn-group(
      unelevated
      stretch
      v-for='pane of drawerPanes'
      :key='pane.key'
      )
      q-btn(
        :icon='pane.icon'
        :color='pane.key === editorStore.drawerPane ? `indigo-4` : `indigo-8`'
        :text-color='pane.key === editorStore.drawerPane ? `white` : `indigo-3`'
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
        :color='doc.id === docsStore.active ? `indigo-4` : `indigo-7`'
        :text-color='doc.id === docsStore.active ? `white` : `indigo-2`'
        no-caps
        unelevated
        @click='docsStore.switchToDocument(doc.id)'
        )
      q-btn(
        icon='mdi-close'
        :color='doc.id === docsStore.active ? `indigo-4` : `indigo-7`'
        :text-color='doc.id === docsStore.active ? `indigo-2` : `indigo-3`'
        size='xs'
        unelevated
        @click='closeDocument(doc)'
        )
  q-space
  q-btn(
    flat
    icon='mdi-cog'
    color='indigo-3'
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

import { useDocsStore } from 'src/stores/docs'
import { useEditorStore } from 'src/stores/editor'

import AccountMenu from './AccountMenu.vue'

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
  },
  {
    key: 'DrawerSymbols',
    icon: 'mdi-alpha-s-box',
    label: 'Document Symbols'
  },
  {
    key: 'DrawerChecks',
    icon: 'mdi-marker-check',
    label: 'Validation Checks'
  },
  {
    key: 'DrawerTools',
    icon: 'mdi-tools',
    label: 'Tools'
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

function openPreferences () {
  $q.dialog({
    component: defineAsyncComponent(() => import('components/PreferencesDialog.vue'))
  })
}

</script>

<style lang="scss">
@use "sass:color";

.toolbar-review {
  height: 40px;
  background: radial-gradient(ellipse at bottom, $indigo-5, color.adjust($indigo-7, $lightness: -5%));
  border-bottom: 1px solid $indigo-3;
  border-left: 1px solid $indigo-3;

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
