<template lang="pug">
q-footer
  q-bar.welcome-footer-bar(
    v-if='!docsStore.active'
    :class='{ "has-mode-sd": editorStore.modeSidebarShown }'
    )
    q-space
    span.text-caption.text-blue-grey-3 DraftForge
    q-space
  .footer-bar(
    v-else
    :class='{ "has-mode-sd": editorStore.modeSidebarShown }'
    )
    .footer-bar-item
      span.text-caption {{ docType }}
    .footer-bar-separator
    .footer-bar-item(:class='editorStore.schemaValidationErrors ? `negative` : `positive`')
      template(v-if='editorStore.schemaValidationErrors')
        q-icon.q-mr-sm(name='mdi-close-octagon' size='14px')
        span.text-caption: em {{ editorStore.schemaValidationErrors }} Schema Errors
      template(v-else)
        q-icon.q-mr-sm(name='mdi-check' size='14px')
        span.text-caption: em Valid Schema
    .footer-bar-item(v-if='editorStore.validationChecksDirty', :class='editorStore.hasErrors ? `negative` : `positive`')
      template(v-if='editorStore.hasErrors')
        q-btn(
          padding="xs sm"
          flat
          no-caps
          color='white'
          @click='showNextError'
          )
          q-icon.q-mr-sm(name='mdi-alert-box' size='xs')
          span.text-caption #[strong {{ editorStore.errors.length }}] {{ editorStore.errors.length > 1 ? 'errors/warnings' : 'error/warning' }} found
          q-tooltip Show Next Error
        q-btn.q-ml-sm(
          padding="none sm"
          outline
          no-caps
          size='sm'
          color='white'
          label='Clear'
          @click='editorStore.clearErrors'
          )
      template(v-else)
        q-icon.q-mr-sm(name='mdi-check' size='14px')
        span.text-caption: em Validation Checks Pass
    .footer-bar-item(v-else)
      q-icon.q-mr-sm(name='mdi-tools' size='14px')
      span.text-caption: em Validation Checks:
      q-btn.q-ml-sm(
        padding="none sm"
        unelevated
        no-caps
        size='sm'
        color='blue-grey-7'
        text-color='blue-grey-2'
        label='Run All'
        @click='runAllChecks'
      )
    .footer-bar-space
    .footer-bar-item
      span.text-caption Ln {{ editorStore.line }}, Col {{ editorStore.col }}
    .footer-bar-separator
    .footer-bar-item
      span.text-caption Spaces: {{ editorStore.tabSize }}
    .footer-bar-separator
    .footer-bar-item
      span.text-caption UTF-8
</template>

<script setup>
import { computed, nextTick } from 'vue'

import { useDocsStore } from 'src/stores/docs'
import { useEditorStore } from 'src/stores/editor'

// STORES

const docsStore = useDocsStore()
const editorStore = useEditorStore()

// COMPUTED

const docType = computed(() => {
  switch (docsStore.activeDocument.type) {
    case 'xml':
      return 'RFC XML v3'
    case 'md':
      return 'Markdown'
    case 'txt':
      return 'Plain Text'
    default:
      return 'Unknown Format'
  }
})

// METHODS

function showNextError () {
  EVENT_BUS.emit('editorAction', 'markerNext')
}

function runAllChecks () {
  editorStore.drawerPane = 'DrawerChecks'
  nextTick(() => {
    EVENT_BUS.emit('runAllChecks')
  })
}
</script>

<style lang="scss">
.welcome-footer-bar, .footer-bar {
  &.has-mode-sd {
    border-left: 1px solid lighten($dark-1, 10%);
  }
}
.welcome-footer-bar {
  background-color: $dark-3;
  height: 40px;
}
.footer-bar {
  background-color: $dark-2;
  display: flex;
  height: 40px;

  &-item {
    border-top: 5px solid $dark-1;
    border-bottom: 1px solid $dark-7;
    height: 39px;
    padding: 0 15px 1px;
    display: flex;
    align-items: center;
    color: $blue-grey-3;
    box-sizing: border-box;

    &.negative {
      background-color: $red-9;
      border-top-color: $red-6;
      border-left: 1px solid $red-7;
      border-right: 1px solid darken($red-10, 5%);
      color: $red-2;
    }
    &.positive {
      background-color: $green-9;
      border-top-color: $green-6;
      border-left: 1px solid $green-8;
      border-right: 1px solid darken($green-10, 5%);
      color: $green-2;
    }
  }

  &-separator {
    border-left: 1px solid $dark-1;
    border-right: 1px solid $dark-4;
  }

  &-space {
    border-top: 5px solid $dark-1;
    flex-grow: 1;
  }
}
</style>
