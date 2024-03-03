import { MarkerSeverity } from 'monaco-editor/esm/vs/editor/editor.api'

export function checkNonAscii (text) {
  // eslint-disable-next-line no-control-regex
  const matchRgx = /[^\x00-\x7F]+/gi
  const textLines = text.split('\n')

  const occurences = []
  for (const [lineIdx, line] of textLines.entries()) {
    for (const match of line.matchAll(matchRgx)) {
      occurences.push({
        message: 'Non-ASCII character(s) detected.',
        severity: MarkerSeverity.Error,
        startLineNumber: lineIdx + 1,
        startColumn: match.index + 1,
        endLineNumber: lineIdx + 1,
        endColumn: match.index + 1 + match[0].length,
        source: 'non-ascii'
      })
    }
  }

  return occurences
}
