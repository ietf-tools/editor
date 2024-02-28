<template lang="pug">
q-dialog(ref='dialogRef' @hide='onDialogHide' transition-show='jump-up' transition-hide='jump-down')
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
    q-card-section.card-border
      .text-caption Select the type of Internet Draft to create:
      q-list.q-mt-sm(bordered separator)
        q-item(
          clickable
          )
          q-item-section(side)
            q-icon(name='mdi-xml')
          q-item-section
            q-item-label RFC XML v3
            q-item-label(caption): em.text-grey Recommended
          q-menu(
            touch-position
            transition-show='jump-down'
            transition-hide='jump-up'
            )
            q-list(separator bordered)
              q-item(clickable @click='selectType(`xml`)')
                q-item-section(side)
                  q-icon(name='mdi-note-text-outline')
                q-item-section
                  q-item-label Blank
                  q-item-label.text-grey(caption) Empty Draft
              q-item(clickable @click='selectType(`xml`, `standard`)')
                q-item-section(side)
                  q-icon(name='mdi-note-text-outline')
                q-item-section
                  q-item-label Standard
                  q-item-label.text-grey(caption) Template with most commonly used features with comments
              q-item(clickable @click='selectType(`xml`, `bare`)')
                q-item-section(side)
                  q-icon(name='mdi-note-text-outline')
                q-item-section
                  q-item-label Bare
                  q-item-label.text-grey(caption) Template for experienced authors
              q-item(clickable @click='selectType(`xml`, `annotated`)')
                q-item-section(side)
                  q-icon(name='mdi-note-text-outline')
                q-item-section
                  q-item-label Annotated
                  q-item-label.text-grey(caption) Template with almost all features, examples and comments

        q-item(
          clickable
          @click='selectType(`md`)'
          )
          q-item-section(side)
            q-icon(name='mdi-language-markdown-outline')
          q-item-section
            q-item-label Markdown
        q-item(
          clickable
          @click='selectType(`txt`)'
          )
          q-item-section(side)
            q-icon(name='mdi-text-long')
          q-item-section
            q-item-label Plain Text
</template>

<script setup>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { useDocsStore } from 'src/stores/docs'

const docsStore = useDocsStore()

const $q = useQuasar()

// EMITS

defineEmits([
  ...useDialogPluginComponent.emits
])

// QUASAR

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

// METHODS

async function selectType (docType, tmpl) {
  let data = ''

  if (tmpl) {
    let tmplUrl = ''
    switch (tmpl) {
      case 'standard':
        tmplUrl = 'https://github.com/ietf-tools/rfcxml-templates-and-schemas/raw/main/draft-rfcxml-general-template-standard-00.xml'
        break
      case 'bare':
        tmplUrl = 'https://github.com/ietf-tools/rfcxml-templates-and-schemas/raw/main/draft-rfcxml-general-template-bare-00.xml'
        break
      case 'annotated':
        tmplUrl = 'https://github.com/ietf-tools/rfcxml-templates-and-schemas/raw/main/draft-rfcxml-general-template-annotated-00.xml'
        break
    }
    if (tmplUrl) {
      try {
        data = await fetch(tmplUrl, {
          credentials: 'omit'
        }).then(r => r.text())
      } catch (err) {
        $q.notify({
          message: 'Failed to fetch template',
          caption: err.message,
          color: 'negative',
          icon: 'mdi-alert'
        })
      }
    }
  }

  docsStore.loadDocument({
    type: docType,
    fileName: `untitled-draft.${docType}`,
    data
  })
  onDialogOK()
}
</script>
