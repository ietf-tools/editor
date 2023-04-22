<template>
  <q-layout view="hHh lpr fFf">
    <q-header>
      <q-toolbar class="q-electron-drag">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
        />

        <q-toolbar-title>
          IETF Editor
        </q-toolbar-title>

        <div>Prototype</div>

        <q-space />

        <q-btn dense flat icon="minimize" @click="minimize" />
        <q-btn dense flat icon="crop_square" @click="toggleMaximize" />
        <q-btn dense flat icon="close" @click="closeApp" />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      mini
      persistent
      class="bg-grey-9 text-white"
    >
      <q-list>
        <q-item-label
          header
        >
          Essential Links
        </q-item-label>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'

const linksList = [
  {
    title: 'Test',
    caption: 'testing',
    icon: 'school',
    link: 'https://ietf.org'
  },
  {
    title: 'Test',
    caption: 'testing',
    icon: 'code',
    link: 'https://ietf.org'
  },
  {
    title: 'Test',
    caption: 'testing',
    icon: 'chat',
    link: 'https://ietf.org'
  },
  {
    title: 'Test',
    caption: 'testing',
    icon: 'record_voice_over',
    link: 'https://ietf.org'
  },
  {
    title: 'Test',
    caption: 'testing',
    icon: 'rss_feed',
    link: 'https://ietf.org'
  },
  {
    title: 'Test',
    caption: 'testing',
    icon: 'public',
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
