<template lang="pug">
q-dialog(
  ref='dialogRef'
  seamless
  position='bottom'
  @hide='onDialogHide'
  :transition-show='editorStore.animationEffects ? `jump-up` : `none`'
  :transition-hide='editorStore.animationEffects ? `jump-down` : `none`'
  )
  q-card(style='min-width: 80vw;')
    q-card-section.flex.items-center.bg-light-blue-10
      q-icon(name='mdi-console', left, size='sm')
      span Terminal
      q-space
      q-btn.q-mr-md(
        unelevated
        icon='mdi-restart-alert'
        color='primary'
        padding='xs md'
        @click='resetTerminal'
        label='Reset'
        no-caps
        :loading='state.resetLoading'
        )
        q-tooltip Kill active terminal and launch new one
      q-btn.q-mr-md(
        unelevated
        icon='mdi-cog-outline'
        color='primary'
        padding='xs md'
        @click='openTerminalSettings'
        label='Settings'
        no-caps
        )
        q-tooltip Configure Terminal
      q-btn(
        unelevated
        icon='mdi-close'
        color='primary'
        padding='xs'
        @click='onDialogCancel'
        )
        q-tooltip Close Terminal
    q-card-section.card-border.q-pa-md.bg-black
      div(ref='terminal', style='height: 500px;')
</template>

<script setup>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { defineAsyncComponent, onBeforeUnmount, onMounted, reactive, useTemplateRef } from 'vue'
import { useEditorStore } from 'src/stores/editor'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'

const $q = useQuasar()

// EMITS

defineEmits([
  ...useDialogPluginComponent.emits
])

// STORES

const editorStore = useEditorStore()

// QUASAR

const { dialogRef, onDialogCancel, onDialogHide } = useDialogPluginComponent()

// STATE

const state = reactive({
  resetLoading: false
})
let term = null

const terminalElm = useTemplateRef('terminal')

// METHODS

function resetTerminal () {
  state.resetLoading = true
  window.ipcBridge.emit('terminalDestroy')
  term.reset()
  setTimeout(() => {
    window.ipcBridge.emit('terminalInit', {
      cwd: editorStore.workingDirectory,
      shell: editorStore.terminalShell,
      args: editorStore.terminalArgs
    })
    state.resetLoading = false
  }, 2000)
}

function openTerminalSettings () {
  $q.dialog({
    component: defineAsyncComponent(() => import('components/PreferencesDialog.vue')),
    componentProps: {
      tab: 'terminal'
    }
  })
}

function handleTerminalOutput (evt, data) {
  term.write(data)
}

function initTerminal () {
  term = new Terminal({
    cursorBlink: true
  })
  const fitAddon = new FitAddon()
  term.loadAddon(fitAddon)

  setTimeout(() => {
    term.open(terminalElm.value)
    fitAddon.fit()
    term.focus()
    window.ipcBridge.subscribe('terminal.incomingData', handleTerminalOutput)
    term.onData(ev => {
      window.ipcBridge.emit('terminalInput', ev)
    })

    setTimeout(() => {
      window.ipcBridge.emit('terminalInit', {
        cwd: editorStore.workingDirectory,
        shell: editorStore.terminalShell,
        args: editorStore.terminalArgs
      })
    })
  })
}

function killTerminal () {
  window.ipcBridge.unsubscribe('terminal.incomingData', handleTerminalOutput)
  window.ipcBridge.emit('terminalDestroy')
}

// HOOKS

onMounted(initTerminal)
onBeforeUnmount(killTerminal)

</script>

<style lang="scss">
// Adapted from https://github.com/xtermjs/xterm.js/blob/master/css/xterm.css

.xterm {
  cursor: text;
  position: relative;
  user-select: none;
  -ms-user-select: none;
  -webkit-user-select: none;
}

.xterm.focus,
.xterm:focus {
  outline: none;
}

.xterm .xterm-helpers {
  position: absolute;
  top: 0;
  /**
  * The z-index of the helpers must be higher than the canvases in order for
  * IMEs to appear on top.
  */
  z-index: 5;
}

.xterm .xterm-helper-textarea {
  padding: 0;
  border: 0;
  margin: 0;
  /* Move textarea out of the screen to the far left, so that the cursor is not visible */
  position: absolute;
  opacity: 0;
  left: -9999em;
  top: 0;
  width: 0;
  height: 0;
  z-index: -5;
  /** Prevent wrapping so the IME appears against the textarea at the correct position */
  white-space: nowrap;
  overflow: hidden;
  resize: none;
}

.xterm .composition-view {
  /* TODO: Composition position got messed up somewhere */
  background: #000;
  color: #FFF;
  display: none;
  position: absolute;
  white-space: nowrap;
  z-index: 1;
}

.xterm .composition-view.active {
  display: block;
}

.xterm .xterm-viewport {
  /* On OS X this is required in order for the scroll bar to appear fully opaque */
  background-color: #000;
  overflow-y: scroll;
  cursor: default;
  position: absolute;
  right: 0;
  left: 0;
  top: 0;
  bottom: 0;
}

.xterm .xterm-screen {
  position: relative;
}

.xterm .xterm-screen canvas {
  position: absolute;
  left: 0;
  top: 0;
}

.xterm-char-measure-element {
  display: inline-block;
  visibility: hidden;
  position: absolute;
  top: 0;
  left: -9999em;
  line-height: normal;
}

.xterm.enable-mouse-events {
  /* When mouse events are enabled (eg. tmux), revert to the standard pointer cursor */
  cursor: default;
}

.xterm.xterm-cursor-pointer,
.xterm .xterm-cursor-pointer {
  cursor: pointer;
}

.xterm.column-select.focus {
  /* Column selection mode */
  cursor: crosshair;
}

.xterm .xterm-accessibility:not(.debug),
.xterm .xterm-message {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  z-index: 10;
  color: transparent;
  pointer-events: none;
}

.xterm .xterm-accessibility-tree:not(.debug) *::selection {
  color: transparent;
}

.xterm .xterm-accessibility-tree {
  font-family: monospace;
  user-select: text;
  white-space: pre;
}

.xterm .xterm-accessibility-tree > div {
  transform-origin: left;
  width: fit-content;
}

.xterm .live-region {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.xterm-dim {
  /* Dim should not apply to background, so the opacity of the foreground color is applied
  * explicitly in the generated class and reset to 1 here */
  opacity: 1 !important;
}

.xterm-underline-1 { text-decoration: underline; }
.xterm-underline-2 { text-decoration: double underline; }
.xterm-underline-3 { text-decoration: wavy underline; }
.xterm-underline-4 { text-decoration: dotted underline; }
.xterm-underline-5 { text-decoration: dashed underline; }

.xterm-overline {
  text-decoration: overline;
}

.xterm-overline.xterm-underline-1 { text-decoration: overline underline; }
.xterm-overline.xterm-underline-2 { text-decoration: overline double underline; }
.xterm-overline.xterm-underline-3 { text-decoration: overline wavy underline; }
.xterm-overline.xterm-underline-4 { text-decoration: overline dotted underline; }
.xterm-overline.xterm-underline-5 { text-decoration: overline dashed underline; }

.xterm-strikethrough {
  text-decoration: line-through;
}

.xterm-screen .xterm-decoration-container .xterm-decoration {
  z-index: 6;
  position: absolute;
}

.xterm-screen .xterm-decoration-container .xterm-decoration.xterm-decoration-top-layer {
  z-index: 7;
}

.xterm-decoration-overview-ruler {
  z-index: 8;
  position: absolute;
  top: 0;
  right: 0;
  pointer-events: none;
}

.xterm-decoration-top {
  z-index: 2;
  position: relative;
}

/* Derived from vs/base/browser/ui/scrollbar/media/scrollbar.css */

/* xterm.js customization: Override xterm's cursor style */
.xterm .xterm-scrollable-element > .scrollbar {
  cursor: default;
}

/* Arrows */
.xterm .xterm-scrollable-element > .scrollbar > .scra {
  cursor: pointer;
  font-size: 11px !important;
}

.xterm .xterm-scrollable-element > .visible {
  opacity: 1;

  /* Background rule added for IE9 - to allow clicks on dom node */
  background:rgba(0,0,0,0);

  transition: opacity 100ms linear;
  /* In front of peek view */
  z-index: 11;
}
.xterm .xterm-scrollable-element > .invisible {
  opacity: 0;
  pointer-events: none;
}
.xterm .xterm-scrollable-element > .invisible.fade {
  transition: opacity 800ms linear;
}

/* Scrollable Content Inset Shadow */
.xterm .xterm-scrollable-element > .shadow {
  position: absolute;
  display: none;
}
.xterm .xterm-scrollable-element > .shadow.top {
  display: block;
  top: 0;
  left: 3px;
  height: 3px;
  width: 100%;
  box-shadow: var(--vscode-scrollbar-shadow, #000) 0 6px 6px -6px inset;
}
.xterm .xterm-scrollable-element > .shadow.left {
  display: block;
  top: 3px;
  left: 0;
  height: 100%;
  width: 3px;
  box-shadow: var(--vscode-scrollbar-shadow, #000) 6px 0 6px -6px inset;
}
.xterm .xterm-scrollable-element > .shadow.top-left-corner {
  display: block;
  top: 0;
  left: 0;
  height: 3px;
  width: 3px;
}
.xterm .xterm-scrollable-element > .shadow.top.left {
  box-shadow: var(--vscode-scrollbar-shadow, #000) 6px 0 6px -6px inset;
}
</style>
