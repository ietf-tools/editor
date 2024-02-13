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
            q-select(
              outlined
              v-model='editorStore.cursorBlinking'
              :options='cursorAnims'
              label='Cursor Blinking Animation'
              color='light-blue-4'
              emit-value
              map-options
              style='width: 400px'
              )
            q-input(
              v-model.number='editorStore.fontSize'
              type='number'
              outlined
              label='Font Size'
              color='light-blue-4'
              suffix='px'
              style='width: 200px'
            )
            q-input(
              v-model.number='editorStore.tabSize'
              type='number'
              outlined
              label='Tab Size'
              color='light-blue-4'
              suffix='spaces'
              style='width: 200px'
            )
            q-toggle(
              v-model='editorStore.formatOnType'
              label='Format on Type'
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
