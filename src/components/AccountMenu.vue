<template lang="pug">
q-btn(v-if='userStore.isLoggedIn' padding="xs sm" flat no-caps)
  span.text-body2 {{ userStore.profile.name }}
  q-avatar.q-ml-sm(size='sm' rounded)
    img(:src='userStore.profile.picture')
  q-menu(auto-close)
    q-list.bg-light-blue-9(separator, style='min-width: 180px')
      q-item.bg-dark-1
        q-item-section.text-center
          .text-caption.text-blue-grey-3 Datatracker Account
          .text-caption.text-blue-grey-2: strong {{ userStore.profile.email }}
      q-item(clickable, @click='openPrefProfile')
        q-item-section(side)
          q-icon(name='mdi-account-cog')
        q-item-section Profile
      q-item(clickable, @click='logout')
        q-item-section(side)
          q-icon(name='mdi-logout')
        q-item-section Logout
q-btn(v-else padding="xs sm" flat no-caps @click='login')
  span.text-body2 Login
  q-icon.q-ml-sm(name='mdi-account-circle')
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import { useQuasar } from 'quasar'
import { useUserStore } from 'src/stores/user'

const $q = useQuasar()

const userStore = useUserStore()

function openPrefProfile () {
  $q.dialog({
    component: defineAsyncComponent(() => import('./PreferencesDialog.vue')),
    componentProps: {
      tab: 'profile'
    }
  })
}

function login () {
  window.ipcBridge.emit('login')
}
function logout () {
  window.ipcBridge.emit('logout')
}
</script>
