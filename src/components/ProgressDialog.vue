<template lang="pug">
q-dialog(ref='dialogRef' @hide='onDialogHide' seamless position='bottom')
  q-card.bg-dark-3.progress-dialog.shadow-10(style='width: 350px;')
    q-linear-progress(:indeterminate='props.progress < 0', :value='props.progress > 0 ? props.progress : 0' color='white' size='xs')
    q-card-section
      .flex
        q-icon(name='mdi-package-down' color='white' size='md')
        .q-ml-md
          .text-body2 {{ message }}
          .text-caption.text-blue-grey-3 {{ caption }}
</template>

<script setup>
import { useDialogPluginComponent } from 'quasar'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    default: 'Loading...'
  },
  progress: {
    type: Number,
    default: -1
  }
})

// EMITS

defineEmits([
  ...useDialogPluginComponent.emits
])

// QUASAR

const { dialogRef, onDialogHide } = useDialogPluginComponent()
</script>

<style lang="scss">
.progress-dialog {
  background-color: rgba($dark-3, .9);
  backdrop-filter: blur(5px) saturate(180%);
}
</style>
