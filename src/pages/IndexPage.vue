<template>
  <q-page class="row items-stretch">
    <div class="col-12" ref="monacoContainer"></div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import * as monaco from 'monaco-editor'

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
  const baseDocReq = await fetch('https://raw.githubusercontent.com/ietf-tools/idnits/v3/tests/fixtures/draft-template-standard.xml')
  const baseDoc = await baseDocReq.text()
  setTimeout(() => {
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
      theme: 'vs-dark',
      value: baseDoc,
      wordWrap: 'on'
    })

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
  }, 500)
})
</script>
