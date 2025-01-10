<template lang="pug">
.q-px-md.q-pt-md.q-pb-sm
  .flex.items-center
    .text-caption.text-light-blue-3
      strong Tools
q-list
  q-item(clickable @click='reformat')
    q-item-section(side)
      q-icon(name='mdi-page-previous-outline' size='xs' color='purple-2')
    q-item-section
      q-item-label Reformat
      q-item-label.text-purple-2(caption) Reformat Document and Fix Indentation
  q-item(clickable @click='stripmchars')
    q-item-section(side)
      q-icon(name='mdi-vacuum' size='xs' color='purple-2')
    q-item-section
      q-item-label Strip ^M Line Endings
      q-item-label.text-purple-2(caption) Clean Document from ^M Line Endings
</template>

<script setup>
import { useQuasar } from 'quasar'

const $q = useQuasar()

// METHODS

function reformat() {
  EVENT_BUS.emit('editorAction', 'format')
  $q.notify({
    message: 'Document reformatted succesfully',
    color: 'positive',
    icon: 'mdi-page-previous-outline'
  })
}

function stripmchars() {
  EVENT_BUS.emit('editorAction', 'stripMChars')
  $q.notify({
    message: 'Document cleaned succesfully',
    color: 'positive',
    icon: 'mdi-vacuum'
  })
}
</script>
