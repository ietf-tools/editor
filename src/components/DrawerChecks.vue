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
      @click='clearErrors'
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
      q-menu(touch-position context-menu auto-close)
        q-list.bg-dark-1(separator)
          q-item(clickable, @click='resetIgnores(chk.key)')
            q-item-section(side)
              q-icon(name='mdi-cancel' size='xs' color='amber')
            q-item-section Reset all ignores for this check
    q-expansion-item.bg-dark-5(
      v-if='editorStore.validationChecksDetails[chk.key].count > 0'
      group='checks'
      dense
      @show='setCurrentCheck(chk.key)'
      )
      template(#header)
        q-item-section.q-pl-sm
          .flex.items-center
            q-item-label.text-purple-2 └─ {{ editorStore.validationChecksDetails[chk.key].count }} issues
      .bg-dark-5.checkdetails
        q-list(dense, separator)
          q-item
            q-item-section
              .flex
                q-btn.q-mr-sm(
                  label='Reset Ignores'
                  padding='none xs'
                  size='sm'
                  no-caps
                  outline
                  color='purple-3'
                  @click='resetIgnores(chk.key)'
                )
                q-space
                q-btn.q-mr-sm(
                  label='Save to File'
                  padding='none xs'
                  size='sm'
                  no-caps
                  outline
                  color='purple-3'
                  @click='saveResultsToFile(chk.key)'
                  :disabled='!editorStore.validationChecksDetails[chk.key].hasTextOutput'
                )
                q-btn(
                  label='Copy to Clipboard'
                  padding='none xs'
                  size='sm'
                  no-caps
                  outline
                  color='purple-3'
                  @click='copyResultsToClipboard(chk.key)'
                  :disabled='!editorStore.validationChecksDetails[chk.key].hasTextOutput'
                )
          q-item(
            v-for='dtl of editorStore.validationChecksDetails[chk.key].details'
            :key='dtl.key'
            clickable
            @click='goToPosition(dtl.range)'
            )
            q-item-section(v-if='dtl.group', side)
              q-badge(color='purple' text-color='white' :label='dtl.group')
            q-item-section.text-caption {{ dtl.message }}
            q-item-section(side)
              q-badge(v-if='dtl.range',color='dark-3' text-color='white') {{ dtl.range.startLineNumber + ":" + dtl.range.startColumn }} #[q-icon.q-ml-xs(name='mdi-dots-horizontal')]
              q-btn(v-else color='dark-3' text-color='white' icon='mdi-dots-horizontal' padding='none xs' size='xs' unelevated)
              q-menu(self='top left', anchor='top right' auto-close)
                q-list.bg-dark-1(separator)
                  q-item(clickable, @click='ignoreCheck(chk.key, dtl.value)')
                    q-item-section(side)
                      q-icon(name='mdi-playlist-remove' size='xs' color='purple-2')
                    q-item-section Ignore "{{ dtl.value }}" for this document
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { checkArticles } from 'src/tools/articles'
import { checkRepeatedWords } from 'src/tools/repeated-words'
import { checkHyphenation } from 'src/tools/hyphenation'
import { checkInclusiveLanguage } from 'src/tools/inclusive-language'
import { checkNonAscii } from 'src/tools/non-ascii'
import { checkCommonPlaceholders } from 'src/tools/placeholders'
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
  },
  {
    key: 'placeholders',
    title: 'Placeholders Check',
    description: 'Check for common placeholders',
    icon: 'mdi-select-remove',
    click: () => placeholdersCheck()
  },
  {
    key: 'repeatedWords',
    title: 'Repeated Words Check',
    description: 'Check for accidental repeated terms',
    icon: 'mdi-repeat',
    click: () => repeatedWordsCheck()
  }
]

// IGNORES METHODS

function resetIgnores (key) {
  if (docsStore.activeDocument.extra?.checks?.[key]?.ignores) {
    docsStore.activeDocument.extra.checks[key].ignores = []
  }
  $q.notify({
    message: 'Ignores cleared!',
    caption: 'All ignores for this check have been reset.',
    color: 'positive',
    icon: 'mdi-playlist-remove'
  })
}

function ignoreCheck (key, value) {
  if (!docsStore.activeDocument.extra.checks) {
    docsStore.activeDocument.extra.checks = {}
  }
  if (!docsStore.activeDocument.extra.checks[key]) {
    docsStore.activeDocument.extra.checks[key] = {}
  }
  if (!docsStore.activeDocument.extra.checks[key].ignores) {
    docsStore.activeDocument.extra.checks[key].ignores = [value]
  } else if (docsStore.activeDocument.extra.checks[key].ignores.includes(value)) {
    $q.notify({
      message: 'Ignore already added.',
      caption: 'Run the validation check again to use it.',
      color: 'orange-8',
      icon: 'mdi-alert'
    })
    return
  } else {
    docsStore.activeDocument.extra.checks[key].ignores.push(value)
  }
  $q.notify({
    message: 'Ignore added!',
    caption: 'Run the validation check again to use it.',
    color: 'positive',
    icon: 'mdi-playlist-plus'
  })
}

function getIgnores (key) {
  return docsStore.activeDocument.extra?.checks?.[key]?.ignores ?? []
}

// VALIDATION METHODS

function articlesCheck (silent) {
  const results = checkArticles(modelStore[docsStore.activeDocument.id].getValue(), getIgnores('articles'))
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
    editorStore.setValidationCheckDetails('articles', results)
  }
}

function hyphenationCheck (silent = false) {
  const results = checkHyphenation(modelStore[docsStore.activeDocument.id].getValue(), getIgnores('hyphenation'))
  if (results.count < 1) {
    editorStore.setValidationCheckState('hyphenation', 1)
    editorStore.setValidationCheckDetails('hyphenation', [])
    if (!silent) {
      $q.notify({
        message: 'Looks good!',
        caption: 'Hyphenation is consistent.',
        color: 'positive',
        icon: 'mdi-line-scan'
      })
    }
  } else {
    editorStore.setValidationCheckState('hyphenation', -2)
    editorStore.setValidationCheckDetails('hyphenation', results)
  }
}

function inclusiveLangCheck (silent = false) {
  const results = checkInclusiveLanguage(modelStore[docsStore.activeDocument.id].getValue(), getIgnores('inclusiveLanguage'))
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
    editorStore.setValidationCheckDetails('inclusiveLanguage', results)
  }
}

function nonAsciiCheck (silent = false) {
  const infos = checkNonAscii(modelStore[docsStore.activeDocument.id].getValue(), getIgnores('nonAscii'))
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

function placeholdersCheck (silent = false) {
  const results = checkCommonPlaceholders(modelStore[docsStore.activeDocument.id].getValue(), getIgnores('placeholders'))
  if (results.count < 1) {
    editorStore.setValidationCheckState('placeholders', 1)
    editorStore.setValidationCheckDetails('placeholders', [])
    if (!silent) {
      $q.notify({
        message: 'Looks good!',
        caption: 'No common placeholders found.',
        color: 'positive',
        icon: 'mdi-select-remove'
      })
    }
  } else {
    editorStore.setValidationCheckState('placeholders', -2)
    editorStore.setValidationCheckDetails('placeholders', results)
  }
}

function repeatedWordsCheck (silent) {
  const results = checkRepeatedWords(modelStore[docsStore.activeDocument.id].getValue(), getIgnores('repeatedWords'))
  if (results.count < 1) {
    editorStore.setValidationCheckState('repeatedWords', 1)
    editorStore.setValidationCheckDetails('repeatedWords', [])
    if (!silent) {
      $q.notify({
        message: 'Looks good!',
        caption: 'No repeated terms found.',
        color: 'positive',
        icon: 'mdi-repeat'
      })
    }
  } else {
    editorStore.setValidationCheckState('repeatedWords', -2)
    editorStore.setValidationCheckDetails('repeatedWords', results)
  }
}

function runAllChecks () {
  editorStore.clearErrors()
  articlesCheck(true)
  hyphenationCheck(true)
  inclusiveLangCheck(true)
  nonAsciiCheck(true)
  placeholdersCheck(true)
  repeatedWordsCheck(true)

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

function runSelectedCheck (key) {
  switch (key) {
    case 'articles':
      articlesCheck(true)
      break
    case 'hyphenation':
      hyphenationCheck(true)
      break
    case 'inclusiveLang':
      inclusiveLangCheck(true)
      break
    case 'nonAscii':
      nonAsciiCheck(true)
      break
    case 'placeholders':
      placeholdersCheck(true)
      break
    case 'repeatedWords':
      repeatedWordsCheck(true)
      break
  }
}

function goToPosition (range) {
  EVENT_BUS.emit('revealPosition', {
    lineNumber: range.startLineNumber,
    column: range.startColumn
  })
}

function clearErrors () {
  editorStore.clearErrors()
  editorStore.validationChecksCurrent = null
}

function setCurrentCheck (key) {
  editorStore.validationChecksCurrent = key
}

// Validation Results Output

async function saveResultsToFile (key) {
  // -> Build file path from current document + key of the validation check
  let filePath = docsStore.activeDocument.path
  const extPosition = filePath.lastIndexOf('.')
  if (extPosition >= 0) {
    filePath = filePath.slice(0, extPosition)
  }
  filePath = `${filePath}-${key}.txt`

  if (await window.ipcBridge.saveContentToFile(editorStore.validationChecksDetails[key].getTextOutput(), filePath, 'Save Validation Results As...')) {
    $q.notify({
      message: 'Results saved!',
      caption: 'Results have been saved to file successfully.',
      color: 'positive',
      icon: 'mdi-content-save-check-outline'
    })
  }
}

function copyResultsToClipboard (key) {
  window.ipcBridge.emit('writeToClipboard', {
    text: editorStore.validationChecksDetails[key].getTextOutput()
  })
  $q.notify({
    message: 'Results copied!',
    caption: 'Results have been copied to the clipboard successfully.',
    color: 'positive',
    icon: 'mdi-clipboard'
  })
}
// MOUNTED

onMounted(() => {
  EVENT_BUS.on('runSelectedCheck', runSelectedCheck)
  EVENT_BUS.on('runAllChecks', runAllChecks)
})
onBeforeUnmount(() => {
  EVENT_BUS.off('runSelectedCheck')
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
