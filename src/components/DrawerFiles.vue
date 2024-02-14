<template lang="pug">
q-list(padding)
  q-item-label.text-caption.text-light-blue-3(header): strong Files
  q-item
    q-btn.full-width(
      icon='mdi-folder-open'
      label='Set Working Directory...'
      color='primary'
      no-caps
      push
    )
</template>
