<template lang="pug">
q-dialog(
  ref='dialogRef'
  @hide='onDialogHide'
  :transition-show='editorStore.animationEffects ? `jump-up` : `none`'
  :transition-hide='editorStore.animationEffects ? `jump-down` : `none`'
  )
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
      q-btn.q-mr-md(
        unelevated
        icon='mdi-plus'
        label='New Branch'
        color='primary'
        padding='xs md'
        no-caps
        @click='state.newBranchFormShown = true'
        :disabled='state.isLoading || state.newBranchFormShown'
        )
      q-btn.q-mr-md(
        unelevated
        icon='mdi-refresh'
        padding='xs'
        color='primary'
        @click='refresh'
        :disabled='state.isLoading'
        )
        q-tooltip Refresh Local + Remote Branches
      q-btn(
        unelevated
        icon='mdi-close'
        color='primary'
        padding='xs'
        @click='onDialogCancel'
        )
        q-tooltip Close Dialog
    .card-border
      .branches-new(v-if='state.newBranchFormShown')
        q-form.q-gutter-md.q-pa-lg
          .row
            .col-5
              .text-body2 Name
              .text-caption.text-grey-5 The name of the new branch
            .col-7
              q-input(
                autofocus
                v-model.number='state.newBranchName'
                outlined
                dense
                clearable
                color='light-blue-4'
                tabindex='1'
              )
          .row
            .col-5
              .text-body2 Source
              .text-caption.text-grey-5 Branch to create from
            .col-7
              q-select(
                outlined
                v-model='state.newBranchSource'
                :options='editorStore.gitLocalBranches'
                dense
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
                @click='state.newBranchFormShown = false'
                tabindex='4'
                )
              q-btn(
                unelevated
                label='Create Branch'
                color='primary'
                padding='xs md'
                @click='newBranch'
                tabindex='3'
                :loading='state.isLoading'
                )
      .branches-main.row
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
          .bg-grey-10.text-body2.q-pa-md Remote Branches
          q-separator
          q-list(
            padding
            separator
          )
            q-item(
              v-for='br of editorStore.gitRemoteBranches'
              :key='br'
              )
              q-item-section(side)
                q-icon(name='mdi-source-branch', size='xs')
              q-item-section
                q-item-label {{ br.branch }}
                q-item-label.text-blue-3(caption) {{ br.remote }}
              q-item-section(side)
                q-btn(
                  unelevated
                  size='sm'
                  icon='mdi-dots-horizontal'
                  padding='xs xs'
                  color='grey-10'
                  text-color='grey-5'
                  )
                  q-tooltip Pull...
                  q-menu(auto-close)
                    q-list.bg-dark-7(separator, padding)
                      q-item(clickable, @click='setActive(branch)')
                        q-item-section(side)
                          q-icon(name='mdi-source-branch-check', color='green-4')
                        q-item-section
                          q-item-label: strong Checkout
                          q-item-label(caption) Checkout this remote branch and set as the push target.
                      q-item(clickable, @click='setActive(branch)')
                        q-item-section(side)
                          q-icon(name='mdi-earth-arrow-up', color='blue-4')
                        q-item-section
                          q-item-label: strong Set as Push Target
                          q-item-label(caption) Set this remote branch as the push target for the current local branch.
                      q-item(clickable, @click='setActive(branch)')
                        q-item-section(side)
                          q-icon(name='mdi-trash-can', color='red-4')
                        q-item-section
                          q-item-label: strong Delete Remote Branch
                          q-item-label(caption) Delete branch remotely but keep local branch #[em (if it exists)].
                      q-item(clickable, @click='setActive(branch)')
                        q-item-section(side)
                          q-icon(name='mdi-delete-forever', color='red-4')
                        q-item-section
                          q-item-label: strong Delete Remote + Local Branch
                          q-item-label(caption) Delete both remote and local branch #[em (if it exists)].

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
  newBranchFormShown: false,
  newBranchName: '',
  newBranchSource: editorStore.gitCurrentBranch
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

async function newBranch () {

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
      message: 'Failed to fetch from remote',
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
.branches {
  min-width: 900px;
  display: flex;
  flex-direction: column;

  &-new {
    background-color: rgba(255,255,255,.05);
    border-bottom: 1px solid rgba(255,255,255,.1);
  }

  &-main {
    min-height: 300px;
  }
}
</style>
