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
        component(:is='currentTabComponent')
</template>

<script setup>
import { defineAsyncComponent, reactive, computed } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { useEditorStore } from 'src/stores/editor'
import { find } from 'lodash-es'

const editorStore = useEditorStore()

const props = defineProps({
  tab: {
    type: String,
    default: 'general'
  }
})

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

const tabs = computed(() => ([
  {
    key: 'general',
    icon: 'mdi-dots-hexagon',
    label: 'General',
    component: defineAsyncComponent(() => import('components/PreferencesGeneralPanel.vue'))
  },
  ...(editorStore.debugExperimental
    ? [{
        key: 'dependencies',
        icon: 'mdi-cube',
        label: 'Dependencies',
        component: defineAsyncComponent(() => import('components/PreferencesDependenciesPanel.vue'))
      }]
    : []),
  {
    key: 'editor',
    icon: 'mdi-square-edit-outline',
    label: 'Editor',
    component: defineAsyncComponent(() => import('components/PreferencesEditorPanel.vue'))
  },
  ...(editorStore.debugExperimental
    ? [{
        key: 'keyboard',
        icon: 'mdi-keyboard-outline',
        label: 'Keyboard Shortcuts',
        component: defineAsyncComponent(() => import('components/PreferencesKeyboardPanel.vue'))
      }]
    : []),
  {
    key: 'git',
    icon: 'mdi-git',
    label: 'Git Integration',
    component: defineAsyncComponent(() => import('components/PreferencesGitPanel.vue'))
  },
  {
    key: 'profile',
    icon: 'mdi-account',
    label: 'Profile',
    component: defineAsyncComponent(() => import('components/PreferencesProfilePanel.vue'))
  },
  {
    key: 'telemetry',
    icon: 'mdi-broadcast',
    label: 'Telemetry',
    component: defineAsyncComponent(() => import('components/PreferencesTelemetryPanel.vue'))
  },
  {
    key: 'terminal',
    icon: 'mdi-console',
    label: 'Terminal',
    component: defineAsyncComponent(() => import('components/PreferencesTerminalPanel.vue'))
  },
  {
    key: 'dev',
    icon: 'mdi-flask',
    label: 'Dev / Debug',
    component: defineAsyncComponent(() => import('components/PreferencesDevPanel.vue'))
  }
]))

// COMPUTED

const currentTabComponent = computed(() => {
  return find(tabs.value, ['key', state.tab]).component
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
