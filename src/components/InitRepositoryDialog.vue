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
      span Initialize New Repository
    q-card-section.card-border
      q-card-section.q-pa-sm
        .row
          .col-12
            .text-body2 Local Repository Directory
            .text-caption.text-grey-5 The folder will be created automatically if it doesn't exist.
          .col-12
            q-input.q-mt-sm.q-pr-none(
              color='light-blue-4'
              dense
              outlined
              v-model='state.target'
              tabindex='1'
              )
              template(#prepend)
                q-icon(name='mdi-folder-wrench-outline')
              template(#append)
                q-separator.q-mx-sm(vertical inset)
                q-btn(
                  tabindex='2'
                  flat
                  label='Browse...'
                  color='white'
                  icon='mdi-folder-open'
                  no-caps
                  @click='browseTargetDir'
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
          tabindex='5'
          no-caps
          )
        q-space
        q-btn(
          outline
          label='Cancel'
          color='grey-5'
          padding='xs md'
          @click='onDialogCancel'
          tabindex='4'
          )
        q-btn(
          unelevated
          label='Initialize'
          color='primary'
          padding='xs md'
          @click='initRepo'
          tabindex='3'
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
  target: editorStore.workingDirectory,
  isLoading: false
})

// METHODS

async function initRepo () {
  let progressDialog
  try {
    const targetDir = state.target?.trim()

    if (!targetDir) {
      throw new Error('You must enter a valid local target directory!')
    }

    progressDialog = $q.dialog({
      message: 'Initializing repository...',
      progress: {
        spinner: QSpinnerTail,
        color: 'white'
      },
      persistent: true,
      ok: false
    })

    // -> Clone repo
    const finalRepoDir = await window.ipcBridge.gitInitRepository(targetDir)
    state.isLoading = false

    // -> Switch working directory
    editorStore.workingDirectory = finalRepoDir
    editorStore.drawerPane = 'DrawerFiles'

    setTimeout(() => {
      progressDialog.hide()
      $q.notify({
        message: 'Git repository initialized successfully.',
        color: 'positive',
        icon: 'mdi-check'
      })
      onDialogOK()
    }, 400)
  } catch (err) {
    progressDialog.hide()
    $q.notify({
      message: 'Failed to initialize repository',
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
