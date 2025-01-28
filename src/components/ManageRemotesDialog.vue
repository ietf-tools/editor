<template lang="pug">
q-dialog(
  ref='dialogRef'
  @hide='onDialogHide'
  :transition-show='editorStore.animationEffects ? `jump-up` : `none`'
  :transition-hide='editorStore.animationEffects ? `jump-down` : `none`'
  )
  q-card.mica.remotes
    q-card-section.flex.items-center.bg-light-blue-10
      q-icon(name='mdi-satellite-uplink', left, size='sm')
      span Manage Remotes
      q-space
      q-circular-progress.q-mr-md(
        color='light-blue-3'
        indeterminate
        size='18px'
        v-if='state.isLoading'
      )
      q-btn.q-mr-md(
        unelevated
        icon='mdi-plus'
        label='New Remote'
        color='primary'
        padding='xs md'
        no-caps
        @click='state.newRemoteFormShown = true'
        :disabled='state.isLoading || state.newRemoteFormShown'
        )
      q-btn.q-mr-md(
        unelevated
        icon='mdi-refresh'
        padding='xs'
        color='primary'
        @click='refresh'
        :disabled='state.isLoading'
        )
        q-tooltip Refresh Remotes
      q-btn(
        unelevated
        icon='mdi-close'
        color='primary'
        padding='xs'
        @click='onDialogCancel'
        )
    .card-border
      .remotes-new(v-if='state.newRemoteFormShown')
        q-form.q-gutter-md.q-pa-lg
          .row
            .col-5
              .text-body2 Name
              .text-caption.text-grey-5 The name of the new remote
            .col-7
              q-input(
                autofocus
                v-model.number='state.newRemoteName'
                placeholder='e.g. upstream or origin'
                outlined
                dense
                clearable
                color='light-blue-4'
                tabindex='1'
              )
          .row
            .col-5
              .text-body2 Repository URL
              .text-caption.text-grey-5 The SSH or HTTPS URL of the repository
            .col-7
              q-input(
                v-model.number='state.newRemoteUrl'
                placeholder='e.g. git@github.com/rfc-editor/draft-abc-def-ghi.git'
                outlined
                dense
                clearable
                color='light-blue-4'
                tabindex='2'
              )
          .row
            .col-12.text-right
              q-btn.q-mr-md(
                outline
                label='Cancel'
                color='grey-5'
                padding='xs md'
                @click='state.newRemoteFormShown = false'
                tabindex='4'
                )
              q-btn(
                unelevated
                label='Add Remote'
                color='primary'
                padding='xs md'
                @click='newRemote'
                tabindex='3'
                :loading='state.isLoading'
                )
      .remotes-main
        .q-pa-md.q-pt-lg.text-grey-6(v-if='!(editorStore.gitRemotes?.length > 0)'): em No remote configured yet.
        q-list(
          padding
          separator
        )
          q-item(
            v-for='remote of editorStore.gitRemotes'
            :key='remote.name'
            )
            q-item-section(side)
              q-chip(
                square
                :color='editorStore.gitCurrentRemote === remote.name ? `light-green-8` : `primary`'
                text-color='white'
                :label='remote.name'
              )
            q-item-section
              q-item-label {{ remote.refs.push }}
              //- q-item-label(caption) {{ remote.refs.push }}
              q-item-label.text-light-green-4(v-if='editorStore.gitCurrentRemote === remote.name', caption): em Active Push Target
            q-item-section(
              v-if='editorStore.gitCurrentRemote !== remote.name'
              side
              )
                q-btn(
                  outline
                  color='red-5'
                  padding='xs sm'
                  label='Remove'
                  no-caps
                  @click='deleteRemote(remote.name)'
                )
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { useEditorStore } from 'src/stores/editor'

const editorStore = useEditorStore()

const $q = useQuasar()

// EMITS

defineEmits([
  ...useDialogPluginComponent.emits
])

// QUASAR

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

// STATE

const state = reactive({
  isLoading: true,
  newRemoteFormShown: false,
  newRemoteName: '',
  newRemoteUrl: ''
})

// METHODS

async function newRemote () {
  state.isLoading = true
  try {
    if (!state.newRemoteName) {
      throw new Error('Missing Name')
    }
    if (!state.newRemoteUrl) {
      throw new Error('Missing URL')
    }
    if (editorStore.gitRemotes.some(r => r.remote === state.newRemoteName)) {
      throw new Error('Remote already exists')
    }
    await window.ipcBridge.gitAddRemote(state.newRemoteName, state.newRemoteUrl)
    await editorStore.fetchRemotes()
    state.newRemoteName = ''
    state.newRemoteUrl = ''
    state.newRemoteFormShown = false
    $q.notify({
      message: 'Added remote successfully',
      color: 'positive',
      icon: 'mdi-check'
    })
  } catch (err) {
    console.error(err)
    $q.notify({
      message: 'Failed to add new remote',
      caption: err.message,
      color: 'negative',
      icon: 'mdi-alert'
    })
  }
  state.isLoading = false
}

async function deleteRemote (remote) {
  $q.dialog({
    title: 'Confirm',
    message: `Are you sure you want to delete remote ${remote}?`,
    persistent: true,
    focus: 'none',
    ok: {
      color: 'negative',
      textColor: 'white',
      unelevated: true,
      label: 'Delete',
      noCaps: true
    },
    cancel: {
      color: 'grey-3',
      outline: true,
      noCaps: true
    }
  }).onOk(async () => {
    state.isLoading = true
    try {
      await window.ipcBridge.gitDeleteRemote(remote)
      await editorStore.fetchRemotes()
    } catch (err) {
      console.error(err)
      $q.notify({
        message: 'Failed to delete remote',
        caption: err.message,
        color: 'negative',
        icon: 'mdi-alert'
      })
    }
    state.isLoading = false
  })
}

async function refresh () {
  state.isLoading = true
  try {
    await window.ipcBridge.gitPerformFetch()
    await editorStore.fetchRemotes()
    editorStore.fetchBranches()
  } catch (err) {
    console.error(err)
    $q.notify({
      message: 'Failed to fetch from remotes',
      caption: err.message,
      color: 'negative',
      icon: 'mdi-alert'
    })
  }
  state.isLoading = false
}

// MOUNTED

onMounted(async () => {
  state.isLoading = true
  await editorStore.fetchRemotes()
  state.isLoading = false
})

</script>

<style lang="scss">
.remotes {
  min-width: 1000px;
  display: flex;
  flex-direction: column;

  .card-border {
    min-height: 200px;
  }

  &-new {
    background-color: rgba(255,255,255,.05);
    border-bottom: 1px solid rgba(255,255,255,.1);
  }
}
</style>
