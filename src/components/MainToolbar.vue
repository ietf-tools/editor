<template lang="pug">
q-bar.toolbar-main(:class='{ "has-mode-sd": editorStore.modeSidebarShown }')
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
  q-btn(
    flat
    icon='mdi-collage'
    color='light-blue-3'
    @click='editorStore.modeSidebarShown = !editorStore.modeSidebarShown'
    padding='xs sm'
    )
    q-tooltip Toggle Mode Sidebar
  q-btn(
    flat
    icon='mdi-cog'
    color='light-blue-3'
    @click='openPreferences'
    padding='xs sm'
    )
    q-tooltip Preferences
  q-separator.q-mx-sm(inset vertical)
  q-btn(v-if='userStore.isLoggedIn' padding="xs sm" flat no-caps)
    span.text-body2 {{ userStore.profile.name }}
    q-avatar.q-ml-sm(size='sm' rounded)
      img(:src='userStore.profile.picture')
    q-menu(auto-close)
      q-list.bg-light-blue-9(separator, style='min-width: 180px')
        q-item.bg-dark-1
          q-item-section.text-center
            .text-caption.text-blue-grey-3 Datatracker Account
            .text-caption.text-blue-grey-2: strong {{ userStore.profile.email }}
        q-item(clickable, @click='openPrefProfile')
          q-item-section(side)
            q-icon(name='mdi-account-cog')
          q-item-section Profile
        q-item(clickable, @click='logout')
          q-item-section(side)
            q-icon(name='mdi-logout')
          q-item-section Logout
  q-btn(v-else padding="xs sm" flat no-caps @click='login')
    span.text-body2 Login
    q-icon.q-ml-sm(name='mdi-account-circle')
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import { useQuasar } from 'quasar'

import { useDocsStore } from 'src/stores/docs'
import { useEditorStore } from 'src/stores/editor'
import { useUserStore } from 'src/stores/user'

const docsStore = useDocsStore()
const editorStore = useEditorStore()
const userStore = useUserStore()

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
    label: 'Document Symbols',
    needDocument: true
  },
  {
    key: 'DrawerChecks',
    icon: 'mdi-marker-check',
    label: 'Validation Checks',
    needDocument: true
  },
  {
    key: 'DrawerTools',
    icon: 'mdi-tools',
    label: 'Tools',
    needDocument: true
  },
  {
    key: 'DrawerSnippets',
    icon: 'mdi-library-shelves',
    label: 'Snippets',
    needDocument: true
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

function openPreferences () {
  $q.dialog({
    component: defineAsyncComponent(() => import('components/PreferencesDialog.vue'))
  })
}

function openPrefProfile () {
  $q.dialog({
    component: defineAsyncComponent(() => import('components/PreferencesDialog.vue')),
    componentProps: {
      tab: 'profile'
    }
  })
}

function login () {
  window.ipcBridge.emit('login')
}
function logout () {
  window.ipcBridge.emit('logout')
}

</script>

<style lang="scss">
.toolbar-main {
  height: 40px;
  background: radial-gradient(ellipse at bottom, $light-blue-9, darken($light-blue-10, 5%));
  border-bottom: 1px solid $light-blue-5;

  &.has-mode-sd {
    border-left: 1px solid $light-blue-5;
  }
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
