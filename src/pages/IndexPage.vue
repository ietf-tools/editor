<template>
  <q-page class="row items-stretch">
    <div class="col-12" ref="monacoContainer"></div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import * as monaco from 'monaco-editor'

const monacoContainer = ref(null)

onMounted(() => {
  setTimeout(() => {
    monaco.editor.create(monacoContainer.value, {
      automaticLayout: true,
      cursorBlinking: 'blink',
      fontSize: 16,
      formatOnType: true,
      language: 'markdown',
      lineNumbersMinChars: 4,
      padding: { top: 10, bottom: 10 },
      scrollBeyondLastLine: false,
      tabSize: 2,
      theme: 'vs-dark',
      value: '# Segment Routing Path MTU in BGP\n\nThis Internet-Draft is submitted in full conformance with the provisions of BCP 78 and BCP 79.',
      wordWrap: 'on'
    })
  }, 500)
})
</script>
