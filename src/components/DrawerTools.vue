<template lang="pug">
.q-px-md.q-pt-md.q-pb-sm
  .flex.items-center
    .text-caption.text-light-blue-3
      strong Validation Checks
    q-space
    q-btn(
      label='Run All'
      padding='none xs'
      size='sm'
      no-caps
      outline
      color='light-blue-3'
      @click='runAllChecks'
    )
q-list
  q-item(
    v-for='chk of valChecks'
    :key='chk.key'
    clickable
    @click='chk.click'
    )
    q-item-section(side)
      q-icon(:name='chk.icon' size='xs' color='amber')
    q-item-section
      q-item-label {{ chk.title }}
      q-item-label.text-amber(caption) {{ chk.description }}
    q-item-section(side)
      q-icon(v-if='editorStore.validationChecks[chk.key] === 0' name='mdi-circle-outline' size='xs' color='blue-grey')
      q-icon(v-else-if='editorStore.validationChecks[chk.key] === 1' name='mdi-check-circle' size='xs' color='positive')
      q-icon(v-else-if='editorStore.validationChecks[chk.key] === -1' name='mdi-close-circle' size='xs' color='red-5')
q-separator.q-my-sm(inset)
.q-px-md.q-pt-sm.q-pb-sm
  .flex.items-center
    .text-caption.text-light-blue-3
      strong Tools
q-list
  q-item(clickable @click='reindent')
    q-item-section(side)
      q-icon(name='mdi-page-previous-outline' size='xs' color='purple-2')
    q-item-section
      q-item-label Reindent
      q-item-label.text-purple-2(caption) Reformat Document Indentation
</template>

<script setup>
import { useQuasar } from 'quasar'
import { checkInclusiveLanguage } from 'src/tools/inclusive-language'
import { checkNonAscii } from 'src/tools/non-ascii'
import { useDocsStore } from 'src/stores/docs'
import { useEditorStore } from 'src/stores/editor'
import { modelStore } from 'src/stores/models'

const $q = useQuasar()

// STORES

const docsStore = useDocsStore()
const editorStore = useEditorStore()

const valChecks = [
  {
    key: 'inclusiveLanguage',
    title: 'Inclusive Language Check',
    description: 'Check for usage of non-inclusive terms',
    icon: 'mdi-atom-variant',
    click: () => inclusiveLangCheck()
  },
  {
    key: 'nonAscii',
    title: 'Non-ASCII Check',
    description: 'Check for non-ASCII characters',
    icon: 'mdi-translate',
    click: () => nonAsciiCheck()
  }
]

// METHODS

function inclusiveLangCheck (silent = false) {
  editorStore.errors = checkInclusiveLanguage(modelStore[docsStore.activeDocument.id].getValue())
  if (editorStore.errors.length < 1) {
    editorStore.setValidationCheckState('inclusiveLanguage', 1)
    if (!silent) {
      $q.notify({
        message: 'Looks good!',
        caption: 'No non-inclusive terms found.',
        color: 'positive',
        icon: 'mdi-atom-variant'
      })
    }
  } else {
    editorStore.setValidationCheckState('inclusiveLanguage', -1)
    if (!silent) {
      setTimeout(() => {
        EVENT_BUS.emit('editorCommand', 'editor.action.marker.next')
      })
    }
  }
}

function nonAsciiCheck (silent = false) {
  editorStore.errors = checkNonAscii(modelStore[docsStore.activeDocument.id].getValue())
  if (editorStore.errors.length < 1) {
    editorStore.setValidationCheckState('nonAscii', 1)
    if (!silent) {
      $q.notify({
        message: 'Looks good!',
        caption: 'No non-ASCII characters found.',
        color: 'positive',
        icon: 'mdi-translate'
      })
    }
  } else {
    editorStore.setValidationCheckState('nonAscii', -1)
    if (!silent) {
      setTimeout(() => {
        EVENT_BUS.emit('editorCommand', 'editor.action.marker.next')
      })
    }
  }
}

function runAllChecks () {
  inclusiveLangCheck(true)
  nonAsciiCheck(true)

  if (editorStore.errors.length < 1) {
    $q.notify({
      message: 'Looks good!',
      caption: 'No validation errors found.',
      color: 'positive',
      icon: 'mdi-check'
    })
  } else {
    setTimeout(() => {
      EVENT_BUS.emit('editorCommand', 'editor.action.marker.next')
    })
  }
}

function reindent () {
  EVENT_BUS.emit('lspCommand', 'formatting')
}
</script>
