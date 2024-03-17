import { useEditorStore } from 'src/stores/editor'
import { checkNits } from '@ietf-tools/idnits'

const editorStore = useEditorStore()

export function handleEditorAction (editor, action) {
  switch (action) {
    case 'addCursorAbove': {
      editor.focus()
      setTimeout(() => {
        editor.trigger('menu', 'editor.action.insertCursorAbove')
      })
      break
    }
    case 'addCursorBelow': {
      editor.focus()
      setTimeout(() => {
        editor.trigger('menu', 'editor.action.insertCursorBelow')
      })
      break
    }
    case 'addCursorsToLineEnds': {
      editor.focus()
      setTimeout(() => {
        editor.trigger('menu', 'editor.action.insertCursorAtEndOfEachLineSelected')
      })
      break
    }
    case 'addNextOccurence': {
      editor.focus()
      setTimeout(() => {
        editor.trigger('menu', 'editor.action.addSelectionToNextFindMatch')
      })
      break
    }
    case 'addPreviousOccurence': {
      editor.focus()
      setTimeout(() => {
        editor.trigger('menu', 'editor.action.addSelectionToPreviousFindMatch')
      })
      break
    }
    case 'checkIdNits': {
      validateContent()
      break
    }
    case 'commandPalette': {
      editor.focus()
      setTimeout(() => {
        editor.trigger('menu', 'editor.action.quickCommand')
      })
      break
    }
    case 'copyLineDown': {
      editor.focus()
      setTimeout(() => {
        editor.trigger('menu', 'editor.action.copyLinesDownAction')
      })
      break
    }
    case 'copyLineUp': {
      editor.focus()
      setTimeout(() => {
        editor.trigger('menu', 'editor.action.copyLinesUpAction')
      })
      break
    }
    case 'duplicateSelection': {
      editor.focus()
      setTimeout(() => {
        editor.trigger('menu', 'editor.action.duplicateSelection')
      })
      break
    }
    case 'expandSelection': {
      editor.focus()
      setTimeout(() => {
        editor.trigger('menu', 'editor.action.smartSelect.expand')
      })
      break
    }
    case 'find': {
      editor.trigger('menu', 'actions.find')
      break
    }
    case 'findAndReplace': {
      editor.trigger('menu', 'editor.action.startFindReplaceAction')
      break
    }
    case 'findNext': {
      editor.trigger('menu', 'editor.action.nextMatchFindAction')
      break
    }
    case 'findPrevious': {
      editor.trigger('menu', 'editor.action.previousMatchFindAction')
      break
    }
    case 'format': {
      editor.trigger('menu', 'editor.action.formatDocument')
      break
    }
    case 'markerNext': {
      editor.trigger('menu', 'editor.action.marker.next')
      break
    }
    case 'moveLineDown': {
      editor.focus()
      setTimeout(() => {
        editor.trigger('menu', 'editor.action.moveLinesDownAction')
      })
      break
    }
    case 'moveLineUp': {
      editor.focus()
      setTimeout(() => {
        editor.trigger('menu', 'editor.action.moveLinesUpAction')
      })
      break
    }
    case 'previewPane': {
      editorStore.previewPaneShown = !editorStore.previewPaneShown
      break
    }
    case 'redo': {
      editor.trigger('menu', 'redo')
      editor.focus()
      break
    }
    case 'selectAll': {
      editor.focus()
      setTimeout(() => {
        const range = editor.getModel().getFullModelRange()
        editor.setSelection(range)
      })
      break
    }
    case 'selectAllOccurences': {
      editor.focus()
      setTimeout(() => {
        editor.trigger('menu', 'editor.action.selectHighlights')
      })
      break
    }
    case 'shrinkSelection': {
      editor.focus()
      setTimeout(() => {
        editor.trigger('menu', 'editor.action.smartSelect.shrink')
      })
      break
    }
    case 'undo': {
      editor.trigger('menu', 'undo')
      editor.focus()
      break
    }
    case 'wordWrap': {
      editorStore.wordWrap = !editorStore.wordWrap
      break
    }
    case 'zoomIn': {
      editor.focus()
      setTimeout(() => {
        editor.trigger('menu', 'editor.action.fontZoomIn')
      })
      break
    }
    case 'zoomOut': {
      editor.focus()
      setTimeout(() => {
        editor.trigger('menu', 'editor.action.fontZoomOut')
      })
      break
    }
    case 'zoomReset': {
      editor.focus()
      setTimeout(() => {
        editor.trigger('menu', 'editor.action.fontZoomReset')
      })
      break
    }
  }
}

async function validateContent () {
  const enc = new TextEncoder()
  const result = await checkNits(enc.encode(editorStore.content).buffer, 'draft-ietf-ccamp-mw-topo-yang-08.xml', {
    mode: 'normal',
    offline: false
  })
  console.info(result)
}
