<template lang="pug">
q-page.row.items-stretch
  .col-12.col-lg-6(ref="monacoContainer")
  .col-12.col-lg-6.bg-dark-5
    .q-ma-lg Preview
    q-btn(
      @click='validateContent'
      label='Check Nits'
      push
      color='teal'
      )
</template>

<script setup>
import { onMounted, ref } from 'vue'
import * as monaco from 'monaco-editor'
import { debounce } from 'lodash-es'
import { DateTime } from 'luxon'
import { checkNits } from '@ietf-tools/idnits'

import { useAppStore } from 'stores/app'
import { useEditorStore } from 'stores/editor'

// STORES

const appStore = useAppStore()
const editorStore = useEditorStore()

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

onMounted(async () => {
  // const baseDocReq = await fetch('https://raw.githubusercontent.com/ietf-tools/idnits/v3/tests/fixtures/draft-template-standard.xml')
  const baseDocReq = await fetch('https://www.ietf.org/archive/id/draft-ietf-ccamp-mw-topo-yang-08.xml')
  const baseDoc = await baseDocReq.text()
  setTimeout(() => {
    // -> Define Monaco Theme
    monaco.editor.defineTheme('ietf', {
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

    // -> Initialize Monaco editor
    editor = monaco.editor.create(monacoContainer.value, {
      automaticLayout: true,
      cursorBlinking: 'blink',
      fontSize: 16,
      formatOnType: true,
      language: 'xmlrfc',
      lineNumbersMinChars: 4,
      padding: { top: 10, bottom: 10 },
      scrollBeyondLastLine: false,
      tabSize: 2,
      theme: 'ietf',
      value: baseDoc,
      wordWrap: 'on'
    })

    // -> Handle content change
    editor.onDidChangeModelContent(debounce(ev => {
      editorStore.$patch({
        lastChangeTimestamp: DateTime.utc(),
        content: editor.getValue()
      })
    }, 500))

    // Code Lens
    const commandId = editor.addCommand(
      0,
      function () {
        // services available in `ctx`
        alert('my command is executing!')
      },
      ''
    )

    monaco.languages.registerCodeLensProvider('xmlrfc', {
      provideCodeLenses: function (model, token) {
        return {
          lenses: [
            {
              range: {
                startLineNumber: 12,
                startColumn: 1,
                endLineNumber: 13,
                endColumn: 1
              },
              id: 'First Line',
              command: {
                id: commandId,
                title: 'Code Lens Test'
              }
            }
          ],
          dispose: () => { }
        }
      },
      resolveCodeLens: function (model, codeLens, token) {
        return codeLens
      }
    })

    // -> Post init
    editor.focus()
  }, 500)
})

async function validateContent () {
  const enc = new TextEncoder()
  const result = await checkNits(enc.encode(editorStore.content).buffer, 'draft-ietf-ccamp-mw-topo-yang-08.xml', {
    mode: 'normal',
    offline: !appStore.isElectron
  })
  console.info(result)
}
</script>
