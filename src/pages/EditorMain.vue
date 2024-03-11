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
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as monaco from 'monaco-editor'
import { debounce } from 'lodash-es'
import { DateTime } from 'luxon'
import { checkNits } from '@ietf-tools/idnits'
import { modelStore } from 'src/stores/models'
import * as lspHelpers from 'src/helpers/lsp'

import { useEditorStore } from 'stores/editor'
import { useDocsStore } from 'src/stores/docs'

// STORES

const docsStore = useDocsStore()
const editorStore = useEditorStore()

// ROUTER

const router = useRouter()

watch(() => docsStore.active, (newValue) => {
  if (!newValue) {
    editorStore.drawerPane = 'DrawerFiles'
    router.replace('/')
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

monaco.languages.registerCompletionItemProvider('xmlrfc', {
  triggerCharacters: ['.', ':', '<', '"', '=', '/', '\\', '?', "'", '&', '#'],
  provideCompletionItems: async (model, pos, ctx, cancelToken) => {
    const completionInfo = await window.ipcBridge.lspSendRequest('textDocument/completion', {
      textDocument: {
        uri: model.uri.toString()
      },
      position: {
        line: pos.lineNumber - 1,
        character: pos.column - 1
      },
      context: {
        triggerCharacter: ctx.triggerCharacter,
        triggerKind: ctx.triggerKind + 1
      }
    })
    return completionInfo ? lspHelpers.convertLSPCompletionItemsToMonaco(completionInfo) : null
  }
})

monaco.languages.registerFoldingRangeProvider('xmlrfc', {
  provideFoldingRanges: async (model, ctx, cancelToken) => {
    const foldingInfo = await window.ipcBridge.lspSendRequest('textDocument/foldingRange', {
      textDocument: {
        uri: model.uri.toString()
      }
    })
    if (foldingInfo) {
      return foldingInfo.map(f => ({
        start: f.startLine + 1,
        end: f.endLine + 1,
        kind: lspHelpers.convertLSPFoldingRangeKindToMonaco(f.kind)
      }))
    } else {
      return []
    }
  }
})

monaco.languages.registerDocumentSymbolProvider('xmlrfc', {
  provideDocumentSymbols: async (model, cancelToken) => {
    const symbolInfo = await window.ipcBridge.lspSendRequest('textDocument/documentSymbol', {
      textDocument: {
        uri: model.uri.toString()
      }
    })
    editorStore.symbols = symbolInfo ?? []
    if (symbolInfo) {
      return lspHelpers.convertLSPDocumentSymbolsToMonaco(symbolInfo)
    }
  }
})

monaco.languages.registerDocumentFormattingEditProvider('xmlrfc', {
  provideDocumentFormattingEdits: async (model, opts, cancelToken) => {
    const formattingInfo = await window.ipcBridge.lspSendRequest('textDocument/formatting', {
      textDocument: {
        uri: model.uri.toString()
      },
      options: {
        tabSize: opts.tabSize,
        insertSpaces: opts.insertSpaces,
        trimTrailingWhitespace: true,
        insertFinalNewline: true,
        trimFinalNewlines: true
      }
    })
    return formattingInfo?.map(f => ({
      range: {
        endColumn: f.range.end.character + 1,
        endLineNumber: f.range.end.line + 1,
        startColumn: f.range.start.character + 1,
        startLineNumber: f.range.start.line + 1
      },
      text: f.newText
    }))
  }
})

monaco.languages.registerDocumentRangeFormattingEditProvider('xmlrfc', {
  provideDocumentRangeFormattingEdits: async (model, range, opts, cancelToken) => {
    const formattingInfo = await window.ipcBridge.lspSendRequest('textDocument/rangeFormatting', {
      textDocument: {
        uri: model.uri.toString()
      },
      range: {
        start: {
          line: range.startLineNumber - 1,
          character: range.startColumn - 1
        },
        end: {
          line: range.endLineNumber - 1,
          character: range.endColumn - 1
        }
      },
      options: {
        tabSize: opts.tabSize,
        insertSpaces: opts.insertSpaces,
        trimTrailingWhitespace: true,
        insertFinalNewline: true,
        trimFinalNewlines: true
      }
    })
    return formattingInfo?.map(f => ({
      range: {
        endColumn: f.range.end.character + 1,
        endLineNumber: f.range.end.line + 1,
        startColumn: f.range.start.character + 1,
        startLineNumber: f.range.start.line + 1
      },
      text: f.newText
    }))
  }
})

// monaco.languages.registerHoverProvider('xmlrfc', {
//   provideHover: async (model, pos, cancelToken) => {
//     const hoverInfo = await window.ipcBridge.lspSendRequest('textDocument/hover', {
//       textDocument: {
//         uri: model.uri.toString()
//       },
//       position: {
//         line: pos.lineNumber - 1,
//         character: pos.column - 1
//       }
//     })
//     if (hoverInfo) {
//       console.info(hoverInfo)
//     }
//   }
// })

// Allow `*` in word pattern for quick styling (toggle bold/italic without selection)
// original https://github.com/microsoft/vscode/blob/3e5c7e2c570a729e664253baceaf443b69e82da6/extensions/markdown-basics/language-configuration.json#L55
monaco.languages.setLanguageConfiguration('markdown', {
  wordPattern: /([*_]{1,2}|~~|`+)?[\p{Alphabetic}\p{Number}\p{Nonspacing_Mark}]+(_+[\p{Alphabetic}\p{Number}\p{Nonspacing_Mark}]+)*\1/gu
})

const updateContentStore = debounce(ev => {
  docsStore.activeDocument.isModified = modelStore[docsStore.activeDocument.id].getValue() !== docsStore.activeDocument.data
  docsStore.activeDocument.lastModifiedAt = DateTime.utc()
}, 100)

onMounted(async () => {
  nextTick(() => {
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
      if (editorStore.errors.length > 0 || editorStore.validationChecksDirty) {
        editorStore.clearErrors()
      }

      window.ipcBridge.emit('lspSendNotification', {
        method: 'textDocument/didChange',
        params: {
          textDocument: {
            uri: modelStore[docsStore.activeDocument.id].uri.toString(),
            version: ev.versionId
          },
          contentChanges: ev.changes.map(chg => ({
            range: {
              start: {
                line: chg.range.startLineNumber - 1,
                character: chg.range.startColumn - 1
              },
              end: {
                line: chg.range.endLineNumber - 1,
                character: chg.range.endColumn - 1
              }
            },
            rangeLength: chg.rangeLength,
            text: chg.text
          }))
        }
      })

      updateContentStore(ev)
    })

    // -> Handle cursor movement
    editor.onDidChangeCursorPosition(ev => {
      editorStore.$patch({
        line: ev.position.lineNumber,
        col: ev.position.column
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

    // -> Finish
    docOpenFinished(docsStore.activeDocument)
  })

  // WATCHERS

  watch(() => docsStore.active, (newValue) => {
    if (newValue && editor) {
      if (editorStore.validationChecksDirty) {
        editorStore.clearErrors()
      }
      editor.setModel(modelStore[docsStore.activeDocument.id])
      docOpenFinished(docsStore.activeDocument)
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

  // -> Register handlers
  window.ipcBridge.subscribe('editorAction', handleEditorActions)
  window.ipcBridge.subscribe('lspNotification', handleLspNotification)
  EVENT_BUS.on('editorAction', handleEditorActions)
  EVENT_BUS.on('lspCommand', handleLspCommand)
  EVENT_BUS.on('revealPosition', handleRevealPosition)

  // -> Remove initial loading screen
  document.getElementById('app-loading')?.remove()
})

// BEFORE UNMOUNT

onBeforeUnmount(() => {
  // -> Deregister handlers
  window.ipcBridge.subscribe('editorAction', handleEditorActions)
  window.ipcBridge.unsubscribe('lspNotification', handleLspNotification)
  EVENT_BUS.off('editorAction', handleEditorActions)
  EVENT_BUS.off('lspCommand', handleLspCommand)
  EVENT_BUS.off('revealPosition', handleRevealPosition)
})

// METHODS

function docOpenFinished (doc) {
  window.ipcBridge.emit('lspSendNotification', {
    method: 'textDocument/didOpen',
    params: {
      textDocument: {
        uri: doc.uri,
        languageId: doc.type,
        version: 1,
        text: doc.data
      }
    }
  })
}

function handleEditorActions (evt, action) {
  const properAction = action ?? evt
  switch (properAction) {
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
    case 'format': {
      editor.trigger('menu', 'editor.action.formatDocument')
      break
    }
    case 'markerNext': {
      editor.trigger('menu', 'editor.action.marker.next')
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
}

async function validateContent () {
  const enc = new TextEncoder()
  const result = await checkNits(enc.encode(editorStore.content).buffer, 'draft-ietf-ccamp-mw-topo-yang-08.xml', {
    mode: 'normal',
    offline: false
  })
  console.info(result)
}

async function handleLspNotification (evt, data) {
  switch (data.method) {
    case 'textDocument/publishDiagnostics': {
      const modelId = docsStore.getDocumentByURI(data.params.uri)?.id
      if (modelId) {
        monaco.editor.setModelMarkers(modelStore[modelId], 'lsp', data.params.diagnostics.map(d => {
          return {
            code: d.code,
            message: d.message,
            source: d.source,
            severity: lspHelpers.convertLSPSeverityToMonaco(d.severity),
            ...lspHelpers.convertLSPRangeToMonaco(d.range)
          }
        }))
        editorStore.schemaValidationErrors = data.params.diagnostics?.length ?? 0
      } else {
        console.warn(`textDocument/publishDiagnostics: opened document ${data.params.uri} not found.`)
      }
      break
    }
    default: {
      console.info(data)
      break
    }
  }
}

async function handleLspCommand (cmd) {

}

function handleRevealPosition (pos) {
  if (editor) {
    editor.focus()
    editor.revealPositionNearTop(pos, monaco.editor.ScrollType.Smooth)
    editor.setPosition(pos, 'DrawerSymbols')
  }
}
</script>
