import { defineStore } from 'pinia'

export const useEditorStore = defineStore('editor', {
  state: () => ({
    col: 1,
    content: '',
    cursorBlinking: 'blink',
    cursorStyle: 'line',
    drawerPane: 'DrawerGit',
    errors: [],
    fontSize: 16,
    formatOnType: true,
    gitMode: 'system',
    lastChangeTimestamp: null,
    line: 1,
    previewPaneShown: true,
    tabSize: 2,
    theme: 'ietf-dark',
    wordWrap: true
  }),
  getters: {
    hasErrors: (state) => state.errors?.length > 0,
    isDarkTheme: (state) => ['ietf-dark', 'hc-black'].includes(state.theme)
  },
  actions: {
  }
})
