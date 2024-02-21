<template lang="pug">
q-dialog(ref='dialogRef', @hide='onDialogHide')
  q-card.mica.prefs
    q-card-section.flex.items-center.bg-light-blue-10
      q-icon(name='mdi-cog', left, size='sm')
      span Preferences
      q-space
      q-btn(
        unelevated
        icon='mdi-close'
        color='primary'
        padding='xs'
        @click='onDialogCancel'
        )
    .row.no-wrap.items-stretch.prefs-main
      .col-auto.prefs-sidebar
        q-list(separator)
          q-item(
            v-for='tab of tabs'
            :key='tab.key'
            :active='tab.key === state.tab'
            active-class='bg-grey-9 text-white'
            clickable
            @click='state.tab = tab.key'
            )
            q-item-section(side)
              q-icon(:name='tab.icon')
            q-item-section
              q-item-label {{ tab.label }}
      .col
        template(v-if='state.tab === `editor`')
          q-form.q-gutter-md.q-pa-lg
            .row
              .col-8
                .text-body2 Theme
                .text-caption.text-grey-5 Color theme for the editor and preview pane.
              .col-4
                q-select(
                  outlined
                  v-model='editorStore.theme'
                  :options='themes'
                  dense
                  color='light-blue-4'
                  emit-value
                  map-options
                  )
            q-separator
            .row
              .col-8
                .text-body2 Cursor Style
                .text-caption.text-grey-5 Control the cursor style.
              .col-4
                q-select(
                  outlined
                  v-model='editorStore.cursorStyle'
                  :options='cursorStyles'
                  dense
                  color='light-blue-4'
                  emit-value
                  map-options
                  )
            .row
              .col-8
                .text-body2 Cursor Blinking
                .text-caption.text-grey-5 Control the cursor animation style.
              .col-4
                q-select(
                  outlined
                  v-model='editorStore.cursorBlinking'
                  :options='cursorAnims'
                  dense
                  color='light-blue-4'
                  emit-value
                  map-options
                  )
            .row
              .col-8
                .text-body2 Font Size
                .text-caption.text-grey-5 Note that you can still zoom in / out on the editor regardless of this setting.
              .col-4
                q-input(
                  v-model.number='editorStore.fontSize'
                  type='number'
                  outlined
                  dense
                  color='light-blue-4'
                  suffix='px'
                  style='width: 200px'
                )
            .row
              .col-8
                .text-body2 Format on Type
                .text-caption.text-grey-5 Controls whether the editor should automatically format the line after typing.
              .col-4
                q-toggle(
                  v-model='editorStore.formatOnType'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                )
            .row
              .col-8
                .text-body2 Preview Pane
                .text-caption.text-grey-5 Controls whether the preview pane should be displayed.
              .col-4
                q-toggle(
                  v-model='editorStore.previewPaneShown'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                )
            .row
              .col-8
                .text-body2 Tab Size
                .text-caption.text-grey-5 The number of spaces a tab is equal to.
              .col-4
                q-input(
                  v-model.number='editorStore.tabSize'
                  type='number'
                  outlined
                  dense
                  color='light-blue-4'
                  suffix='spaces'
                  style='width: 200px'
                )
            .row
              .col-8
                .text-body2 Word Wrap
                .text-caption.text-grey-5 Control the wrapping of the editor.
              .col-4
                q-toggle(
                  v-model='editorStore.wordWrap'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                )

        template(v-else-if='state.tab === `git`')
          q-form.q-gutter-md.q-pa-lg
            //- .row
            //-   .col-8
            //-     .text-body2 Git Mode
            //-     .text-caption.text-grey-5 Whether to use the system git or the editor built-in git integration.
            //-   .col-4
            //-     q-select(
            //-       outlined
            //-       v-model='editorStore.gitMode'
            //-       :options='gitModes'
            //-       dense
            //-       color='light-blue-4'
            //-       emit-value
            //-       map-options
            //-       )
            .row
              .col-8
                .text-body2 Name
                .text-caption.text-grey-5 The name to use when creating commits.
              .col-4
                q-input(
                  v-model.number='editorStore.gitName'
                  outlined
                  dense
                  color='light-blue-4'
                )
            .row
              .col-8
                .text-body2 Email Address
                .text-caption.text-grey-5 The email address to use when creating commits. It should match your git provider email address.
              .col-4
                q-input(
                  v-model.number='editorStore.gitEmail'
                  outlined
                  dense
                  color='light-blue-4'
                )
            q-separator
            .row
              .col-8
                .text-body2 Use Git Credential Manager
                .text-caption.text-grey-5 Use the native git credential manager for authentication. Git must be installed on the system.
              .col-4
                q-toggle(
                  v-model='editorStore.gitUseCredMan'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                )
            .row(v-if='!editorStore.gitUseCredMan')
              .col-8
                .text-body2 Username
                .text-caption.text-grey-5 The username to use for git authentication.
              .col-4
                q-input(
                  v-model.number='editorStore.gitUsername'
                  outlined
                  dense
                  color='light-blue-4'
                )
            .row(v-if='!editorStore.gitUseCredMan')
              .col-8
                .text-body2 Password / Personal Access Token
                .text-caption.text-grey-5 The password / PAT to use for git authentication
              .col-4
                q-input(
                  v-model.number='editorStore.gitPassword'
                  type='password'
                  outlined
                  dense
                  color='light-blue-4'
                )
            q-separator
            .row
              .col-8
                .text-body2 Sign Commits
                .text-caption.text-grey-5 Use OpenPGP signing when creating commits.
              .col-4
                q-toggle(
                  v-model='editorStore.gitSignCommits'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                )
            .row(v-if='editorStore.gitSignCommits')
              .col-8
                .text-body2 OpenPGP Signing Key
                .text-caption.text-grey-5 Set the key to use for signing commits.
                .text-caption.flex(v-if='editorStore.gitPgpKeySet')
                  q-badge(label='RSA', color='green-9')
                  q-separator.q-mx-sm(vertical)
                  .text-uppercase.text-purple-2 {{ editorStore.gitFingerprint }}
                  q-separator.q-mx-sm(vertical)
                  a.text-light-blue-3(href='#', @click.stop.prevent='copyPublicKey') Copy Public Key
              .col-4
                q-btn(
                  :label='editorStore.gitPgpKeySet ? `Generate New` : `Setup`'
                  color='primary'
                  no-caps
                  @click='setupPGPKey'
                )
                q-btn.q-ml-sm(
                  v-if='editorStore.gitPgpKeySet'
                  label='Clear'
                  color='negative'
                  no-caps
                  @click='clearPGPKey'
                )

</template>

<script setup>
import { defineAsyncComponent, onBeforeUnmount, reactive } from 'vue'
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { useEditorStore } from 'src/stores/editor'

const editorStore = useEditorStore()

const props = defineProps({
  tab: {
    type: String,
    default: 'editor'
  }
})

const $q = useQuasar()

// EMITS

defineEmits([
  ...useDialogPluginComponent.emits
])

// QUASAR

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

// STATE

const state = reactive({
  tab: props.tab || 'editor'
})

const tabs = [
  {
    key: 'editor',
    icon: 'mdi-square-edit-outline',
    label: 'Editor'
  },
  {
    key: 'git',
    icon: 'mdi-git',
    label: 'Git Integration'
  },
  {
    key: 'profile',
    icon: 'mdi-account',
    label: 'Profile'
  }
]

const themes = [
  {
    label: 'Dark',
    value: 'ietf-dark'
  },
  {
    label: 'Light',
    value: 'ietf-light'
  },
  {
    label: 'High Contrast',
    value: 'hc-black'
  },
  {
    label: 'High Contrast Light',
    value: 'hc-light'
  }
]

const cursorStyles = [
  {
    label: 'Line',
    value: 'line'
  },
  {
    label: 'Block',
    value: 'block'
  },
  {
    label: 'Underline',
    value: 'underline'
  },
  {
    label: 'Line Thin',
    value: 'line-thin'
  },
  {
    label: 'Block Outline',
    value: 'block-outline'
  },
  {
    label: 'Underline Thin',
    value: 'underline-thin'
  }
]

const cursorAnims = [
  {
    label: 'Blink',
    value: 'blink'
  },
  {
    label: 'Smooth',
    value: 'smooth'
  },
  {
    label: 'Phase',
    value: 'phase'
  },
  {
    label: 'Expand',
    value: 'expand'
  },
  {
    label: 'Solid',
    value: 'solid'
  }
]

// const gitModes = [
//   {
//     label: 'Editor Git',
//     value: 'editor'
//   },
//   {
//     label: 'System Git',
//     value: 'system'
//   }
// ]

// METHODS

function setupPGPKey () {
  $q.dialog({
    component: defineAsyncComponent(() => import('components/OpenPGPSetupDialog.vue'))
  })
}

function clearPGPKey () {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to clear this OpenPGP signing key? Note that you must still remove the key from git provider afterwards.',
    persistent: true,
    focus: 'none',
    ok: {
      color: 'negative',
      textColor: 'white',
      unelevated: true,
      label: 'Clear',
      noCaps: true
    },
    cancel: {
      color: 'grey-3',
      outline: true,
      noCaps: true
    }
  }).onOk(async () => {
    const succeeded = await window.ipcBridge.clearGitKey()
    if (succeeded) {
      await editorStore.fetchGitConfig()
      $q.notify({
        message: 'Signing key cleared successfully.',
        caption: 'The revocation certificate has been copied to your clipboard.',
        color: 'positive',
        icon: 'mdi-check'
      })
    }
  })
}

function copyPublicKey () {
  window.ipcBridge.emit('copyGitPublicKey')
  $q.notify({
    message: 'Public key copied to clipboard.',
    color: 'positive',
    icon: 'mdi-clipboard-check-outline'
  })
}

onBeforeUnmount(() => {
  editorStore.saveGitConfig()
})

</script>

<style lang="scss">
.prefs {
  min-width: 1200px;
  min-height: 600px;
  display: flex;
  flex-direction: column;

  &-main {
    flex: 1;
  }

  &-sidebar {
    flex-basis: 250px;
    background-color: $grey-10;
  }
}
</style>
