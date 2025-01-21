<template lang="pug">
q-dialog(
  ref='dialogRef'
  @hide='onDialogHide'
  :transition-show='editorStore.animationEffects ? `jump-up` : `none`'
  :transition-hide='editorStore.animationEffects ? `jump-down` : `none`'
  )
  q-card.mica.prefs
    q-card-section.flex.items-center.bg-light-blue-10
      q-icon.animated.spin(name='mdi-cog', left, size='sm')
      span Preferences
      q-space
      q-btn(
        unelevated
        icon='mdi-close'
        color='primary'
        padding='xs'
        @click='onDialogCancel'
        )
    .row.no-wrap.items-stretch.prefs-main.card-border
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
        template(v-if='state.tab === `general`')
          q-form.q-gutter-md.q-pa-lg
            .row
              .col
                .text-body2 Persist Session on Close
                .text-caption.text-grey-5 Save your current session on close to be able to restore it the next time you launch the editor.
              .col-auto
                q-toggle(
                  v-model='editorStore.persistSession'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                )
            .row(v-if='editorStore.persistSession')
              .col
                .text-body2 Restore Last Session on Launch
                .text-caption.text-grey-5 Automatically restore the last session when launching the editor.
              .col-auto
                q-toggle(
                  v-model='editorStore.restoreSession'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                )
            .row
              .col
                .text-body2 Confirm Before Closing
                .text-caption.text-grey-5 Whether to prompt for confirmation before exiting.
              .col-auto
                q-toggle(
                  v-model='editorStore.confirmExit'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                )
            q-separator
            .row
              .col
                .text-body2 Enable Translucency Effects
                .text-caption.text-grey-5 Show translucent background effects on modals and menu UI elements.
              .col-auto
                q-toggle(
                  v-model='editorStore.translucencyEffects'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                )
            .row
              .col
                .text-body2 Enable Animations
                .text-caption.text-grey-5 Use transition animations for modals and dialogs.
              .col-auto
                q-toggle(
                  v-model='editorStore.animationEffects'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                )
            q-separator
            .row
              .col
                .text-body2 Automatically Check for Updates
                .text-caption.text-grey-5 The application will automatically check for new versions at launch.
              .col-auto
                q-toggle(
                  v-model='editorStore.checkForUpdates'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                )
              q-separator.q-ml-sm.q-mr-md(vertical, inset)
              .col-auto
                q-btn(
                  label='Check Now'
                  unelevated
                  color='primary'
                  no-caps
                  @click='checkForUpdates'
                )
        template(v-else-if='state.tab === `editor`')
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
              .col
                .text-body2 Font Size
                .text-caption.text-grey-5 Note that you can still zoom in / out on the editor regardless of this setting.
              .col-auto
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
              .col
                .text-body2 Format on Type
                .text-caption.text-grey-5 Controls whether the editor should automatically format the line after typing.
              .col-auto
                q-toggle(
                  v-model='editorStore.formatOnType'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                )
            .row
              .col
                .text-body2 Preview Pane
                .text-caption.text-grey-5 Controls whether the preview pane should be displayed.
              .col-auto
                q-toggle(
                  v-model='editorStore.previewPaneShown'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                )
            .row
              .col
                .text-body2 Tab Size
                .text-caption.text-grey-5 The number of spaces a tab is equal to.
              .col-auto
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
              .col
                .text-body2 Word Wrap
                .text-caption.text-grey-5 Control the wrapping of the editor.
              .col-auto
                q-toggle(
                  v-model='editorStore.wordWrap'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                )
        template(v-else-if='state.tab === `keyboard`')
          q-form.q-gutter-md.q-pa-lg
            .row
              .col-8
                .text-body2 Mode Preset
                .text-caption.text-grey-5 Keyboard shortcuts mode to use with the editor.
              .col-4
                q-select(
                  outlined
                  v-model='editorStore.keybindings'
                  :options='keybindings'
                  dense
                  color='light-blue-4'
                  emit-value
                  map-options
                  )
            q-separator
            .row
              .col
                .text-body2 Control Modifier
                .text-caption.text-grey-5 Set the key to use as the Control modifier
              .col-auto.self-center
                q-chip(color='purple-2', square, outline) ControlLeft
              q-separator.q-ml-sm.q-mr-md(vertical, inset)
              .col-auto
                q-btn(
                  label='Change'
                  unelevated
                  color='primary'
                  no-caps
                )
            .row
              .col
                .text-body2 Meta Modifier
                .text-caption.text-grey-5 Set the key to use as the Meta modifier
              .col-auto.self-center
                q-chip(color='purple-2', square, outline) Escape
              q-separator.q-ml-sm.q-mr-md(vertical, inset)
              .col-auto
                q-btn(
                  label='Change'
                  unelevated
                  color='primary'
                  no-caps
                )
        template(v-else-if='state.tab === `git`')
          q-form.q-gutter-md.q-pa-lg
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
              .col
                .text-body2 Sign Commits
                .text-caption.text-grey-5 Use OpenPGP signing when creating commits.
              .col-auto
                q-toggle(
                  v-model='editorStore.gitSignCommits'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                )
            .row(v-if='editorStore.gitSignCommits')
              .col
                .text-body2 Use System Default Signing Key
                .text-caption.text-grey-5 Use the signing key configured globally in git on your system.
              .col-auto
                q-toggle(
                  v-model='editorStore.gitUseDefaultSigningKey'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                )
            .row(v-if='editorStore.gitSignCommits && !editorStore.gitUseDefaultSigningKey')
              .col
                .text-body2 OpenPGP Signing Key
                .text-caption.text-grey-5 Set the key to use for signing commits.
                .text-caption.flex(v-if='editorStore.gitPgpKeySet')
                  q-badge(label='ed25519', color='green-9')
                  q-separator.q-mx-sm(vertical)
                  .text-uppercase.text-purple-2 {{ editorStore.gitFingerprint }}
                  q-separator.q-mx-sm(vertical)
                  a.text-light-blue-3(href='#', @click.stop.prevent='copyPublicKey') Copy Public Key
              .col-auto
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

        template(v-else-if='state.tab === `profile`')
          .q-pa-md(v-if='userStore.isLoggedIn')
            .row.q-gutter-md.items-center
              .col-auto
                q-avatar(size='70px', rounded)
                  img(:src='userStore.profile.picture')
              .col
                .text-caption: strong.text-grey-5 Logged in as
                .text-body1 {{ userStore.profile.name }}
                .text-body2 {{ userStore.profile.email }}
              .col-auto
                q-btn(
                  unelevated
                  color='primary'
                  label='Edit Profile'
                  icon='mdi-account-edit'
                  no-caps
                  @click='editProfile'
                )
                q-btn.q-ml-sm(
                  unelavated
                  color='negative'
                  label='Logout'
                  icon='mdi-logout'
                  no-caps
                  @click='logout'
                )
          .q-pa-md(v-else)
            span You are not currently logged in.
            .q-mt-md
              q-btn(
                unelevated
                color='primary'
                label='Login'
                icon='mdi-login'
                no-caps
                @click='login'
              )

        template(v-if='state.tab === `telemetry`')
          q-form.q-gutter-md.q-pa-lg
            .row
              .col
                .text-body2 Send telemetry to the IETF Tools team
                .text-caption.text-grey-5 Application traces, errors and performance metrics will be sent to the IETF Tools team for debugging and general improvement purposes.
              .col-auto
                q-toggle(
                  v-model='editorStore.telemetry'
                  color='primary'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                  @update:model-value='updateTelemetryState'
                )

        template(v-if='state.tab === `dev`')
          q-form.q-gutter-md.q-pa-lg
            .flex.items-center.text-red-5
              q-icon.animated.fadeIn.infinite.slower.q-mr-sm(name='mdi-alert' size='sm')
              span These settings are for development / debugging purposes only.
            q-separator.q-my-md(inset)
            .row
              .col
                .text-body2 Disable Unload Handlers
                .text-caption.text-grey-5 Prevent beforeUnload handlers from running.
              .col-auto
                q-toggle(
                  v-model='editorStore.debugDisableUnload'
                  color='red'
                  checked-icon='mdi-check'
                  unchecked-icon='mdi-close'
                )
</template>

<script setup>
import { defineAsyncComponent, onBeforeUnmount, reactive } from 'vue'
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { useEditorStore } from 'src/stores/editor'
import { useUserStore } from 'src/stores/user'

const editorStore = useEditorStore()
const userStore = useUserStore()

const props = defineProps({
  tab: {
    type: String,
    default: 'general'
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
  tab: props.tab || 'editor',
  gitPasswordShown: false
})

const tabs = [
  {
    key: 'general',
    icon: 'mdi-dots-hexagon',
    label: 'General'
  },
  {
    key: 'editor',
    icon: 'mdi-square-edit-outline',
    label: 'Editor'
  },
  {
    key: 'keyboard',
    icon: 'mdi-keyboard-outline',
    label: 'Keyboard Shortcuts'
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
  },
  {
    key: 'telemetry',
    icon: 'mdi-broadcast',
    label: 'Telemetry'
  },
  {
    key: 'dev',
    icon: 'mdi-flask',
    label: 'Dev / Debug'
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

const keybindings = [
  {
    label: 'VS Code (default)',
    value: 'default'
  },
  {
    label: 'Emacs',
    value: 'emacs'
  },
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

// METHODS

function checkForUpdates () {
  window.ipcBridge.emit('checkForUpdates')
}

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

function login () {
  window.ipcBridge.emit('login')
}
function editProfile () {
  window.ipcBridge.emit('launchBrowser', { url: 'https://datatracker.ietf.org/accounts/profile/' })
}
function logout () {
  window.ipcBridge.emit('logout')
}

function updateTelemetryState (newState) {
  window.ipcBridge.emit('setTelemetryState', { enabled: newState })
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
