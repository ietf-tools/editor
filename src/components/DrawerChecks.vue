<template lang="pug">
.q-px-md.q-pt-md.q-pb-sm
  .flex.items-center
    .text-caption.text-light-blue-3
      strong Validation Checks
    q-space
    q-btn.q-mr-sm(
      v-if='editorStore.validationChecksDirty'
      icon='mdi-close'
      padding='none'
      size='sm'
      no-caps
      flat
      color='light-blue-3'
      @click='editorStore.clearErrors'
      )
      q-tooltip Clear Validation Checks
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
      q-icon(v-else-if='editorStore.validationChecks[chk.key] === 2' name='mdi-information' size='xs' color='light-blue-5')
      q-icon(v-else-if='editorStore.validationChecks[chk.key] === -1' name='mdi-close-circle' size='xs' color='red-5')
      q-icon(v-else-if='editorStore.validationChecks[chk.key] === -2' name='mdi-alert-circle' size='xs' color='orange-5')
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { checkArticles } from 'src/tools/articles'
import { checkHyphenation } from 'src/tools/hyphenation'
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
    key: 'articles',
    title: 'Articles Check',
    description: 'Check for bad indefinite articles usage',
    icon: 'mdi-alpha-a-box-outline',
    click: () => articlesCheck()
  },
  {
    key: 'hyphenation',
    title: 'Hyphenation Check',
    description: 'Check for consistent usage of hyphenation',
    icon: 'mdi-line-scan',
    click: () => hyphenationCheck()
  },
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

function articlesCheck (silent) {
  const warnings = checkArticles(modelStore[docsStore.activeDocument.id].getValue())
  if (warnings < 1) {
    editorStore.setValidationCheckState('articles', 1)
    if (!silent) {
      $q.notify({
        message: 'Looks good!',
        caption: 'No bad usage of indefinite articles found.',
        color: 'positive',
        icon: 'mdi-alpha-a-box-outline'
      })
    }
  } else {
    editorStore.setValidationCheckState('articles', -2)
  }
}

function hyphenationCheck (silent = false) {
  const occurences = checkHyphenation(modelStore[docsStore.activeDocument.id].getValue())
  if (occurences < 1) {
    editorStore.setValidationCheckState('hyphenation', 1)
    if (!silent) {
      $q.notify({
        message: 'Looks good!',
        caption: 'Hyphenation is consistent.',
        color: 'positive',
        icon: 'mdi-atom-variant'
      })
    }
  } else {
    editorStore.setValidationCheckState('hyphenation', -2)
  }
}

function inclusiveLangCheck (silent = false) {
  const warnings = checkInclusiveLanguage(modelStore[docsStore.activeDocument.id].getValue())
  if (warnings < 1) {
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
    editorStore.setValidationCheckState('inclusiveLanguage', -2)
  }
}

function nonAsciiCheck (silent = false) {
  const infos = checkNonAscii(modelStore[docsStore.activeDocument.id].getValue())
  if (infos < 1) {
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
    editorStore.setValidationCheckState('nonAscii', 2)
  }
}

function runAllChecks () {
  editorStore.clearErrors()
  articlesCheck(true)
  hyphenationCheck(true)
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
      EVENT_BUS.emit('editorAction', 'markerNext')
    })
  }
}

// MOUNTED

onMounted(() => {
  EVENT_BUS.on('runAllChecks', runAllChecks)
})
onBeforeUnmount(() => {
  EVENT_BUS.off('runAllChecks')
})
</script>
