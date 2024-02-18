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
    gitSignCommits: true,
    gitUseCredMan: true,
    gitUsername: '',
    gitPassword: '',
    gitPgpKeySet: false,
    gitSafeStorageEnabled: false,
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
  actions: {
    async fetchGitConfig () {
      const conf = await window.ipcBridge.fetchGitConfig()
      if (conf) {
        this.$patch({
          gitSignCommits: conf.signCommits,
          gitUseCredMan: conf.useCredMan,
          gitUsername: conf.username,
          gitPassword: conf.password,
          gitPgpKeySet: conf.pgpKey,
          gitSafeStorageEnabled: conf.safeStorageEnabled
        })
      }
    },
    async saveGitConfig () {
      window.ipcBridge.emit('updateGitConfig', {
        signCommits: this.gitSignCommits,
        useCredMan: this.gitUseCredMan,
        username: this.gitUsername,
        password: this.gitPassword
      })
    }
  },
  persist: {
    paths: [
      'cursorBlinking',
      'cursorStyle',
      'drawerPane',
      'fontSize',
      'formatOnType',
      'previewPaneShown',
      'tabSize',
      'theme',
      'wordWrap',
      'workingDirectory'
    ]
  }
})
