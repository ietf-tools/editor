<template lang="pug">
.q-pa-md
  .flex.items-center
    .text-caption.text-light-blue-3
      strong Files
    template(v-if='editorStore.workingDirectory')
      q-icon.q-ml-sm(name='mdi-information-outline' color='light-blue-3')
        q-tooltip {{ editorStore.workingDirectory }}
      q-space
      //- q-btn(
      //-   flat
      //-   size='sm'
      //-   icon='mdi-folder-plus-outline'
      //-   padding='xs xs'
      //-   text-color='light-blue-3'
      //-   @click='setWorkingDirectory'
      //-   )
      //-   q-tooltip Create Folder
      q-btn(
        flat
        size='sm'
        icon='mdi-format-vertical-align-center'
        padding='xs xs'
        text-color='light-blue-3'
        @click='collapse'
        )
        q-tooltip Collapse Folders
      q-btn(
        flat
        size='sm'
        icon='mdi-refresh'
        padding='xs xs'
        text-color='light-blue-3'
        @click='reloadWorkingDirectory'
        )
        q-tooltip Refresh
      q-btn(
        flat
        size='sm'
        icon='mdi-folder-edit-outline'
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
    v-else
    ref='tree'
    :nodes='editorStore.workingDirFiles'
    node-key='id'
    label-key='name'
    @lazy-load='onLazyLoad'
    selected-color='light-blue-5'
    v-model:selected='state.selected'
    )
</template>

<script setup>
import { nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useDocsStore } from 'src/stores/docs'
import { useEditorStore } from 'src/stores/editor'
import { find, last } from 'lodash-es'

const docsStore = useDocsStore()
const editorStore = useEditorStore()

watch(() => editorStore.workingDirectory, reloadWorkingDirectory)

// STATE

const state = reactive({
  selected: ''
})

const tree = ref(null)

// METHODS

function collapse () {
  tree.value.collapseAll()
}

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
      ...getFromFileExt(f),
      expandable: false
    })
  }))
}

function getFromFileExt (f) {
  const ext = last(f.name.split('.'))
  switch (ext) {
    case 'md': {
      return {
        icon: 'mdi-language-markdown',
        iconColor: 'indigo-2',
        selectable: true,
        handler () {
          selectFile(f.path)
        }
      }
    }
    case 'txt': {
      return {
        icon: 'mdi-file-document-outline',
        iconColor: 'pink-4',
        selectable: true,
        handler () {
          selectFile(f.path)
        }
      }
    }
    case 'xml': {
      return {
        icon: 'mdi-file-xml-box',
        iconColor: 'blue-3',
        selectable: true,
        handler () {
          selectFile(f.path)
        }
      }
    }
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
      return {
        icon: 'mdi-image',
        iconColor: 'green-4',
        selectable: true,
        disabled: true
      }
    default: {
      return {
        icon: 'mdi-file',
        iconColor: 'grey-3',
        selectable: false,
        disabled: true
      }
    }
  }
}

async function onLazyLoad ({ node, done, fail }) {
  try {
    const files = await window.ipcBridge.readDirectory(node.path)
    done(processFiles(files))
  } catch (err) {
    fail()
  }
}

function selectFile (target) {
  const openedDoc = find(docsStore.opened, ['path', target])
  if (openedDoc) {
    docsStore.active = openedDoc.id
  } else {
    docsStore.openDocumentFromPath(target)
  }
  nextTick(() => {
    state.selected = ''
  })
}

// MOUNTED

onMounted(() => {
  if (editorStore.workingDirectory) {
    reloadWorkingDirectory()
  }
})
</script>
