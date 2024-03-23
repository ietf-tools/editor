<template lang="pug">
q-layout(view='hHh lpr fFf' container style="height: 100vh")
  q-header
    basic-toolbar(v-if='route.name === `welcome`')
    review-toolbar(v-else-if='route.query.mode === `review`')
    editor-toolbar(v-else)
  drawer-pane
  footer-toolbar
  q-page-container
    router-view
</template>

<script setup>
import { useRoute } from 'vue-router'

import DrawerPane from 'src/components/DrawerPane.vue'
import BasicToolbar from 'src/components/BasicToolbar.vue'
import EditorToolbar from 'src/components/EditorToolbar.vue'
import FooterToolbar from 'src/components/FooterToolbar.vue'
import ReviewToolbar from 'src/components/ReviewToolbar.vue'

const route = useRoute()
</script>
