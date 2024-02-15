import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    mode: process.env.MODE
  }),
  getters: {
    isElectron: (state) => state.mode === 'electron',
    isPWA: (state) => state.mode === 'pwa' && window.matchMedia('(display-mode: standalone)').matches
  },
  actions: {
  },
  persist: {
    paths: []
  }
})
