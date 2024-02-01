<template lang="pug">
q-dialog(ref='dialogRef' @hide='onDialogHide' no-backdrop-dismiss)
  q-card.mica(style='min-width: 800px;')
    q-card-section.flex.items-center.bg-light-blue-10
      q-icon(name='mdi-tray-arrow-down', left, size='sm')
      span Open from URL
    q-card-section.card-border
      q-card-section
        q-input(
          autofocus
          color='white'
          outlined
          label='Document URL'
          clearable
          v-model='state.url'
          tabindex='0'
          )
          template(#prepend)
            q-icon(name='mdi-link-variant')
      q-card-actions(align='right')
        q-btn(
          outline
          label='Cancel'
          color='grey-5'
          padding='xs md'
          @click='onDialogCancel'
          tabindex='2'
          )
        q-btn(
          unelevated
          label='Open'
          color='primary'
          padding='xs md'
          @click='onDialogOK'
          tabindex='1'
          )

</template>

<script setup>
import { useDialogPluginComponent } from 'quasar'
import { reactive } from 'vue'

// const $q = useQuasar()

// EMITS

defineEmits([
  ...useDialogPluginComponent.emits
])

// QUASAR

const { dialogRef, onDialogCancel, onDialogHide, onDialogOK } = useDialogPluginComponent()

// STATE

const state = reactive({
  url: ''
})

</script>
