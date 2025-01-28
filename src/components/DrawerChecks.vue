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
  template(v-for='chk of valChecks' :key='chk.key')
    q-item(
      @click='chk.click'
      clickable
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
    q-expansion-item.bg-dark-5(
      v-if='editorStore.validationChecksDetails[chk.key].length > 0'
      )
      template(#header)
        q-item-section.q-pl-md
          q-item-label.text-purple-2 └─ {{ editorStore.validationChecksDetails[chk.key].length }} issues
      .bg-dark-5.checkdetails
        q-list(dense, separator)
          q-item(
            v-for='dtl of editorStore.validationChecksDetails[chk.key]'
            :key='dtl.key'
            clickable
            @click='goToPosition(dtl.range)'
            )
            q-item-section(v-if='dtl.group', side)
              q-badge(color='blue-9' text-color='white' :label='dtl.group')
            q-item-section.text-caption {{ dtl.message }}
            q-item-section(v-if='dtl.range', side)
              q-badge(color='dark-3' text-color='white' :label='dtl.range.startLineNumber + ":" + dtl.range.startColumn')
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
  const results = checkArticles(modelStore[docsStore.activeDocument.id].getValue())
  if (results.count < 1) {
    editorStore.setValidationCheckState('articles', 1)
    editorStore.setValidationCheckDetails('articles', [])
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
    editorStore.setValidationCheckDetails('articles', results.details)
  }
}

function hyphenationCheck (silent = false) {
  const results = checkHyphenation(modelStore[docsStore.activeDocument.id].getValue())
  if (results.count < 1) {
    editorStore.setValidationCheckState('hyphenation', 1)
    editorStore.setValidationCheckDetails('hyphenation', [])
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
    editorStore.setValidationCheckDetails('hyphenation', results.details)
  }
}

function inclusiveLangCheck (silent = false) {
  const results = checkInclusiveLanguage(modelStore[docsStore.activeDocument.id].getValue())
  if (results.count < 1) {
    editorStore.setValidationCheckState('inclusiveLanguage', 1)
    editorStore.setValidationCheckDetails('inclusiveLanguage', [])
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
    editorStore.setValidationCheckDetails('inclusiveLanguage', results.details)
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

function goToPosition (range) {
  EVENT_BUS.emit('revealPosition', {
    lineNumber: range.startLineNumber,
    column: range.startColumn
  })
}

// MOUNTED

onMounted(() => {
  EVENT_BUS.on('runAllChecks', runAllChecks)
})
onBeforeUnmount(() => {
  EVENT_BUS.off('runAllChecks')
})
</script>

<style lang="scss">
.checkdetails {
  border-top: 1px solid rgba(255, 255, 255, 10%);
  border-bottom: 1px solid #000;
  padding: 3px 0;
  box-shadow: 0 1px 0 0 rgba(255,255,255, 10%);
}
</style>
