<template lang="pug">
.app-layout
  app-mode-sidebar
  .app-main
    q-layout(view='hHh lpr fFf' container style="height: 100vh")
      q-header
        main-toolbar
      drawer-pane
      footer-toolbar
      q-page-container
        router-view
</template>

<script setup>
import AppModeSidebar from 'components/AppModeSidebar.vue'
import DrawerPane from 'components/DrawerPane.vue'
import MainToolbar from 'components/MainToolbar.vue'
import FooterToolbar from 'components/FooterToolbar.vue'
</script>

<style lang="scss">
.app-layout {
  display: flex;
}
.app-main {
  display: block;
  flex: 1;
  position: relative;
}
</style>
