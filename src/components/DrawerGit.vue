<template lang="pug">
.q-pa-md
  .flex.items-center
    .text-caption.text-light-blue-3
      strong Git
    template(v-if='editorStore.isGitRepo')
      q-icon.q-ml-sm(name='mdi-information-outline' color='light-blue-3')
        q-tooltip
          span {{ editorStore.workingDirectory }}
          .text-caption Test
      q-space
      q-btn(
        flat
        size='sm'
        icon='mdi-sync'
        padding='xs xs'
        text-color='light-blue-3'
        :loading='state.fetchLoading'
        @click='performFetch'
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
    .drawer-git-remote.q-mt-sm
      q-icon.q-mr-sm(name='mdi-satellite-uplink')
      span.text-grey-4 Remote: #[strong.text-white {{ editorStore.gitCurrentRemote }}]
      q-space
      q-btn(
        flat
        size='sm'
        icon='mdi-menu'
        padding='xs xs'
        text-color='grey-5'
        @click='manageRemotes'
        )
        q-tooltip Manage Remotes
    .drawer-git-branch.q-mt-sm
      q-icon.q-mr-sm(name='mdi-source-branch')
      span.text-grey-4 Branch: #[strong.text-white {{ editorStore.gitCurrentBranch }}]
      q-space
      q-btn(
        flat
        size='sm'
        icon='mdi-swap-horizontal'
        padding='xs xs'
        text-color='grey-5'
        @click='manageBranches'
        )
        q-tooltip Manage / Checkout Branch...
    .drawer-git-staged.q-mt-sm(v-if='state.staged.length > 0')
      .flex.items-center.text-caption.q-px-sm
        q-icon.q-mr-sm(name='mdi-playlist-check')
        span.text-grey-4 Staged
        q-space
        q-btn(
          flat
          size='sm'
          icon='mdi-minus'
          padding='xs xs'
          text-color='grey-5'
          @click='unstageAllFiles'
          )
          q-tooltip Unstage All Changes
      .q-pa-sm
        q-input(
          placeholder='Commit Message'
          standout
          dense
          color='light-blue-3'
          v-model='state.commitMsg'
          @keyup.ctrl.enter='commit'
          autogrow
          autofocus
        )
        q-btn.full-width.q-mt-xs(
          color='primary'
          no-caps
          size='sm'
          unelevated
          @click='commit'
          )
          q-icon.q-mr-sm(name='mdi-check')
          span.text-caption Commit
          q-tooltip You can also commit using Ctrl + Enter
      q-list(
        dense
        )
        q-item(
          v-for='cg of state.staged'
          :key='cg.path'
          clickable
          style='padding-right: 8px'
          )
          q-item-section(side)
            q-icon(v-if='cg.isAdded', name='mdi-plus-box-outline', size='xs', color='positive')
            q-icon(v-else-if='cg.isModified', name='mdi-pencil-box-outline', size='xs', color='amber')
            q-icon(v-else-if='cg.isDeleted', name='mdi-minus-box-outline', size='xs', color='red-5')
          q-item-section
            q-item-label.text-caption.text-word-break-all {{ cg.path }}
          q-item-section.drawer-git-changes-hover(side)
            .flex.items-center
              q-btn(
                flat
                size='sm'
                icon='mdi-minus'
                padding='xs xs'
                text-color='grey-5'
                @click.stop.prevent='unstageFile(cg)'
                )
                q-tooltip Unstage Changes
    .drawer-git-changes.q-mt-sm
      .flex.items-center.text-caption.q-px-sm
        q-icon.q-mr-sm(name='mdi-list-status')
        span.text-grey-4 Changes
        q-space
        q-btn(
          v-if='state.changes.length > 0'
          flat
          size='sm'
          icon='mdi-arrow-u-left-top'
          padding='xs xs'
          text-color='grey-5'
          )
          q-tooltip Discard All Changes
        q-btn(
          v-if='state.changes.length > 0'
          flat
          size='sm'
          icon='mdi-plus'
          padding='xs xs'
          text-color='grey-5'
          @click='stageAllFiles'
          )
          q-tooltip Stage All Changes
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
          style='padding-right: 8px'
          )
          q-item-section(side)
            q-icon(v-if='cg.isAdded', name='mdi-plus-box-outline', size='xs', color='positive')
            q-icon(v-else-if='cg.isModified', name='mdi-pencil-box-outline', size='xs', color='amber')
            q-icon(v-else-if='cg.isDeleted', name='mdi-minus-box-outline', size='xs', color='red-5')
          q-item-section
            q-item-label.text-caption.text-word-break-all {{ cg.path }}
          q-item-section.drawer-git-changes-hover(side)
            .flex.items-center
              q-btn(
                flat
                size='sm'
                icon='mdi-arrow-u-left-top'
                padding='xs xs'
                text-color='grey-5'
                )
                q-tooltip Discard Changes
              q-btn(
                flat
                size='sm'
                icon='mdi-plus'
                padding='xs xs'
                text-color='grey-5'
                @click.stop.prevent='stageFile(cg)'
                )
                q-tooltip Stage Changes
    .drawer-git-history.q-mt-sm
      .flex.items-center.text-caption.q-px-sm
        q-icon.q-mr-sm(name='mdi-list-box-outline')
        span.text-grey-4 History
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
        q-item.items-start(
          v-for='cm of state.history'
          :key='cm.oid'
          clickable
          )
          q-item-section(side)
            q-avatar(
              color='primary'
              size='xs'
              square
              style='box-shadow: 1px 1px 0 0 rgba(0,0,0,.5);'
              )
              img(:src='avatarUrl(cm.commit.author.emailHash)')
            q-tooltip #[strong {{ cm.commit.author.name }}] #[br] &lt;{{ cm.commit.author.email }}&gt;
          q-item-section
            q-item-label.ellipsis-3-lines.text-word-break-all {{ cm.commit.message }}
            q-item-label(caption): em {{ humanizeDate(cm.commit.author.timestamp) }}
            q-item-label.text-blue-2(caption) {{ cm.commit.author.name }}
      .text-center.text-caption.q-mt-sm(v-if='state.history.length > 499')
        em.text-grey-5 History limited to 500 most recent commits.
</template>

<script setup>
import { defineAsyncComponent, onActivated, reactive } from 'vue'
import { useQuasar } from 'quasar'
import { useEditorStore } from 'src/stores/editor'
import { DateTime } from 'luxon'
import { cloneDeep } from 'lodash-es'

const $q = useQuasar()

const editorStore = useEditorStore()

// STATE

const state = reactive({
  fetchLoading: false,
  changesLoading: false,
  historyLoading: false,
  commitMsg: '',
  staged: [],
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

async function performFetch () {
  state.fetchLoading = true
  try {
    await window.ipcBridge.gitPerformFetch(editorStore.workingDirectory, editorStore.gitCurrentRemote)
    await editorStore.fetchRemotes()
    editorStore.fetchBranches()
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

function manageRemotes () {
  $q.dialog({
    component: defineAsyncComponent(() => import('components/ManageRemotesDialog.vue'))
  })
}

function manageBranches () {
  $q.dialog({
    component: defineAsyncComponent(() => import('components/ManageBranchesDialog.vue'))
  })
}

async function refreshChanges () {
  state.changesLoading = true
  try {
    const changes = await window.ipcBridge.gitStatusMatrix(editorStore.workingDirectory)
    state.changes = changes.filter(c => c.isUnstaged)
    state.staged = changes.filter(c => c.isStaged)
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

async function stageFile (fl) {
  if (state.changesLoading) { return }
  state.changesLoading = true
  try {
    await window.ipcBridge.gitStageFiles(editorStore.workingDirectory, [cloneDeep(fl)])
    await refreshChanges()
  } catch (err) {
    console.error(err)
    $q.notify({
      message: `Failed to stage file ${fl.path}`,
      caption: err.message,
      color: 'negative',
      icon: 'mdi-alert'
    })
  }
  state.changesLoading = false
}

async function stageAllFiles () {
  if (state.changesLoading) { return }
  state.changesLoading = true
  try {
    await window.ipcBridge.gitStageFiles(editorStore.workingDirectory, cloneDeep(state.changes))
    await refreshChanges()
  } catch (err) {
    console.error(err)
    $q.notify({
      message: 'Failed to stage all files',
      caption: err.message,
      color: 'negative',
      icon: 'mdi-alert'
    })
  }
  state.changesLoading = false
}

async function unstageFile (fl) {
  if (state.changesLoading) { return }
  state.changesLoading = true
  try {
    await window.ipcBridge.gitUnstageFiles(editorStore.workingDirectory, [cloneDeep(fl)])
    await refreshChanges()
  } catch (err) {
    console.error(err)
    $q.notify({
      message: `Failed to unstage file ${fl.path}`,
      caption: err.message,
      color: 'negative',
      icon: 'mdi-alert'
    })
  }
  state.changesLoading = false
}

async function unstageAllFiles () {
  if (state.changesLoading) { return }
  state.changesLoading = true
  try {
    await window.ipcBridge.gitUnstageFiles(editorStore.workingDirectory, cloneDeep(state.staged))
    await refreshChanges()
  } catch (err) {
    console.error(err)
    $q.notify({
      message: 'Failed to unstage all files',
      caption: err.message,
      color: 'negative',
      icon: 'mdi-alert'
    })
  }
  state.changesLoading = false
}

async function commit () {
  if (state.commitMsg.length < 1) {
    $q.notify({
      message: 'Commit message missing!',
      caption: 'A commit message is required.',
      color: 'negative',
      icon: 'mdi-alert'
    })
    return
  }
  if (state.changesLoading) { return }
  state.changesLoading = true
  try {
    await window.ipcBridge.gitCommit(editorStore.workingDirectory, state.commitMsg)
    state.commitMsg = ''
    await refreshChanges()
    await refreshHistory()
  } catch (err) {
    console.error(err)
    $q.notify({
      message: 'Failed to commit staged changes',
      caption: err.message,
      color: 'negative',
      icon: 'mdi-alert'
    })
  }
  state.changesLoading = false
}

// MOUNTED

onActivated(async () => {
  if (editorStore.isGitRepo) {
    await performFetch()
    await editorStore.fetchRemotes()
    refreshChanges()
    refreshHistory()
  }
})

</script>

<style lang="scss">
.drawer-git {
  &-remote, &-branch {
    display: flex;
    align-items: center;
    font-size: 12px;
    background-color: rgba(255,255,255,.1);
    border-radius: 4px;
    padding: 5px 8px;
  }
  &-changes, &-staged {
    background-color: rgba(255,255,255,.1);
    border-radius: 4px;
    padding: 5px 0;

    .q-item .drawer-git-changes-hover {
      display: none;
    }

    .q-item:hover .drawer-git-changes-hover {
      display: block;
    }
  }
  &-history {
    background-color: rgba(255,255,255,.1);
    border-radius: 4px;
    padding: 5px 0;
  }
}
</style>
