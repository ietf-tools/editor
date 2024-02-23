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
        :loading='state.fetchLoading'
        @click='fetchRemote'
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
          :loading='state.changesLoading'
          @click='refreshChanges'
          )
          q-tooltip Refresh
      .text-center.text-caption.q-mt-sm(v-if='state.changes.length < 1')
        em.text-grey-5 No changes.
      q-list(
        v-else
        dense
        )
        q-item(
          v-for='cg of state.changes'
          :key='cg.path'
          clickable
          )
          q-item-section(side)
            q-icon(v-if='cg.isAdded', name='mdi-plus-box-outline', size='xs', color='positive')
            q-icon(v-else-if='cg.isModified', name='mdi-pencil-box-outline', size='xs', color='amber')
            q-icon(v-else-if='cg.isDeleted', name='mdi-minus-box-outline', size='xs', color='red-5')
          q-item-section
            q-item-label.text-caption.text-word-break-all {{ cg.path }}
    .drawer-git-history.q-mt-sm
      .flex.items-center.text-caption.text-grey-4
        q-icon.q-mr-sm(name='mdi-list-box-outline')
        strong History
        q-space
        q-btn(
          flat
          size='sm'
          icon='mdi-refresh'
          padding='xs xs'
          text-color='grey-5'
          :loading='state.historyLoading'
          @click='refreshHistory'
          )
          q-tooltip Refresh
      .text-center.text-caption.q-mt-sm(v-if='state.history.length < 1')
        em.text-grey-5 No commit yet.
      q-list(
        v-else
        separator
        padding
        )
        q-item(
          v-for='cm of state.history'
          :key='cm.oid'
          clickable
          )
          q-item-section(side)
            q-avatar(
              color='primary'
              size='xs'
              square
              style='box-shadow: 0 0 0 2px rgba(0,0,0,.5);'
              )
              img(:src='avatarUrl(cm.commit.author.emailHash)')
            q-tooltip #[strong {{ cm.commit.author.name }}] #[br] &lt;{{ cm.commit.author.email }}&gt;
          q-item-section
            q-item-label.ellipsis-3-lines.text-word-break-all {{ cm.commit.message }}
            q-item-label(caption): em {{ humanizeDate(cm.commit.author.timestamp) }}
            q-item-label.text-blue-2(caption) {{ cm.commit.author.name }}
</template>

<script setup>
import { defineAsyncComponent, onActivated, reactive } from 'vue'
import { useQuasar } from 'quasar'
import { useEditorStore } from 'src/stores/editor'
import { DateTime } from 'luxon'

const $q = useQuasar()

const editorStore = useEditorStore()

// STATE

const state = reactive({
  fetchLoading: false,
  changesLoading: false,
  historyLoading: false,
  changes: [],
  history: []
})

// METHODS

function humanizeDate (ts) {
  return DateTime.fromSeconds(ts, { zone: 'utc' }).toFormat('ff')
}

function avatarUrl (emailHash) {
  return `https://gravatar.com/avatar/${emailHash}?s=24&d=retro`
}

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

async function fetchRemote () {
  state.fetchLoading = true
  try {
    await window.ipcBridge.gitFetchOrigin(editorStore.workingDirectory)
  } catch (err) {
    console.error(err)
    $q.notify({
      message: 'Failed to fetch from remote',
      caption: err.message,
      color: 'negative',
      icon: 'mdi-alert'
    })
  }
  state.fetchLoading = false
}

async function refreshChanges () {
  state.changesLoading = true
  try {
    state.changes = await window.ipcBridge.gitStatusMatrix(editorStore.workingDirectory)
  } catch (err) {
    console.error(err)
    $q.notify({
      message: 'Failed to get current state of local repository',
      caption: err.message,
      color: 'negative',
      icon: 'mdi-alert'
    })
  }
  state.changesLoading = false
}

async function refreshHistory () {
  state.historyLoading = true
  try {
    state.history = await window.ipcBridge.gitCommitsLog(editorStore.workingDirectory)
  } catch (err) {
    console.error(err)
    $q.notify({
      message: 'Failed to fetch commits history',
      caption: err.message,
      color: 'negative',
      icon: 'mdi-alert'
    })
  }
  state.historyLoading = false
}

// MOUNTED

onActivated(async () => {
  if (editorStore.isGitRepo) {
    await fetchRemote()
    refreshChanges()
    refreshHistory()
  }
})

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
