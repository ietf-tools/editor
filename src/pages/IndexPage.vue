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
      value: "function hello() {\n\talert('Hello world!');\n}",
      language: 'javascript',
      theme: 'vs-dark',
      scrollBeyondLastLine: false
    })
  }, 500)
})
</script>
