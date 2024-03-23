<template lang="pug">
.app-mode
  q-btn.full-width(
    icon='mdi-home'
    size='sm'
    unelevated
    :color='currentMode === `welcome` ? `blue-grey` : `dark-1`'
    dense
    :to='{ name: `welcome` }'
    )
  q-btn.full-width(
    v-for='mode of modes'
    :key='mode.key'
    :icon-right='mode.icon'
    unelevated
    :color='currentMode === mode.key ? mode.color : `dark-1`'
    dense
    stack
    :label='mode.label'
    no-caps
    :to='mode.target'
    :disable='mode.needDocument && !docsStore.active'
    )
    q-tooltip(anchor='center right' self='center left') {{ mode.label }} Mode
</template>

<script setup>
import { computed } from 'vue'
import { useDocsStore } from 'src/stores/docs'
import { useRoute } from 'vue-router'

const docsStore = useDocsStore()

const route = useRoute()

const currentMode = computed(() => {
  if (route.name === 'editor') {
    if (route.query.mode === 'review') {
      return 'review'
    }
    return 'write'
  } else {
    return route.name
  }
})

const modes = [
  {
    key: 'write',
    label: 'Write',
    icon: 'mdi-pencil',
    color: 'light-blue-9',
    target: { name: 'editor', query: { mode: 'write' } },
    needDocument: true
  },
  {
    key: 'review',
    label: 'Review',
    icon: 'mdi-file-document-check-outline',
    color: 'indigo-5',
    target: { name: 'editor', query: { mode: 'review' } },
    needDocument: true
  },
  {
    key: 'submit',
    label: 'Submit',
    icon: 'mdi-send',
    color: 'light-green-9',
    target: { name: 'submit' }
  }
]
</script>

<style lang="scss">
.app-mode {
  flex: 0 0 45px;
  background-color: darken($dark-5, 5%);
  background-image: linear-gradient(to right, $dark-2, $dark-3);
  border-top: 1px solid $blue-grey-5;
  padding: 5px;
  flex-direction: column;
  display: flex;

  @at-root .route-editor & {
    border-top-color: $light-blue-5;
  }
  @at-root .route-review & {
    border-top-color: $indigo-3;
  }
  @at-root .route-submit & {
    border-top-color: $light-green-5;
  }

  > .q-btn:first-child {
    margin-bottom: 5px;
    padding: 8px 0;
  }

  > .q-btn:not(:first-child) {
    margin-bottom: 5px;
    padding: 15px 0;

    &:nth-child(2) {
      border-bottom: 2px solid $light-blue-6;
    }
    &:nth-child(3) {
      border-bottom: 2px solid $indigo-3;
    }
    &:nth-child(4) {
      border-bottom: 2px solid $light-green;
    }

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
