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
                .text-body2 Format on Type
                .text-caption.text-grey-5 Controls whether the editor should automatically format the line after typing.
              .col-4
                q-toggle(
                  v-model='editorStore.formatOnType'
                )
            .row
              .col-8
                .text-body2 Word Wrap
                .text-caption.text-grey-5 Control the wrapping of the editor.
              .col-4
                q-toggle(
                  v-model='editorStore.wordWrap'
                )

        template(v-else-if='state.tab === `git`')
          q-form.q-gutter-md.q-pa-lg
            q-select(
              outlined
              v-model='editorStore.gitMode'
              :options='gitModes'
              label='Git Mode'
              hint='Whether to use the system git or the editor built-in git integration.'
              color='light-blue-4'
              emit-value
              map-options
              )

</template>

<script setup>
import { reactive } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { useEditorStore } from 'src/stores/editor'

const editorStore = useEditorStore()

// const $q = useQuasar()

// EMITS

defineEmits([
  ...useDialogPluginComponent.emits
])

// QUASAR

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

// STATE

const state = reactive({
  tab: 'editor'
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

const gitModes = [
  {
    label: 'Integrated Git',
    value: 'integrated',
    description: 'Use the editor built-in git'
  },
  {
    label: 'System Git',
    value: 'system',
    description: 'Use the local system git'
  }
]

// METHODS

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
