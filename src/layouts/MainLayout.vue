<template lang="pug">
q-layout(view='hHh lpr fFf')
  q-header
    main-toolbar
  drawer-pane
  footer-toolbar
  q-page-container
    router-view
</template>

<script setup>
import DrawerPane from 'src/components/DrawerPane.vue'
import MainToolbar from 'components/MainToolbar.vue'
import FooterToolbar from 'components/FooterToolbar.vue'
</script>
