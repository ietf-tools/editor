import { sortBy } from 'lodash-es'
import { decorationsStore } from 'src/stores/models'

export function checkRepeatedWords (text, ignores = []) {
  const matchRgx = /\b(\w+)\s+\1\b/gi
  const textLines = text.split('\n')

  const decorations = []
  const occurences = []
  const details = []
  const termCount = {}
  for (const [lineIdx, line] of textLines.entries()) {
    for (const match of line.matchAll(matchRgx)) {
      const term = match[1].toLowerCase()
      if (ignores.includes(term)) {
        continue
      }
      let occIdx = occurences.indexOf(term)
      if (occIdx < 0) {
        occIdx = occurences.push(term) - 1
      }
      decorations.push({
        options: {
          hoverMessage: {
            value: `Repeated term "${match[1]}" detected.`
          },
          className: 'dec-warning',
          minimap: {
            position: 1
          },
          glyphMarginClassName: 'dec-warning-margin'
        },
        range: {
          startLineNumber: lineIdx + 1,
          startColumn: match.index + 1,
          endLineNumber: lineIdx + 1,
          endColumn: match.index + 1 + match[0].length
        }
      })
      details.push({
        key: crypto.randomUUID(),
        group: occIdx + 1,
        message: match[1].toLowerCase(),
        range: {
          startLineNumber: lineIdx + 1,
          startColumn: match.index + 1,
          endLineNumber: lineIdx + 1,
          endColumn: match.index + 1 + match[0].length
        },
        value: term
      })
      if (termCount[term]) {
        termCount[term]++
      } else {
        termCount[term] = 1
      }
    }
  }

  decorationsStore.get('repeatedWords').set(decorations)

  return {
    count: decorations.length,
    details: sortBy(details, d => d.range.startLineNumber),
    hasTextOutput: true,
    getTextOutput: () => {
      return `Repeated Words
-------------
${Object.entries(termCount).map(([k, v]) => `${k} (${v})`).join('\n')}
`
    }
  }
}
