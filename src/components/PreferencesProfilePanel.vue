<template lang="pug">
  .q-pa-md(v-if='userStore.isLoggedIn')
    .row.q-gutter-md.items-center
      .col-auto
        q-avatar(size='70px', rounded)
          img(:src='userStore.profile.picture')
      .col
        .text-caption: strong.text-grey-5 Logged in as
        .text-body1 {{ userStore.profile.name }}
        .text-body2 {{ userStore.profile.email }}
      .col-auto
        q-btn(
          unelevated
          color='primary'
          label='Edit Profile'
          icon='mdi-account-edit'
          no-caps
          @click='editProfile'
        )
        q-btn.q-ml-sm(
          unelavated
          color='negative'
          label='Logout'
          icon='mdi-logout'
          no-caps
          @click='logout'
        )
  .q-pa-md(v-else)
    span You are not currently logged in.
    .q-mt-md
      q-btn(
        unelevated
        color='primary'
        label='Login'
        icon='mdi-login'
        no-caps
        @click='login'
      )
</template>

<script setup>
import { useUserStore } from 'src/stores/user'
const userStore = useUserStore()

// METHODS

function login () {
  window.ipcBridge.emit('login')
}
function editProfile () {
  window.ipcBridge.emit('launchBrowser', { url: 'https://datatracker.ietf.org/accounts/profile/' })
}
function logout () {
  window.ipcBridge.emit('logout')
}

</script>
