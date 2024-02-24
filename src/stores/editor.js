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
    gitName: '',
    gitEmail: '',
    gitSignCommits: true,
    gitUseCredMan: true,
    gitUsername: '',
    gitPassword: '',
    gitPgpKeySet: false,
    gitFingerprint: '',
    gitSafeStorageEnabled: false,
    gitRemotes: [],
    gitCurrentRemote: 'origin',
    gitCurrentBranch: '',
    gitLocalBranches: [],
    gitRemoteBranches: [],
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
    isDarkTheme: (state) => ['ietf-dark', 'hc-black'].includes(state.theme),
    isGitRepo: (state) => state.workingDirFiles.some(f => f.name === '.git')
  },
  actions: {
    async fetchGitConfig () {
      const conf = await window.ipcBridge.fetchGitConfig()
      if (conf) {
        this.$patch({
          gitName: conf.name,
          gitEmail: conf.email,
          gitSignCommits: conf.signCommits,
          gitUseCredMan: conf.useCredMan,
          gitUsername: conf.username,
          gitPassword: conf.password,
          gitPgpKeySet: conf.pgpKey,
          gitFingerprint: conf.fingerprint,
          gitSafeStorageEnabled: conf.safeStorageEnabled,
          gitCurrentRemote: conf.currentRemote
        })
      }
    },
    async saveGitConfig () {
      window.ipcBridge.emit('updateGitConfig', {
        name: this.gitName,
        email: this.gitEmail,
        signCommits: this.gitSignCommits,
        useCredMan: this.gitUseCredMan,
        username: this.gitUsername,
        password: this.gitPassword,
        currentRemote: this.gitCurrentRemote
      })
    },
    async fetchBranches () {
      const branches = await window.ipcBridge.gitListBranches(this.workingDirectory, this.gitCurrentRemote)
      this.gitCurrentBranch = branches.current ?? ''
      this.gitLocalBranches = branches.local ?? []
      this.gitRemoteBranches = branches.remote ?? []
    },
    async fetchRemotes () {
      this.gitRemotes = await window.ipcBridge.gitListRemotes(this.workingDirectory)
    }
  },
  persist: {
    paths: [
      'cursorBlinking',
      'cursorStyle',
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
