<template lang="pug">
q-dialog(
  ref='dialogRef'
  @hide='onDialogHide'
  :transition-show='editorStore.animationEffects ? `jump-up` : `none`'
  :transition-hide='editorStore.animationEffects ? `jump-down` : `none`'
  )
  q-card.mica(style='min-width: 800px;')
    q-card-section.flex.items-center.bg-light-blue-10
      q-icon(name='mdi-git', left, size='sm')
      span Clone Repository
    q-card-section.card-border
      q-card-section.q-pa-sm
        .row
          .col-12
            .text-body2 Git Repository URL
            .text-caption.text-grey-5 The HTTPS Web URL of the repository to clone.
          .col-12
            q-input.q-mt-sm(
              autofocus
              color='light-blue-4'
              outlined
              dense
              placeholder='e.g. https://github.com/rfc-editor/draft-abc-def-ghi.git'
              clearable
              v-model='state.url'
              tabindex='0'
              )
              template(#prepend)
                q-icon(name='mdi-source-branch')
        .row.q-mt-lg
          .col
            .text-body2 Git Repository is a Fork
            .text-caption.text-grey-5 Indicate whether the repository URL above is a fork of an upstream repository.
          .col-auto
            q-toggle(
              tabindex='1'
              v-model='state.isFork'
              checked-icon='mdi-check'
              unchecked-icon='mdi-close'
            )
        .row.q-mt-lg(v-if='state.isFork')
          .col-12
            .text-body2 Upstream Git Repository URL
            .text-caption.text-grey-5 The HTTPS Web URL of the upstream repository.
          .col-12
            q-input.q-mt-sm(
              autofocus
              color='light-blue-4'
              outlined
              dense
              placeholder='e.g. https://github.com/rfc-editor/draft-abc-def-ghi.git'
              clearable
              v-model='state.upstreamUrl'
              tabindex='2'
              )
              template(#prepend)
                q-icon(name='mdi-source-branch')
        q-separator.q-my-md
        .row.q-mt-lg
          .col-12
            .text-body2 Local Target Directory
            .text-caption.text-grey-5 The destination folder will be created automatically if it doesn't exist.
          .col-12
            q-input.q-mt-sm.q-pr-none(
              color='light-blue-4'
              dense
              outlined
              v-model='state.target'
              tabindex='3'
              )
              template(#prepend)
                q-icon(name='mdi-folder-wrench-outline')
              template(#append)
                q-separator.q-mx-sm(vertical inset)
                q-btn(
                  tabindex='3'
                  flat
                  label='Browse...'
                  color='white'
                  icon='mdi-folder-open'
                  no-caps
                  @click='browseTargetDir'
                )
        .row.q-mt-lg
          .col
            .text-body2 Clone in Subdirectory
            .text-caption.text-grey-5 A subdirectory with the name of the repository will be created under the path selected above. This replicates the default behavior of Git.
          .col-auto
            q-toggle(
              tabindex='4'
              v-model='state.cloneInSubDir'
              checked-icon='mdi-check'
              unchecked-icon='mdi-close'
            )
        .row.q-mt-lg
          .col
            .text-body2 Switch Working Directory
            .text-caption.text-grey-5 Automatically set the cloned repository path as the working directory.
          .col-auto
            q-toggle(
              tabindex='4'
              v-model='state.switchWorkDir'
              checked-icon='mdi-check'
              unchecked-icon='mdi-close'
            )
      q-separator.q-my-md
      q-card-actions
        q-btn(
          outline
          label='Git Configuration'
          icon='mdi-git'
          color='grey-5'
          padding='xs md'
          @click='gitSettings'
          tabindex='7'
          no-caps
          )
        q-space
        q-btn(
          outline
          label='Cancel'
          color='grey-5'
          padding='xs md'
          @click='onDialogCancel'
          tabindex='6'
          )
        q-btn(
          unelevated
          label='Clone'
          color='primary'
          padding='xs md'
          @click='cloneRepo'
          tabindex='5'
          :disabled='state.isLoading'
          )
</template>

<script setup>
import { useDialogPluginComponent, useQuasar, QSpinnerTail } from 'quasar'
import { defineAsyncComponent, reactive } from 'vue'
import { useEditorStore } from 'src/stores/editor'

const $q = useQuasar()

// EMITS

defineEmits([
  ...useDialogPluginComponent.emits
])

// STORES

const editorStore = useEditorStore()

// QUASAR

const { dialogRef, onDialogCancel, onDialogHide, onDialogOK } = useDialogPluginComponent()

// STATE

const state = reactive({
  url: '',
  isFork: false,
  upstreamUrl: '',
  target: editorStore.workingDirectory,
  cloneInSubDir: true,
  switchWorkDir: true,
  isLoading: false
})

// METHODS

async function cloneRepo () {
  let progressDialog
  try {
    if (!state.url || !state.url.startsWith('https://')) {
      throw new Error('You must enter a valid HTTPS git repository URL!')
    }
    if (!state.target) {
      throw new Error('You must enter a valid local target directory!')
    }

    progressDialog = $q.dialog({
      message: 'Cloning repository...',
      progress: {
        spinner: QSpinnerTail,
        color: 'white'
      },
      persistent: true,
      ok: false
    })

    // -> Append repo to target path
    let targetDir = state.target.trim()
    if (state.cloneInSubDir) {
      let lastUrlPart = state.url.split('/').at(-1)
      if (lastUrlPart.endsWith('.git')) {
        lastUrlPart = lastUrlPart.slice(0, -4)
      }
      targetDir = process.env.OS_PLATFORM === 'win32' ? `${targetDir}\\${lastUrlPart}` : `${targetDir}/${lastUrlPart}`
    }

    // -> Clone repo
    await window.ipcBridge.gitCloneRepository(state.url, targetDir, state.isFork ? state.upstreamUrl : null)
    state.isLoading = false

    // -> Switch working directory
    if (state.switchWorkDir) {
      editorStore.workingDirectory = state.target
      editorStore.drawerPane = 'DrawerFiles'
    }
    setTimeout(() => {
      progressDialog.hide()
      $q.notify({
        message: 'Git repository cloned successfully.',
        color: 'positive',
        icon: 'mdi-check'
      })
      onDialogOK()
    }, 400)
  } catch (err) {
    progressDialog.hide()
    $q.notify({
      message: 'Failed to clone repository',
      caption: err.message,
      color: 'negative',
      icon: 'mdi-alert'
    })
  }
}

async function browseTargetDir () {
  const wdPath = await window.ipcBridge.promptSelectDirectory(state.target, 'Select Target Directory...')
  if (wdPath) {
    state.target = wdPath
  }
}

function gitSettings () {
  $q.dialog({
    component: defineAsyncComponent(() => import('components/PreferencesDialog.vue')),
    componentProps: {
      tab: 'git'
    }
  })
}

</script>
