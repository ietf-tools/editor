<template lang="pug">
q-layout(view='hHh lpr fFf')
  q-header(elevated='')
    q-bar.bg-light-blue-10.q-electron-drag
      q-icon(name='img:https://static.ietf.org/logos/ietf-inverted.svg' size='xl')
      q-toolbar-title: span.text-body2: strong DraftForge
      q-icon.q-mr-sm(name='mdi-circle' size='.5em' color='positive')
      span.text-caption.text-light-blue-2 Connected
      q-space
      q-btn(dense flat icon='mdi-minus' @click='minimize' padding='xs sm')
      q-btn(dense flat icon='mdi-checkbox-blank-outline' @click='toggleMaximize' padding='xs sm')
      q-btn(dense flat icon='mdi-window-close' @click='closeApp' padding='xs sm')
    q-bar.bg-light-blue-9
      q-btn(padding="xs sm" flat no-caps)
        span.text-body2 File
        q-menu(transition-show='jump-down' transition-hide='jump-up')
          q-list(dense auto-close padding)
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-text-box-plus-outline')
              q-item-section New Draft...
              q-item-section(side caption) {{cmdKey}}+N
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-text-box-edit-outline')
              q-item-section Open...
              q-item-section(side caption) {{cmdKey}}+O
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-timeline-text-outline')
              q-item-section Open Recent
              q-item-section(side)
                q-icon(name='mdi-menu-right')
              q-menu(anchor='top end' self='top start')
                q-list(dense auto-close padding)
                  q-item(disabled)
                    q-item-section No Recent Drafts
            q-separator.q-my-sm
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-content-save-outline')
              q-item-section Save
              q-item-section(side caption) {{cmdKey}}+S
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-content-duplicate')
              q-item-section Save As...
              q-item-section(side caption) {{cmdKey}}+Shift+S
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-file-move-outline')
              q-item-section Move To...
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-file-export-outline')
              q-item-section Export
              q-item-section(side)
                q-icon(name='mdi-menu-right')
              q-menu(anchor='top end' self='top start')
                q-list(dense auto-close padding)
                  q-item(clickable)
                    q-item-section All
                  q-item(clickable)
                    q-item-section HTML
                  q-item(clickable)
                    q-item-section PDF
                  q-item(clickable)
                    q-item-section Text
                  q-item(clickable)
                    q-item-section Comments
                  q-item(clickable)
                    q-item-section Code Components
                  q-item(clickable)
                    q-item-section XML
            q-separator.q-my-sm
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-cog-outline')
              q-item-section Preferences
            q-separator.q-my-sm
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-exit-run')
              q-item-section Exit
      q-btn(padding="xs sm" flat no-caps)
        span.text-body2 Edit
        q-menu(transition-show='jump-down' transition-hide='jump-up')
          q-list(dense auto-close padding)
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-undo-variant')
              q-item-section Undo
              q-item-section(side caption) {{cmdKey}}+Z
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-redo-variant')
              q-item-section Redo
              q-item-section(side caption) {{cmdKey}}+Y
            q-separator.q-my-sm
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-content-cut')
              q-item-section Cut
              q-item-section(side caption) {{cmdKey}}+X
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-content-copy')
              q-item-section Copy
              q-item-section(side caption) {{cmdKey}}+C
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-content-paste')
              q-item-section Paste
              q-item-section(side caption) {{cmdKey}}+V
            q-separator.q-my-sm
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-magnify')
              q-item-section Find
              q-item-section(side)
                q-icon(name='mdi-menu-right')
              q-menu(anchor='top end' self='top start')
                q-list(dense auto-close padding)
                  q-item(clickable)
                    q-item-section Find
                    q-item-section(side caption) {{cmdKey}}+F
                  q-item(clickable)
                    q-item-section Find and Replace
                    q-item-section(side caption) {{cmdKey}}+H
                  q-item(clickable)
                    q-item-section Find Next
                  q-item(clickable)
                    q-item-section Find Previous
                  q-item(clickable)
                    q-item-section Find BCP14 Keywords
                  q-item(clickable)
                    q-item-section Find Xrefs
            q-separator.q-my-sm
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-spellcheck')
              q-item-section Spelling & Grammar
              q-item-section(side)
                q-icon(name='mdi-menu-right')
              q-menu(anchor='top end' self='top start')
                q-list(dense auto-close padding)
                  q-item(clickable)
                    q-item-section Check Spelling
                  q-item(clickable)
                    q-item-section Check Grammar
                  q-item(clickable)
                    q-item-section Check for Common Typos
                  q-item(clickable)
                    q-item-section Check for Duplicates
      q-btn(padding="xs sm" flat no-caps)
        span.text-body2 Selection
        q-menu(transition-show='jump-down' transition-hide='jump-up')
          q-list(dense auto-close padding)
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-select-all')
              q-item-section Select All
              q-item-section.text-caption(side caption) {{cmdKey}}+A
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-select-drag')
              q-item-section Expand Selection
              q-item-section.text-caption.text-no-wrap(side caption) Shift+Alt+RightArrow
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-image-size-select-small')
              q-item-section Shrink Selection
              q-item-section.text-caption(side caption) Shift+Alt+LeftArrow
            q-separator.q-my-sm
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-select-arrow-up')
              q-item-section Copy Line Up
              q-item-section.text-caption(side caption) Shift+Alt+UpArrow
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-select-arrow-down')
              q-item-section Copy Line Down
              q-item-section.text-caption(side caption) Shift+Alt+UpArrow
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-elevator-up')
              q-item-section Move Line Up
              q-item-section.text-caption(side caption) Alt+UpArrow
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-elevator-down')
              q-item-section Move Line Down
              q-item-section.text-caption(side caption) Alt+DownArrow
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-vector-selection')
              q-item-section Duplicate Selection
            q-separator.q-my-sm
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-arrow-collapse-up')
              q-item-section Add Cursor Above
              q-item-section.text-caption(side caption) {{cmdKey}}+Alt+UpArrow
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-arrow-collapse-down')
              q-item-section Add Cursor Below
              q-item-section.text-caption(side caption) {{cmdKey}}+Alt+DownArrow
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-arrow-collapse-right')
              q-item-section Add Cursors to Line Ends
              q-item-section.text-caption(side caption) Shift+Alt+I
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-transfer-right')
              q-item-section Add Next Occurrence
              q-item-section.text-caption(side caption) {{cmdKey}}+D
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-transfer-left')
              q-item-section Add Previous Occurrence
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-select-group')
              q-item-section Select All Occurrences
              q-item-section.text-caption(side caption) {{cmdKey}}+Shift+L
      q-btn(padding="xs sm" flat no-caps)
        span.text-body2 View
        q-menu(transition-show='jump-down' transition-hide='jump-up')
          q-list(dense auto-close padding)
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-form-select')
              q-item-section Command Palette...
              q-item-section.text-caption(side caption) {{cmdKey}}+Shift+P
            q-separator.q-my-sm
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-magnify-plus-outline')
              q-item-section Zoom In
              q-item-section.text-caption(side caption) {{cmdKey}}+=
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-magnify-minus-outline')
              q-item-section Zoom Out
              q-item-section.text-caption(side caption) {{cmdKey}}+-
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-magnify-close')
              q-item-section Reset Zoom
            q-separator.q-my-sm
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-view-split-vertical')
              q-item-section Preview Output
              q-item-section(side)
                q-icon(name='mdi-menu-right')
              q-menu(anchor='top end' self='top start')
                q-list(dense auto-close padding)
                  q-item(clickable)
                    q-item-section HTML
                    q-item-section(side)
                      q-icon(name='mdi-check')
                  q-item(clickable)
                    q-item-section Text
            q-separator.q-my-sm
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-wrap')
              q-item-section Word Wrap
              q-item-section.text-caption(side caption) Alt+Z
      q-btn(padding="xs sm" flat no-caps)
        span.text-body2 Insert
        q-menu(transition-show='jump-down' transition-hide='jump-up')
          q-list(dense auto-close padding)
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-tag-plus-outline')
              q-item-section Insert BCP14 Tags
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-book-plus-outline')
              q-item-section Insert Empty Reference
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-table-large-plus')
              q-item-section Create Table
      q-btn(padding="xs sm" flat no-caps)
        span.text-body2 Tools
        q-menu(transition-show='jump-down' transition-hide='jump-up')
          q-list(dense auto-close padding)
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-bicycle-penny-farthing')
              q-item-section Validate RFCXML
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-diving')
              q-item-section Check ID Nits
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-food-drumstick-outline')
              q-item-section Check References
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-food-turkey')
              q-item-section Check non-ASCII
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-hamburger')
              q-item-section Check PDF Fonts
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-human-baby-changing-table')
              q-item-section Check Inclusive Language
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-human-scooter')
              q-item-section Check SVG
      q-btn(padding="xs sm" flat no-caps)
        span.text-body2 Help
        q-menu(transition-show='jump-down' transition-hide='jump-up')
          q-list(dense auto-close padding)
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-book-open-page-variant-outline')
              q-item-section Documentation
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-bookshelf')
              q-item-section RFCXML Vocabulary
            q-separator.q-my-sm
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-list-box-outline')
              q-item-section Release Notes
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-bug-outline')
              q-item-section Report Issue
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-scale-balance')
              q-item-section View License
            q-separator.q-my-sm
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-lan-pending')
              q-item-section Check for Updates...
            q-separator.q-my-sm
            q-item(clickable)
              q-item-section(side)
                q-icon(name='mdi-information-outline')
              q-item-section About
      q-space
      q-btn(padding="xs sm" flat no-caps)
        span.text-body2 ada.lovelace@acme.org
        q-icon.q-ml-sm(name='mdi-account-circle')
  q-drawer.bg-grey-9.text-white(v-model='leftDrawerOpen' show-if-above bordered mini persistent)
    q-list
      q-item-label(header) Essential Links
      essential-link(v-for='link in essentialLinks' :key='link.title' v-bind='link')
  q-footer
    q-bar.bg-light-blue-10
      span.text-caption.text-light-blue-2 Markdown
  q-page-container
    router-view
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useQuasar } from 'quasar'
import EssentialLink from 'components/EssentialLink.vue'

const linksList = [
  {
    title: 'Test',
    caption: 'testing',
    icon: 'mdi-file-document-edit-outline',
    link: 'https://ietf.org'
  },
  {
    title: 'Test',
    caption: 'testing',
    icon: 'mdi-magnify',
    link: 'https://ietf.org'
  },
  {
    title: 'Test',
    caption: 'testing',
    icon: 'mdi-source-branch',
    link: 'https://ietf.org'
  },
  {
    title: 'Test',
    caption: 'testing',
    icon: 'mdi-wan',
    link: 'https://ietf.org'
  },
  {
    title: 'Test',
    caption: 'testing',
    icon: 'mdi-account-multiple',
    link: 'https://ietf.org'
  },
  {
    title: 'Test',
    caption: 'testing',
    icon: 'mdi-comment-check-outline',
    link: 'https://ietf.org'
  }
]

export default defineComponent({
  name: 'MainLayout',

  components: {
    EssentialLink
  },

  setup () {
    const leftDrawerOpen = ref(false)
    const $q = useQuasar()

    function minimize () {
      window.myWindowAPI?.minimize()
    }

    function toggleMaximize () {
      window.myWindowAPI?.toggleMaximize()
    }

    function closeApp () {
      window.myWindowAPI?.close()
    }

    return {
      essentialLinks: linksList,
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },
      minimize,
      toggleMaximize,
      closeApp,
      cmdKey: $q.platform.is.mac ? 'Cmd' : 'Ctrl'
    }
  }
})
</script>
