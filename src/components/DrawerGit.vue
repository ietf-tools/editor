<template lang="pug">
.q-pa-md
  .flex.items-center
    .text-caption.text-light-blue-3
      strong Git
    q-space
    template(v-if='editorStore.isGitRepo')
      q-btn(
        flat
        size='sm'
        icon='mdi-sync'
        padding='xs xs'
        text-color='light-blue-3'
        )
        q-tooltip Fetch
      q-btn(
        flat
        size='sm'
        icon='mdi-content-duplicate'
        padding='xs xs'
        text-color='light-blue-3'
        @click='cloneRepo'
        )
        q-tooltip Clone Repository...
      q-btn(
        flat
        size='sm'
        icon='mdi-archive-plus-outline'
        padding='xs xs'
        text-color='light-blue-3'
        )
        q-tooltip Initialize New...
    q-btn(
      flat
      size='sm'
      icon='mdi-cog-outline'
      padding='xs xs'
      text-color='light-blue-3'
      @click='gitSettings'
      )
      q-tooltip Git Settings
  template(v-if='!editorStore.isGitRepo')
    q-btn.full-width.q-mt-sm(
      icon='mdi-cloud-download'
      label='Clone Repository...'
      color='primary'
      no-caps
      unelevated
      @click='cloneRepo'
    )
    q-btn.full-width.q-mt-sm(
      icon='mdi-git'
      label='Initialize New...'
      color='primary'
      no-caps
      unelevated
    )
  template(v-else)
    .drawer-git-branch.q-mt-sm
      q-icon.q-mr-sm(name='mdi-source-branch')
      span Branch: #[strong main]
      q-space
      q-btn(
        flat
        size='sm'
        icon='mdi-swap-horizontal'
        padding='xs xs'
        text-color='grey-5'
        )
        q-tooltip Checkout Branch...
    .drawer-git-changes.q-mt-sm
      .flex.items-center.text-caption.text-grey-4
        q-icon.q-mr-sm(name='mdi-list-status')
        strong Changes
        q-space
        q-btn(
          flat
          size='sm'
          icon='mdi-refresh'
          padding='xs xs'
          text-color='grey-5'
          )
          q-tooltip Refresh
      .text-center.text-caption.q-mt-sm
        em.text-grey-5 No changes.
    .drawer-git-history.q-mt-sm
      .flex.items-center.text-caption.text-grey-4
        q-icon.q-mr-sm(name='mdi-list-box-outline')
        strong History
      .text-center.text-caption.q-mt-sm
        em.text-grey-5 No commit yet.
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import { useQuasar } from 'quasar'
import { useEditorStore } from 'src/stores/editor'

const $q = useQuasar()

const editorStore = useEditorStore()

// METHODS

function gitSettings () {
  $q.dialog({
    component: defineAsyncComponent(() => import('components/PreferencesDialog.vue')),
    componentProps: {
      tab: 'git'
    }
  })
}

function cloneRepo () {
  $q.dialog({
    component: defineAsyncComponent(() => import('components/CloneRepositoryDialog.vue'))
  })
}

</script>

<style lang="scss">
.drawer-git {
  &-branch {
    display: flex;
    align-items: center;
    font-size: 12px;
    background-color: rgba(255,255,255,.1);
    border-radius: 4px;
    padding: 5px 8px;
  }
  &-changes {
    background-color: rgba(255,255,255,.1);
    border-radius: 4px;
    padding: 5px 8px;
  }
  &-history {
    background-color: rgba(255,255,255,.1);
    border-radius: 4px;
    padding: 5px 8px;
  }
}
</style>
