<template lang="pug">
.q-pa-md
  .flex.items-center
    .text-caption.text-light-blue-3
      strong Document Symbols
    q-space
    q-btn(
      flat
      size='sm'
      icon='mdi-format-vertical-align-center'
      padding='xs xs'
      text-color='light-blue-3'
      @click='collapse'
      )
      q-tooltip Collapse Symbols Tree
  q-tree.q-mt-md(
    ref='tree'
    :nodes='state.nodes'
    node-key='id'
    label-key='name'
    selected-color='light-blue-5'
    v-model:selected='state.selected'
    v-model:expanded='state.expanded'
    )
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useEditorStore } from 'src/stores/editor'

const editorStore = useEditorStore()

const symbolIcons = {
  xml: ['mdi-xml', 'grey-5'],
  rfc: ['mdi-checkbox-intermediate-variant', 'indigo-3'],
  front: ['mdi-arrow-top-right-bold-box', 'teal-3'],
  middle: ['mdi-arrow-right-bold-box', 'blue-3'],
  back: ['mdi-arrow-bottom-right-bold-box', 'purple-3'],
  section: ['mdi-border-none-variant', 'pink-3'],
  author: ['mdi-account-tie', 'green-3'],
  date: ['mdi-calendar-today', 'red-3'],
  references: ['mdi-bookmark-multiple', 'amber-4'],
  reference: ['mdi-bookmark', 'amber-4'],
  title: ['mdi-format-title', 'amber-4'],
  organization: ['mdi-domain', 'amber-4'],
  address: ['mdi-map-marker', 'green-4'],
  email: ['mdi-email', 'green-4'],
  phone: ['mdi-phone-classic', 'green-4'],
  uri: ['mdi-web', 'amber-4'],
  postal: ['mdi-home-city', 'green-4']
}

// STATE

const state = reactive({
  nodes: [],
  selected: '',
  expanded: []
})

const tree = ref(null)

watch(() => editorStore.symbols, (newValue) => {
  state.nodes = processNodes(editorStore.symbols.filter(s => ![2, 23].includes(s.kind)))
}, { immediate: true })

// METHODS

function collapse () {
  tree.value.collapseAll()
}

function processNodes (nodes, prefix = 'n', depth = 0) {
  let idx = 1
  return nodes.map(s => {
    const id = `${prefix}-${s.name}_${idx}`
    idx++

    if (depth < 2 && !state.expanded.includes(id)) {
      state.expanded.push(id)
    }

    return {
      id,
      name: s.name,
      icon: symbolIcons[s.name]?.[0] ?? 'mdi-tag-outline',
      iconColor: symbolIcons[s.name]?.[1] ?? 'blue-4',
      ...s.children?.length && {
        children: processNodes(s.children, id, depth + 1)
      },
      handler () {
        state.selected = ''
        EVENT_BUS.emit('revealPosition', {
          lineNumber: s.selectionRange.start.line + 1,
          column: s.selectionRange.start.character + 1
        })
      }
    }
  })
}
</script>
