import { defineStore } from 'pinia'

export const useEditorStore = defineStore('editor', {
  state: () => ({
    content: '',
    lastChangeTimestamp: null,
    errors: []
  }),
  getters: {
    hasErrors: (state) => state.errors?.length > 0
  },
  actions: {
  }
})
