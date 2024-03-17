import { useEditorStore } from 'src/stores/editor'
import * as lspHelpers from 'src/helpers/lsp'

export function registerXMLRFCLanguage (monaco) {
  const editorStore = useEditorStore()

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
    comments: {
      blockComment: ['<!--', '-->']
    },
    brackets: [
      ['<!--', '-->'],
      ['<', '>'],
      ['{', '}'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
      { open: "'", close: "'", notIn: ['string'] },
      { open: '<!--', close: '-->', notIn: ['comment', 'string'] }
    ],
    surroundingPairs: [
      { open: "'", close: "'" },
      { open: '"', close: '"' },
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '<', close: '>' }
    ],
    colorizedBracketPairs: [
    ],
    folding: {
      markers: {
        start: '^\\s*<!--\\s*#region\\b.*-->',
        end: '^\\s*<!--\\s*#endregion\\b.*-->'
      }
    },
    wordPattern: {
      pattern: "(-?\\d*\\.\\d\\w*)|([^\\`\\~\\!\\@\\#\\$\\%\\^\\&\\*\\(\\)\\=\\+\\[\\{\\]\\}\\\\\\|\\;\\:\\'\\\"\\,\\.\\<\\>\\/\\?\\s]+)"
    },
    // indentationRules referenced from:
    // https://github.com/microsoft/vscode/blob/d00558037359acceea329e718036c19625f91a1a/extensions/html-language-features/client/src/htmlMain.ts#L114-L115
    indentationRules: {
      increaseIndentPattern: /<(?!\?|[^>]*\/>)([-_.A-Za-z0-9]+)(?=\s|>)\b[^>]*>(?!.*<\/\1>)|<!--(?!.*-->)|\{[^}"']*$/,
      decreaseIndentPattern: /^\s*(<\/[-_.A-Za-z0-9]+\b[^>]*>|-->|\})/
    },
    onEnterRules: [
      {
        beforeText: /<([_:\w][_:\w-.\d]*)([^/>]*(?!\/)>)[^<]*$/i,
        afterText: /^<\/([_:\w][_:\w-.\d]*)\s*>/i,
        action: { indentAction: 2 }
      },
      {
        beforeText: /<(\w[\w\d]*)([^/>]*(?!\/)>)[^<]*$/i,
        action: { indentAction: 1 }
      }
    ]
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

  monaco.languages.registerRenameProvider('xmlrfc', {
    provideRenameEdits: async (model, pos, newName, cancelToken) => {
      const renameInfo = await window.ipcBridge.lspSendRequest('textDocument/rename', {
        textDocument: {
          uri: model.uri.toString()
        },
        position: {
          line: pos.lineNumber - 1,
          character: pos.column - 1
        },
        newName
      })
      if (renameInfo.documentChanges?.length > 0) {
        return {
          edits: renameInfo.documentChanges[0].edits.map(edit => ({
            resource: model.uri,
            textEdit: {
              text: edit.newText,
              range: {
                endColumn: edit.range.end.character + 1,
                endLineNumber: edit.range.end.line + 1,
                startColumn: edit.range.start.character + 1,
                startLineNumber: edit.range.start.line + 1
              }
            },
            versionId: renameInfo.documentChanges[0].textDocument.version
          }))
        }
      }
    }
  })

  monaco.languages.registerDocumentHighlightProvider('xmlrfc', {
    provideDocumentHighlights: async (model, pos, cancelToken) => {
      const highlightInfo = await window.ipcBridge.lspSendRequest('textDocument/documentHighlight', {
        textDocument: {
          uri: model.uri.toString()
        },
        position: {
          line: pos.lineNumber - 1,
          character: pos.column - 1
        }
      })
      return highlightInfo.map(hl => ({
        kind: hl.kind + 1,
        range: {
          endColumn: hl.range.end.character + 1,
          endLineNumber: hl.range.end.line + 1,
          startColumn: hl.range.start.character + 1,
          startLineNumber: hl.range.start.line + 1
        }
      }))
    }
  })

  monaco.languages.registerLinkProvider('xmlrfc', {
    provideLinks: async (model, cancelToken) => {
      const linksInfo = await window.ipcBridge.lspSendRequest('textDocument/documentLink', {
        textDocument: {
          uri: model.uri.toString()
        }
      })
      return {
        links: linksInfo.map(lnk => ({
          url: lnk.target,
          range: {
            endColumn: lnk.range.end.character + 1,
            endLineNumber: lnk.range.end.line + 1,
            startColumn: lnk.range.start.character + 1,
            startLineNumber: lnk.range.start.line + 1
          },
          ...(lnk.tooltip && { tooltip: lnk.tooltip })
        }))
      }
    }
  })

  monaco.languages.registerCodeActionProvider('xmlrfc', {
    provideCodeActions: async (model, range, ctx, cancelToken) => {
      const codeActionsInfo = await window.ipcBridge.lspSendRequest('textDocument/codeAction', {
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
        context: {
          diagnostics: ctx.markers.map(m => ({
            code: m.code,
            message: m.message,
            range: {
              start: {
                line: m.startLineNumber - 1,
                character: m.startColumn - 1
              },
              end: {
                line: m.endLineNumber - 1,
                character: m.endColumn - 1
              }
            },
            severity: lspHelpers.convertMonacoSeverityToLSP(m.severity),
            source: m.source,
            tags: m.tags
          })),
          only: ctx.only,
          triggerKind: ctx.trigger
        }
      })
      return {
        actions: codeActionsInfo.map(c => ({
          diagnostics: c.diagnostics.map(d => ({
            code: d.code,
            message: d.message,
            severity: lspHelpers.convertLSPSeverityToMonaco(d.severity),
            source: d.source,
            endColumn: d.range.end.character + 1,
            endLineNumber: d.range.end.line + 1,
            startColumn: d.range.start.character + 1,
            startLineNumber: d.range.start.line + 1
          })),
          edit: {
            edits: c.edit.documentChanges[0].edits.map(edit => ({
              resource: model.uri,
              textEdit: {
                text: edit.newText,
                range: {
                  endColumn: edit.range.end.character + 1,
                  endLineNumber: edit.range.end.line + 1,
                  startColumn: edit.range.start.character + 1,
                  startLineNumber: edit.range.start.line + 1
                }
              },
              versionId: c.edit.documentChanges[0].textDocument?.version
            }))
          },
          kind: c.kind,
          title: c.title
        })),
        dispose () { }
      }
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
}
