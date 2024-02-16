<template lang="pug">
.q-pa-md
  .flex.items-center
    .text-caption.text-light-blue-3
      strong Files
      q-tooltip {{ editorStore.workingDirectory }}
    q-space
    q-btn(
      v-if='editorStore.workingDirectory'
      size='sm'
      icon='mdi-folder-edit'
      padding='xs xs'
      text-color='light-blue-3'
      @click='setWorkingDirectory'
      )
      q-tooltip Set Working Directory...
  q-btn.full-width.q-mt-sm(
    v-if='!editorStore.workingDirectory'
    icon='mdi-folder-open'
    label='Set Working Directory...'
    color='primary'
    no-caps
    unelevated
    @click='setWorkingDirectory'
  )
  q-tree.q-mt-md(
    :nodes='editorStore.workingDirFiles'
    node-key='id'
    label-key='name'
    @lazy-load='onLazyLoad'
    selected-color='light-blue-5'
    v-model:selected='state.selected'
    )
</template>

<script setup>
import { onMounted, reactive, watch } from 'vue'
import { useEditorStore } from 'src/stores/editor'

const editorStore = useEditorStore()

watch(() => editorStore.workingDirectory, reloadWorkingDirectory)

// STATE

const state = reactive({
  selected: ''
})

// METHODS

async function setWorkingDirectory () {
  const wdPath = await window.ipcBridge.promptWorkingDirectory(editorStore.workingDirectory)
  if (wdPath) {
    editorStore.workingDirectory = wdPath
  }
}

async function reloadWorkingDirectory () {
  const files = await window.ipcBridge.readDirectory(editorStore.workingDirectory)
  editorStore.workingDirFiles = processFiles(files)
}

function processFiles (files) {
  return files.map(f => ({
    id: crypto.randomUUID(),
    name: f.name,
    path: f.path,
    ...(f.isDirectory && {
      icon: 'mdi-folder',
      iconColor: 'yellow-8',
      lazy: true,
      selectable: false
    }),
    ...(!f.isDirectory && {
      icon: 'mdi-file',
      expandable: false,
      selectable: true
    })
  }))
}

async function onLazyLoad ({ node, done, fail }) {
  try {
    const files = await window.ipcBridge.readDirectory(node.path)
    done(processFiles(files))
  } catch (err) {
    fail()
  }
}

// MOUNTED

onMounted(() => {
  if (editorStore.workingDirectory) {
    reloadWorkingDirectory()
  }
})
</script>
