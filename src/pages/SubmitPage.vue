<template lang="pug">
q-layout(view='hHh lpr fFf' container style="height: 100vh")
  q-header
    submit-toolbar
  q-page-container
    q-page.submit.bg-dark-5
      .submit-container.q-pa-lg
        .submit-text.q-mt-lg
          .text-body1: strong Submit
          .text-caption.text-blue-grey-3 Select an Internet-Draft to submit...
        q-list.q-mt-md.rounded-borders(
          v-if='docsStore.opened.length > 0'
          separator
          bordered
          )
          q-item(
            v-for='doc of docsStore.opened'
            :key='doc.id'
            clickable
            )
            q-item-section(side)
              q-icon(name='mdi-file-move-outline')
            q-item-section
              q-item-label {{ doc.fileName }}
              q-item-label.text-blue-grey-4(caption) {{ doc.path }}
            q-item-section(side)
              q-icon(name='mdi-chevron-right', color='blue-grey-7')

        q-list.q-mt-md.rounded-borders(
          separator
          bordered
          )
          q-item(clickable)
            q-item-section(side)
              q-icon(name='mdi-folder-open')
            q-item-section
              q-item-label Open...
            q-item-section(side)
              q-icon(name='mdi-chevron-right', color='blue-grey-7')
</template>

<script setup>
// import { useRouter } from 'vue-router'
import { useDocsStore } from 'src/stores/docs'
import SubmitToolbar from 'src/components/SubmitToolbar.vue'

// STORES

const docsStore = useDocsStore()

// ROUTER

// const router = useRouter()

// WATCH

// METHODS

// MOUNTED

</script>

<style lang="scss">
.submit {
  background: linear-gradient(45deg, darken($dark-4, 2%), $dark-6);
  border-left: 1px solid lighten($dark-1, 10%);

  &-container {
    max-width: 650px;
    margin: 0 auto;
    padding-top: calc(50vh - 350px);
  }
}
</style>
