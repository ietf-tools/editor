import { defineStore } from 'pinia'
import { decorationsStore } from 'src/stores/models'

export const useEditorStore = defineStore('editor', {
  state: () => ({
    animationEffects: true,
    col: 1,
    confirmExit: true,
    content: '',
    cursorBlinking: 'blink',
    cursorStyle: 'line',
    debugDisableUnload: false,
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
    persistSession: true,
    previewPaneShown: false,
    restoreSession: false,
    schemaValidationErrors: 0,
    symbols: [],
    tabSize: 2,
    telemetry: false,
    theme: 'ietf-dark',
    translucencyEffects: true,
    validationChecksDirty: false,
    validationChecks: {
      articles: 0,
      hyphenation: 0,
      inclusiveLanguage: 0,
      nonAscii: 0
    },
    validationChecksDetails: {
      articles: [],
      hyphenation: [],
      inclusiveLanguage: [],
      nonAscii: []
    },
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
    },
    async clearErrors () {
      this.errors = []
      for (const key in this.validationChecks) {
        this.validationChecks[key] = 0
        this.validationChecksDetails[key] = []
        decorationsStore.get(key)?.clear()
      }
      this.validationChecksDirty = false
    },
    setValidationCheckState (key, newState) {
      this.validationChecks[key] = newState
      this.validationChecksDirty = true
    },
    setValidationCheckDetails (key, newArr) {
      this.validationChecksDetails[key] = newArr
    }
  },
  persist: {
    pick: [
      'animationEffects',
      'confirmExit',
      'cursorBlinking',
      'cursorStyle',
      'debugDisableUnload',
      'fontSize',
      'formatOnType',
      'persistSession',
      'previewPaneShown',
      'tabSize',
      'telemetry',
      'theme',
      'translucencyEffects',
      'wordWrap',
      'workingDirectory'
    ]
  }
})
