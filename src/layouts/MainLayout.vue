<template lang="pug">
q-layout(view='hHh lpr fFf')
  q-header(elevated='')
    q-bar.bg-light-blue-10.q-electron-drag
      q-icon(name='img:https://static.ietf.org/logos/ietf-inverted.svg' size='xl')
      q-toolbar-title: span.text-body2: strong IETF Editor
      span.text-caption.text-light-blue-2 Prototype
      q-space
      q-btn(dense flat icon='mdi-minus' @click='minimize' padding='xs sm')
      q-btn(dense flat icon='mdi-checkbox-blank-outline' @click='toggleMaximize' padding='xs sm')
      q-btn(dense flat icon='mdi-window-close' @click='closeApp' padding='xs sm')
    q-bar.bg-light-blue-9
      q-btn(padding="xs sm" flat no-caps)
        span.text-body2 File
      q-btn(padding="xs sm" flat no-caps)
        span.text-body2 Edit
      q-btn(padding="xs sm" flat no-caps)
        span.text-body2 Selection
      q-btn(padding="xs sm" flat no-caps)
        span.text-body2 View
      q-btn(padding="xs sm" flat no-caps)
        span.text-body2 Preferences
      q-btn(padding="xs sm" flat no-caps)
        span.text-body2 Help
  q-drawer.bg-grey-9.text-white(v-model='leftDrawerOpen' show-if-above bordered mini persistent)
    q-list
      q-item-label(header) Essential Links
      essential-link(v-for='link in essentialLinks' :key='link.title' v-bind='link')
  q-footer
    q-bar.bg-light-blue-10
      span.text-caption.text-light-blue-2 Markdown
  q-page-container
    router-view
</template>

<script>
import { defineComponent, ref } from 'vue'
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

export default defineComponent({
  name: 'MainLayout',

  components: {
    EssentialLink
  },

  setup () {
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

    return {
      essentialLinks: linksList,
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },
      minimize,
      toggleMaximize,
      closeApp
    }
  }
})
</script>
