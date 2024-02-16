import { defineStore } from 'pinia'

export const useEditorStore = defineStore('editor', {
  state: () => ({
    col: 1,
    content: '',
    cursorBlinking: 'blink',
    cursorStyle: 'line',
    drawerPane: 'DrawerFiles',
    errors: [],
    fontSize: 16,
    formatOnType: true,
    gitMode: 'editor',
    lastChangeTimestamp: null,
    line: 1,
    previewPaneShown: true,
    tabSize: 2,
    theme: 'ietf-dark',
    wordWrap: true,
    workingDirectory: '',
    workingDirFiles: []
  }),
  getters: {
    hasErrors: (state) => state.errors?.length > 0,
    isDarkTheme: (state) => ['ietf-dark', 'hc-black'].includes(state.theme)
  },
  actions: { },
  persist: {
    paths: [
      'cursorBlinking',
      'cursorStyle',
      'drawerPane',
      'fontSize',
      'formatOnType',
      'gitMode',
      'previewPaneShown',
      'tabSize',
      'theme',
      'wordWrap',
      'workingDirectory'
    ]
  }
})
