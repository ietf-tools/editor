<template lang="pug">
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
</template>

<script setup>
import { useEditorStore } from 'src/stores/editor'

const editorStore = useEditorStore()

// STATE

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

</script>

<style lang="scss">

</style>
