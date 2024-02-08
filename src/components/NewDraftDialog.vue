<template lang="pug">
q-dialog(ref='dialogRef', @hide='onDialogHide')
  q-card.mica(style='min-width: 600px;')
    q-card-section.flex.items-center.bg-light-blue-10
      q-icon(name='mdi-file-document-plus-outline', left, size='sm')
      span New Draft
      q-space
      q-btn(
        unelevated
        icon='mdi-close'
        color='primary'
        padding='xs'
        @click='onDialogCancel'
        )
    q-card-section
      .text-caption Select the type of Internet Draft to create:
      q-list.q-mt-sm(bordered separator)
        q-item(
          clickable
          @click='selectType(`xml`)'
          )
          q-item-section(side)
            q-icon(name='mdi-xml')
          q-item-section
            q-item-label RFC XML v3
            q-item-label(caption): em Recommended
        q-item(
          clickable
          @click='selectType(`md`)'
          )
          q-item-section(side)
            q-icon(name='mdi-language-markdown-outline')
          q-item-section Markdown
        q-item(
          clickable
          @click='selectType(`txt`)'
          )
          q-item-section(side)
            q-icon(name='mdi-text-long')
          q-item-section Plain Text
</template>

<script setup>
import { useDialogPluginComponent } from 'quasar'
import { useDocsStore } from 'src/stores/docs'

const docsStore = useDocsStore()

// EMITS

defineEmits([
  ...useDialogPluginComponent.emits
])

// QUASAR

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

// METHODS

function selectType (docType) {
  docsStore.loadDocument({
    type: docType,
    fileName: `untitled-draft.${docType}`,
    data: ''
  })
  onDialogOK()
}
</script>
