<template lang="pug">
q-list(padding)
  q-item-label.text-caption.text-light-blue-3(header): strong Tools
  q-item(clickable @click='reindent')
    q-item-section(side)
      q-icon(name='mdi-page-previous-outline' size='xs' color='light-blue-4')
    q-item-section
      q-item-label Reindent
      q-item-label.text-light-blue-3(caption) Reformat Document Indentation
</template>

<script setup>
function reindent () {
  EVENT_BUS.emit('lspCommand', 'formatting')
}
</script>
