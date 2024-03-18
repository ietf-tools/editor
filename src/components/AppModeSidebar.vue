<template lang="pug">
.app-mode(v-if='editorStore.modeSidebarShown')
  q-btn.full-width(
    v-for='mode of modes'
    :key='mode.key'
    :icon-right='mode.icon'
    unelevated
    :color='editorStore.mode === mode.key ? mode.color : `dark-1`'
    dense
    stack
    :label='mode.label'
    no-caps
    @click='editorStore.mode = mode.key'
    )
    q-tooltip(anchor='center right' self='center left') {{ mode.label }} Mode
  q-btn.full-width(
    icon='mdi-arrow-collapse-left'
    flat
    dense
    text-color='blue-grey-4'
    @click='editorStore.modeSidebarShown = false'
    )
    q-tooltip(anchor='center right' self='center left') Hide Mode Sidebar
</template>

<script setup>
import { useEditorStore } from 'src/stores/editor'

const editorStore = useEditorStore()

const modes = [
  {
    key: 'write',
    label: 'Write',
    icon: 'mdi-pencil',
    color: 'light-green-9'
  },
  {
    key: 'publish',
    label: 'Publish',
    icon: 'mdi-send',
    color: 'light-blue-9'
  },
  {
    key: 'review',
    label: 'Review',
    icon: 'mdi-file-document-check-outline',
    color: 'indigo-5'
  }
]
</script>

<style lang="scss">
.app-mode {
  flex: 0 0 45px;
  background-color: darken($dark-5, 5%);
  background-image: linear-gradient(to right, $dark-2, $dark-3);
  border-top: 1px solid $light-blue-5;
  padding: 5px;
  flex-direction: column;
  display: flex;

  > .q-btn {
    margin-bottom: 5px;
    padding: 15px 0;

    .q-btn__content {
      > i {
        font-size: 18px;
      }
      > span {
        margin-bottom: 12px;
        writing-mode: vertical-rl;
        text-orientation: mixed;
      }
    }
  }
}
</style>
