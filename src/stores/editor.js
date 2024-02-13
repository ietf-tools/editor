import { defineStore } from 'pinia'

export const useEditorStore = defineStore('editor', {
  state: () => ({
    content: '',
    lastChangeTimestamp: null,
    errors: [],
    line: 1,
    col: 1,
    cursorBlinking: 'blink',
    fontSize: 16,
    formatOnType: true,
    tabSize: 2,
    previewPaneShown: true,
    gitMode: 'system',
    drawerPane: 'DrawerGit'
  }),
  getters: {
    hasErrors: (state) => state.errors?.length > 0
  },
  actions: {
  }
})
