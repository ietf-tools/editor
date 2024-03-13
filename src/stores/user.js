import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    expireAt: null,
    isLoggedIn: false,
    profile: {}
  }),
  getters: {
    isExpired (state) {
      return state.expireAt <= Math.floor(Date.now() / 1000)
    }
  },
  actions: { },
  persist: {
    paths: []
  }
})
