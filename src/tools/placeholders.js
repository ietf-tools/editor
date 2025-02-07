import { sortBy } from 'lodash-es'
import { decorationsStore } from 'src/stores/models'

export function checkCommonPlaceholders (text) {
  const matchRgx = /(?:[^a-z0-9]|RFC)(?<term>TBD|TBA|XX|YY|NN|MM|0000|TODO)(?:[^a-z0-9])/gi
  const textLines = text.split('\n')

  const decorations = []
  const occurences = []
  const details = []
  const termCount = {}
  for (const [lineIdx, line] of textLines.entries()) {
    for (const match of line.matchAll(matchRgx)) {
      const term = match[1].toLowerCase()
      const termStartIndex = match[0].indexOf(match[1])
      let occIdx = occurences.indexOf(term)
      if (occIdx < 0) {
        occIdx = occurences.push(term) - 1
      }
      decorations.push({
        options: {
          hoverMessage: {
            value: `Common placeholder term ${match[1]} detected.`
          },
          className: 'dec-warning',
          minimap: {
            position: 1
          },
          glyphMarginClassName: 'dec-warning-margin'
        },
        range: {
          startLineNumber: lineIdx + 1,
          startColumn: match.index + termStartIndex + 1,
          endLineNumber: lineIdx + 1,
          endColumn: match.index + termStartIndex + 1 + match[1].length
        }
      })
      details.push({
        key: crypto.randomUUID(),
        group: occIdx + 1,
        message: match[1].toLowerCase(),
        range: {
          startLineNumber: lineIdx + 1,
          startColumn: match.index + termStartIndex + 1,
          endLineNumber: lineIdx + 1,
          endColumn: match.index + termStartIndex + 1 + match[1].length
        }
      })
      if (termCount[term]) {
        termCount[term]++
      } else {
        termCount[term] = 1
      }
    }
  }

  decorationsStore.get('placeholders').set(decorations)

  return {
    count: decorations.length,
    details: sortBy(details, d => d.range.startLineNumber),
    hasTextOutput: true,
    getTextOutput: () => {
      return `Placeholders
-------------
${Object.entries(termCount).map(([k, v]) => `${k} (${v})`).join('\n')}
`
    }
  }
}
