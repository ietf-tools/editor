<template lang="pug">
q-page.row.items-stretch
  .col-12(
    ref='monacoContainer'
    :class='{ "col-lg-6": editorStore.previewPaneShown }'
    )
  .col-12.col-lg-6(
    v-if='editorStore.previewPaneShown'
    :class='editorStore.isDarkTheme ? `bg-dark-5 text-white` : `bg-grey-2 text-black`'
    )
    .q-ma-lg Preview
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as monaco from 'monaco-editor'
import { debounce } from 'lodash-es'
import { DateTime } from 'luxon'
import { checkNits } from '@ietf-tools/idnits'
import { modelStore } from 'src/stores/models'

import { useEditorStore } from 'stores/editor'
import { useDocsStore } from 'src/stores/docs'

// STORES

const docsStore = useDocsStore()
const editorStore = useEditorStore()

// ROUTER

const router = useRouter()

watch(() => docsStore.active, (newValue) => {
  if (!newValue) {
    router.replace('/')
    editorStore.drawerPane = 'DrawerFiles'
  }
})

// MONACO

const monacoContainer = ref(null)
let editor = null

monaco.languages.register({ id: 'xmlrfc' })
monaco.languages.setMonarchTokensProvider('xmlrfc', {
  defaultToken: 'invalid',
  tokenPostfix: '.xml',
  qualifiedName: /(?:[\w.-]+:)?[\w.-]+/,
  tokenizer: {
    root: [
      [/[^<&]+/, ''],
      { include: '@whitespace' },

      // Standard opening tag
      [/(<)(@qualifiedName)/, [{ token: 'delimiter' }, { token: 'tag', next: '@tag' }]],

      // Standard closing tag
      [
        /(<\/)(@qualifiedName)(\s*)(>)/,
        [{ token: 'delimiter' }, { token: 'tag' }, '', { token: 'delimiter' }]
      ],

      // Meta tags - instruction
      [/(<\?)(@qualifiedName)/, [{ token: 'delimiter' }, { token: 'metatag', next: '@tag' }]],

      // Meta tags - declaration
      [/(<!)(@qualifiedName)/, [{ token: 'delimiter' }, { token: 'metatag', next: '@tag' }]],

      // CDATA
      [/<!\[CDATA\[/, { token: 'delimiter.cdata', next: '@cdata' }],

      [/&\w+;/, 'string.escape']
    ],

    cdata: [
      [/[^\]]+/, ''],
      [/\]\]>/, { token: 'delimiter.cdata', next: '@pop' }],
      [/\]/, '']
    ],

    tag: [
      [/[ \t\r\n]+/, ''],
      [/(@qualifiedName)(\s*=\s*)("[^"]*"|'[^']*')/, ['attribute.name', '', 'attribute.value']],
      [
        /(@qualifiedName)(\s*=\s*)("[^">?/]*|'[^'>?/]*)(?=[?/]>)/,
        ['attribute.name', '', 'attribute.value']
      ],
      [/(@qualifiedName)(\s*=\s*)("[^">]*|'[^'>]*)/, ['attribute.name', '', 'attribute.value']],
      [/@qualifiedName/, 'attribute.name'],
      [/\?>/, { token: 'delimiter', next: '@pop' }],
      [/(\/)(>)/, [{ token: 'tag' }, { token: 'delimiter', next: '@pop' }]],
      [/>/, { token: 'delimiter', next: '@pop' }]
    ],

    whitespace: [
      [/[ \t\r\n]+/, ''],
      [/<!--/, { token: 'comment', next: '@comment' }]
    ],

    comment: [
      [/[^<-]+/, 'comment.content'],
      [/-->/, { token: 'comment', next: '@pop' }],
      [/<!--/, 'comment.content.invalid'],
      [/[<-]/, 'comment.content']
    ]
  }
})
monaco.languages.setLanguageConfiguration('xmlrfc', {
  indentationRules: {
    increaseIndentPattern: /<(?!\?|[^>]*\/>)([-_.A-Za-z0-9]+)(?=\s|>)\b[^>]*>(?!.*<\/\1>)|<!--(?!.*-->)|\{[^}"']*$/,
    decreaseIndentPattern: /^\s*(<\/(?!html)[-_.A-Za-z0-9]+\b[^>]*>|-->|})/
  }
})
// Allow `*` in word pattern for quick styling (toggle bold/italic without selection)
// original https://github.com/microsoft/vscode/blob/3e5c7e2c570a729e664253baceaf443b69e82da6/extensions/markdown-basics/language-configuration.json#L55
monaco.languages.setLanguageConfiguration('markdown', {
  wordPattern: /([*_]{1,2}|~~|`+)?[\p{Alphabetic}\p{Number}\p{Nonspacing_Mark}]+(_+[\p{Alphabetic}\p{Number}\p{Nonspacing_Mark}]+)*\1/gu
})

const updateContentStore = debounce(ev => {
  docsStore.activeDocument.isModified = modelStore[docsStore.activeDocument.id].getValue() !== docsStore.activeDocument.data
  docsStore.activeDocument.lastModifiedAt = DateTime.utc()
}, 500)

onMounted(async () => {
  setTimeout(() => {
    // -> Define Monaco Theme
    monaco.editor.defineTheme('ietf-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#070a0d',
        'editor.lineHighlightBackground': '#0d1117',
        'editorLineNumber.foreground': '#546e7a',
        'editorGutter.background': '#0d1117'
      }
    })
    monaco.editor.defineTheme('ietf-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {}
    })

    // -> Initialize Monaco editor
    editor = monaco.editor.create(monacoContainer.value, {
      automaticLayout: true,
      cursorStyle: editorStore.cursorStyle,
      cursorBlinking: editorStore.cursorBlinking,
      fontSize: editorStore.fontSize,
      formatOnType: editorStore.formatOnType,
      language: 'xmlrfc',
      lineNumbersMinChars: 4,
      model: modelStore[docsStore.activeDocument.id],
      padding: { top: 10, bottom: 10 },
      scrollBeyondLastLine: false,
      stickyScroll: {
        enabled: true
      },
      tabSize: editorStore.tabSize,
      theme: editorStore.theme,
      wordWrap: editorStore.wordWrap ? 'on' : 'off'
    })

    // -> Handle content change
    editor.onDidChangeModelContent((ev) => {
      // console.info(ev)
      if (editorStore.errors.length > 0) {
        editorStore.errors = []
      }
      updateContentStore(ev)
      window.ipcBridge.emit('lspSendNotification', {
        method: 'textDocument/didChange',
        params: {
          textDocument: {
            uri: `${docsStore.activeDocument.uri}`, // interpolation required for correct var cloning
            version: 1
          },
          contentChanges: ev.changes.map(chg => ({
            range: {
              start: {
                line: chg.range.startLineNumber + 1,
                character: chg.range.startColumn + 1
              },
              end: {
                line: chg.range.endLineNumber + 1,
                character: chg.range.endColumn + 1
              }
            },
            rangeLength: chg.rangeLength,
            text: chg.text
            // text: editor.getValue()
          }))
        }
      })
    })

    // -> Handle cursor movement
    editor.onDidChangeCursorPosition(ev => {
      editorStore.$patch({
        line: editor.getPosition().lineNumber,
        col: editor.getPosition().column
      })
    })

    // Code Lens
    // const commandId = editor.addCommand(
    //   0,
    //   function () {
    //     // services available in `ctx`
    //     alert('my command is executing!')
    //   },
    //   ''
    // )

    // monaco.languages.registerCodeLensProvider('xmlrfc', {
    //   provideCodeLenses: function (model, token) {
    //     return {
    //       lenses: [
    //         {
    //           range: {
    //             startLineNumber: 12,
    //             startColumn: 1,
    //             endLineNumber: 13,
    //             endColumn: 1
    //           },
    //           id: 'First Line',
    //           command: {
    //             id: commandId,
    //             title: 'Code Lens Test'
    //           }
    //         }
    //       ],
    //       dispose: () => { }
    //     }
    //   },
    //   resolveCodeLens: function (model, codeLens, token) {
    //     return codeLens
    //   }
    // })

    // -> Post init
    editor.focus()
  }, 500)

  // WATCHERS

  watch(() => docsStore.active, (newValue) => {
    if (newValue && editor) {
      editor.setModel(modelStore[docsStore.activeDocument.id])
    }
  })

  if (docsStore.opened.length < 1) {
    docsStore.loadDocument({ isDefault: true })
  }

  watch(() => editorStore.cursorStyle, (newValue) => {
    if (newValue && editor) {
      editor.updateOptions({ cursorStyle: newValue })
    }
  })
  watch(() => editorStore.cursorBlinking, (newValue) => {
    if (newValue && editor) {
      editor.updateOptions({ cursorBlinking: newValue })
    }
  })
  watch(() => editorStore.fontSize, (newValue) => {
    if (newValue && editor) {
      editor.updateOptions({ fontSize: newValue })
    }
  })
  watch(() => editorStore.formatOnType, (newValue) => {
    if (editor) {
      editor.updateOptions({ formatOnType: newValue })
    }
  })
  watch(() => editorStore.tabSize, (newValue) => {
    if (newValue && editor) {
      editor.updateOptions({ tabSize: newValue })
    }
  })
  watch(() => editorStore.theme, (newValue) => {
    if (newValue && editor) {
      editor.updateOptions({ theme: newValue })
    }
  })
  watch(() => editorStore.wordWrap, (newValue) => {
    if (editor) {
      editor.updateOptions({ wordWrap: newValue ? 'on' : 'off' })
    }
    window.ipcBridge.emit('setMenuItemCheckedState', {
      id: 'viewWordWrap',
      value: newValue
    })
  })
  watch(() => editorStore.previewPaneShown, (newValue) => {
    window.ipcBridge.emit('setMenuItemCheckedState', {
      id: 'viewShowPreviewPane',
      value: newValue
    })
  })

  watch(() => editorStore.errors, (newValue) => {
    if (newValue && newValue.length > 0) {
      monaco.editor.setModelMarkers(modelStore[docsStore.activeDocument.id], 'errors', newValue)
    } else {
      monaco.editor.removeAllMarkers('errors')
    }
  })

  window.ipcBridge.subscribe('editorAction', (evt, action) => {
    switch (action) {
      case 'addCursorAbove': {
        editor.focus()
        setTimeout(() => {
          editor.trigger('menu', 'editor.action.insertCursorAbove')
        })
        break
      }
      case 'addCursorBelow': {
        editor.focus()
        setTimeout(() => {
          editor.trigger('menu', 'editor.action.insertCursorBelow')
        })
        break
      }
      case 'addCursorsToLineEnds': {
        editor.focus()
        setTimeout(() => {
          editor.trigger('menu', 'editor.action.insertCursorAtEndOfEachLineSelected')
        })
        break
      }
      case 'addNextOccurence': {
        editor.focus()
        setTimeout(() => {
          editor.trigger('menu', 'editor.action.addSelectionToNextFindMatch')
        })
        break
      }
      case 'addPreviousOccurence': {
        editor.focus()
        setTimeout(() => {
          editor.trigger('menu', 'editor.action.addSelectionToPreviousFindMatch')
        })
        break
      }
      case 'checkIdNits': {
        validateContent()
        break
      }
      case 'commandPalette': {
        editor.focus()
        setTimeout(() => {
          editor.trigger('menu', 'editor.action.quickCommand')
        })
        break
      }
      case 'copyLineDown': {
        editor.focus()
        setTimeout(() => {
          editor.trigger('menu', 'editor.action.copyLinesDownAction')
        })
        break
      }
      case 'copyLineUp': {
        editor.focus()
        setTimeout(() => {
          editor.trigger('menu', 'editor.action.copyLinesUpAction')
        })
        break
      }
      case 'duplicateSelection': {
        editor.focus()
        setTimeout(() => {
          editor.trigger('menu', 'editor.action.duplicateSelection')
        })
        break
      }
      case 'expandSelection': {
        editor.focus()
        setTimeout(() => {
          editor.trigger('menu', 'editor.action.smartSelect.expand')
        })
        break
      }
      case 'find': {
        editor.trigger('menu', 'actions.find')
        break
      }
      case 'findAndReplace': {
        editor.trigger('menu', 'editor.action.startFindReplaceAction')
        break
      }
      case 'findNext': {
        editor.trigger('menu', 'editor.action.nextMatchFindAction')
        break
      }
      case 'findPrevious': {
        editor.trigger('menu', 'editor.action.previousMatchFindAction')
        break
      }
      case 'moveLineDown': {
        editor.focus()
        setTimeout(() => {
          editor.trigger('menu', 'editor.action.moveLinesDownAction')
        })
        break
      }
      case 'moveLineUp': {
        editor.focus()
        setTimeout(() => {
          editor.trigger('menu', 'editor.action.moveLinesUpAction')
        })
        break
      }
      case 'previewPane': {
        editorStore.previewPaneShown = !editorStore.previewPaneShown
        break
      }
      case 'redo': {
        editor.trigger('menu', 'redo')
        editor.focus()
        break
      }
      case 'selectAll': {
        editor.focus()
        setTimeout(() => {
          const range = editor.getModel().getFullModelRange()
          editor.setSelection(range)
        })
        break
      }
      case 'selectAllOccurences': {
        editor.focus()
        setTimeout(() => {
          editor.trigger('menu', 'editor.action.selectHighlights')
        })
        break
      }
      case 'shrinkSelection': {
        editor.focus()
        setTimeout(() => {
          editor.trigger('menu', 'editor.action.smartSelect.shrink')
        })
        break
      }
      case 'undo': {
        editor.trigger('menu', 'undo')
        editor.focus()
        break
      }
      case 'wordWrap': {
        editorStore.wordWrap = !editorStore.wordWrap
        break
      }
      case 'zoomIn': {
        editor.focus()
        setTimeout(() => {
          editor.trigger('menu', 'editor.action.fontZoomIn')
        })
        break
      }
      case 'zoomOut': {
        editor.focus()
        setTimeout(() => {
          editor.trigger('menu', 'editor.action.fontZoomOut')
        })
        break
      }
      case 'zoomReset': {
        editor.focus()
        setTimeout(() => {
          editor.trigger('menu', 'editor.action.fontZoomReset')
        })
        break
      }
    }
  })

  document.getElementById('app-loading')?.remove()
})
EVENT_BUS.on('editorCommand', cmd => {
  editor.trigger('drawer', cmd)
})
EVENT_BUS.on('lspCommand', async cmd => {
  switch (cmd) {
    case 'formatting': {
      try {
        const resp = await window.ipcBridge.lspSendRequest('textDocument/formatting', {
          textDocument: {
            uri: `${docsStore.activeDocument.uri}` // interpolation required for correct var cloning
          },
          options: {
            tabSize: editorStore.tabSize ?? 2,
            insertSpaces: true,
            trimTrailingWhitespace: true,
            insertFinalNewline: true,
            trimFinalNewlines: true
          }
        })
        editor.getModel().pushEditOperations([], resp.map(op => ({
          range: {
            endColumn: op.range.end.character + 1,
            endLineNumber: op.range.end.line + 1,
            startColumn: op.range.start.character + 1,
            startLineNumber: op.range.start.line + 1
          },
          text: op.newText
        })), () => null)
        editor.getModel().pushStackElement()
      } catch (err) {
        console.warn(err)
      }
      break
    }
  }
})

async function validateContent () {
  const enc = new TextEncoder()
  const result = await checkNits(enc.encode(editorStore.content).buffer, 'draft-ietf-ccamp-mw-topo-yang-08.xml', {
    mode: 'normal',
    offline: false
  })
  console.info(result)
}
</script>
