<template lang="pug">
q-layout(view='hHh lpr fFf')
  q-header(elevated='')
    q-bar.bg-dark-4.q-electron-drag
      q-icon(name='img:https://static.ietf.org/logos/ietf-inverted.svg' size='xl')
      q-toolbar-title: span.text-body2: strong DraftForge
      q-icon.q-mr-sm(name='mdi-circle' size='.5em' color='positive')
      span.text-caption.text-light-blue-2 Connected
      q-space
      template(v-if='isElectron')
        q-btn(dense flat icon='mdi-minus' @click='minimize' padding='xs sm')
        q-btn(dense flat icon='mdi-checkbox-blank-outline' @click='toggleMaximize' padding='xs sm')
        q-btn(dense flat icon='mdi-window-close' @click='closeApp' padding='xs sm')
    main-toolbar
  //- q-drawer.bg-dark-4.text-white(v-model='leftDrawerOpen' show-if-above mini persistent)
  //-   q-list
  //-     q-item-label(header) Essential Links
  //-     essential-link(v-for='link in linksList' :key='link.title' v-bind='link')
  footer-toolbar
  q-page-container
    router-view
</template>

<script setup>
// import { ref } from 'vue'
import MainToolbar from 'components/MainToolbar.vue'
import FooterToolbar from 'components/FooterToolbar.vue'
// import EssentialLink from 'components/EssentialLink.vue'

/* eslint-disable space-before-function-paren */

// const linksList = [
//   {
//     title: 'Test',
//     caption: 'testing',
//     icon: 'mdi-file-document-edit-outline',
//     link: 'https://ietf.org'
//   },
//   {
//     title: 'Test',
//     caption: 'testing',
//     icon: 'mdi-magnify',
//     link: 'https://ietf.org'
//   },
//   {
//     title: 'Test',
//     caption: 'testing',
//     icon: 'mdi-source-branch',
//     link: 'https://ietf.org'
//   },
//   {
//     title: 'Test',
//     caption: 'testing',
//     icon: 'mdi-wan',
//     link: 'https://ietf.org'
//   },
//   {
//     title: 'Test',
//     caption: 'testing',
//     icon: 'mdi-account-multiple',
//     link: 'https://ietf.org'
//   },
//   {
//     title: 'Test',
//     caption: 'testing',
//     icon: 'mdi-comment-check-outline',
//     link: 'https://ietf.org'
//   }
// ]

// const leftDrawerOpen = ref(false)

function minimize() {
  window.myWindowAPI?.minimize()
}

function toggleMaximize() {
  window.myWindowAPI?.toggleMaximize()
}

function closeApp() {
  window.myWindowAPI?.close()
}

const isElectron = process.env.MODE === 'electron'
</script>
