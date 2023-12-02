<template lang="pug">
q-layout(view='hHh lpr fFf')
  q-header(elevated='')
    q-bar.bg-light-blue-10.q-electron-drag
      q-icon(name='img:https://static.ietf.org/logos/ietf-inverted.svg' size='xl')
      q-toolbar-title: span.text-body2: strong DraftForge
      q-icon.q-mr-sm(name='mdi-circle' size='.5em' color='positive')
      span.text-caption.text-light-blue-2 Connected
      q-space
      q-btn(dense flat icon='mdi-minus' @click='minimize' padding='xs sm')
      q-btn(dense flat icon='mdi-checkbox-blank-outline' @click='toggleMaximize' padding='xs sm')
      q-btn(dense flat icon='mdi-window-close' @click='closeApp' padding='xs sm')
    main-toolbar
  q-drawer.bg-grey-9.text-white(v-model='leftDrawerOpen' show-if-above bordered mini persistent)
    q-list
      q-item-label(header) Essential Links
      essential-link(v-for='link in linksList' :key='link.title' v-bind='link')
  q-footer
    q-bar.bg-light-blue-10
      span.text-caption.text-light-blue-2 RFC XML v3
  q-page-container
    router-view
</template>

<script setup>
import { ref } from 'vue'
import MainToolbar from 'components/MainToolbar.vue'
import EssentialLink from 'components/EssentialLink.vue'

const linksList = [
  {
    title: 'Test',
    caption: 'testing',
    icon: 'mdi-file-document-edit-outline',
    link: 'https://ietf.org'
  },
  {
    title: 'Test',
    caption: 'testing',
    icon: 'mdi-magnify',
    link: 'https://ietf.org'
  },
  {
    title: 'Test',
    caption: 'testing',
    icon: 'mdi-source-branch',
    link: 'https://ietf.org'
  },
  {
    title: 'Test',
    caption: 'testing',
    icon: 'mdi-wan',
    link: 'https://ietf.org'
  },
  {
    title: 'Test',
    caption: 'testing',
    icon: 'mdi-account-multiple',
    link: 'https://ietf.org'
  },
  {
    title: 'Test',
    caption: 'testing',
    icon: 'mdi-comment-check-outline',
    link: 'https://ietf.org'
  }
]

const leftDrawerOpen = ref(false)

function minimize () {
  window.myWindowAPI?.minimize()
}

function toggleMaximize () {
  window.myWindowAPI?.toggleMaximize()
}

function closeApp () {
  window.myWindowAPI?.close()
}
</script>
