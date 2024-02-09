<template lang="pug">
q-layout(view='hHh lpr fFf')
  q-header
    main-toolbar
  //- q-drawer.bg-dark-4(
  //-   :model-value='true'
  //-   show-if-above
  //-   :mini='state.miniState'
  //-   @mouseover='state.miniState = false'
  //-   @mouseout='state.miniState = true'
  //-   mini-to-overlay
  //-   persistent
  //-   )
  //-   q-scroll-area.fit(
  //-     :horizontal-thumb-style='{ opacity: 0 }'
  //-     )
  //-     q-list(padding)
  //-       q-item(clickable)
  //-         q-item-section(side)
  //-           q-icon(name='mdi-library-shelves' size='xs' color='light-blue-4')
  //-         q-item-section
  //-           q-item-label Library
  //-           q-item-label.text-light-blue-3(caption) Quick Insert Code Snippets
  //-       q-separator(inset)
  //-       q-item(clickable)
  //-         q-item-section(side)
  //-           q-icon(name='mdi-page-previous-outline' size='xs' color='light-blue-4')
  //-         q-item-section
  //-           q-item-label Reindent
  //-           q-item-label.text-light-blue-3(caption) Reformat Document Indentation
  footer-toolbar
  q-page-container
    router-view
</template>

<script setup>
// import { reactive } from 'vue'
import MainToolbar from 'components/MainToolbar.vue'
import FooterToolbar from 'components/FooterToolbar.vue'

/* eslint-disable space-before-function-paren */

// const state = reactive({
//   miniState: true
// })
</script>
