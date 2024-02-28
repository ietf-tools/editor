<template lang="pug">
q-dialog(ref='dialogRef' @hide='onDialogHide' transition-show='jump-up' transition-hide='jump-down')
  q-card.mica.branches
    q-card-section.flex.items-center.bg-light-blue-10
      q-icon(name='mdi-source-branch', left, size='sm')
      div
        span Manage Branches
        .text-caption.text-light-blue-2 Current: #[strong {{ editorStore.gitCurrentBranch }}]
      q-space
      q-circular-progress.q-mr-md(
        color='light-blue-3'
        indeterminate
        size='18px'
        v-if='state.isLoading'
      )
      q-btn(
        unelevated
        icon='mdi-close'
        color='primary'
        padding='xs'
        @click='onDialogCancel'
        )
    .branches-main.card-border.row
      .col-6
        .bg-grey-10.text-body2.q-pa-md Local Branches
        q-separator
        q-list(
          padding
          separator
        )
          q-item(
            v-for='branch of editorStore.gitLocalBranches'
            :key='branch'
            )
            q-item-section(side)
              q-icon(name='mdi-source-branch', size='xs')
            q-item-section
              q-item-label {{ branch }}
              q-item-label.text-light-green-4(v-if='editorStore.gitCurrentBranch === branch', caption): em Current Branch
            q-item-section(
              v-if='editorStore.gitCurrentBranch !== branch'
              side
              )
              .flex.items-center
                q-btn.q-mr-sm(
                  outline
                  color='light-green-5'
                  padding='xs sm'
                  label='Set Active'
                  no-caps
                  @click='setActive(branch)'
                )
                q-btn(
                  outline
                  color='red-5'
                  padding='xs sm'
                  label='Delete'
                  no-caps
                  @click='deleteRemote(branch)'
                )
      q-separator(vertical)
      .col
        .bg-grey-10.text-body2.q-pa-md Remote Branches #[em.text-grey-5 ({{ editorStore.gitCurrentRemote }})]
        q-separator
        q-list(
          padding
          separator
        )
          q-item(
            v-for='branch of editorStore.gitRemoteBranches'
            :key='branch'
            )
            q-item-section(side)
              q-icon(name='mdi-source-branch', size='xs')
            q-item-section
              q-item-label {{ branch }}
            q-item-section(side)
              q-btn(
                outline
                color='light-green-5'
                padding='xs sm'
                label='Checkout'
                no-caps
                @click='setActive(branch)'
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

async function setActive (remote) {
  editorStore.gitCurrentRemote = remote
  state.isLoading = true
  try {
    await editorStore.saveGitConfig()
  } catch (err) {
    console.error(err)
    $q.notify({
      message: 'Failed to save current remote selection',
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
      await window.ipcBridge.gitDeleteRemote(editorStore.workingDirectory, remote)
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

// MOUNTED

onMounted(async () => {
  state.isLoading = true
  await editorStore.fetchRemotes()
  state.isLoading = false
})

</script>

<style lang="scss">
.branches {
  min-width: 900px;
  display: flex;
  flex-direction: column;

  &-main {
    min-height: 300px;
  }
}
</style>
