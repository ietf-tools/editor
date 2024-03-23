<template lang="pug">
q-drawer.bg-dark-4.drawer-pane(
  :model-value='state.drawerShown'
  show-if-above
  persistent
  :width='350'
  )
  q-scroll-area.fit(
    :horizontal-thumb-style='{ opacity: 0 }'
    )
    keep-alive
      component(:is='panes[editorStore.drawerPane]')
</template>

<script setup>
import { reactive } from 'vue'
import { useEditorStore } from 'src/stores/editor'

import DrawerFiles from 'src/components/DrawerFiles.vue'
import DrawerGit from 'src/components/DrawerGit.vue'
import DrawerSymbols from 'src/components/DrawerSymbols.vue'
import DrawerChecks from 'src/components/DrawerChecks.vue'
import DrawerTools from 'src/components/DrawerTools.vue'
import DrawerSnippets from 'src/components/DrawerSnippets.vue'

const editorStore = useEditorStore()

const panes = {
  DrawerFiles,
  DrawerGit,
  DrawerSymbols,
  DrawerChecks,
  DrawerTools,
  DrawerSnippets
}

const state = reactive({
  drawerShown: true
})
</script>

<style lang="scss">
.drawer-pane {
  border-left: 1px solid lighten($dark-1, 10%);
}
</style>
