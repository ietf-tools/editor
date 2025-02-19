import { decorationsStore } from 'src/stores/models'

export function checkNonAscii (text, ignores = []) {
  // eslint-disable-next-line no-control-regex
  const matchRgx = /[^\x00-\x7F]+/gi
  const textLines = text.split('\n')

  const decorations = []
  for (const [lineIdx, line] of textLines.entries()) {
    for (const match of line.matchAll(matchRgx)) {
      decorations.push({
        options: {
          hoverMessage: {
            value: 'Non-ASCII character(s) detected.'
          },
          className: 'dec-info',
          minimap: {
            position: 1
          },
          glyphMarginClassName: 'dec-info-margin'
        },
        range: {
          startLineNumber: lineIdx + 1,
          startColumn: match.index + 1,
          endLineNumber: lineIdx + 1,
          endColumn: match.index + 1 + match[0].length
        }
      })
    }
  }

  decorationsStore.get('nonAscii').set(decorations)

  return decorations.length
}
