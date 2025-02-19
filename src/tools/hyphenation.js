import { decorationsStore } from 'src/stores/models'
import { repeat, sortBy } from 'lodash-es'

const hyphenTermRgx = /[a-z]+(?:-[a-z]+)+/gi
const targetPropRgx = / target="([^"]+?)"/gi

export function checkHyphenation (text, ignores = []) {
  const textLines = text.split('\n').map(line => {
    return line.replaceAll(targetPropRgx, (m, val) => {
      return ` target="${repeat(' ', val.length)}"`
    })
  })

  const decorations = []
  const details = []
  const occurences = []
  const hyphenTerms = []
  const hyphenTermsOccurences = []
  const termCount = {}
  for (const [lineIdx, line] of textLines.entries()) {
    for (const match of line.matchAll(hyphenTermRgx)) {
      if (match[0].length > 3) {
        const termLower = match[0].toLowerCase()
        if (ignores.includes(termLower)) {
          continue
        }
        if (!hyphenTerms.includes(termLower)) {
          hyphenTerms.push(termLower)
        }
        hyphenTermsOccurences.push({
          term: termLower,
          range: {
            startLineNumber: lineIdx + 1,
            startColumn: match.index + 1,
            endLineNumber: lineIdx + 1,
            endColumn: match.index + 1 + match[0].length
          }
        })
      }
    }
  }

  if (hyphenTerms.length > 0) {
    for (const [lineIdx, line] of textLines.entries()) {
      for (const term of hyphenTerms) {
        const altTerm = term.replaceAll('-', '')
        const altTermRgx = new RegExp(`(?:^|[>" ])(${altTerm})(?:[. "<]|$)`, 'gi')
        for (const match of line.matchAll(altTermRgx)) {
          const matchLower = match[1].toLowerCase()
          let occIdx = occurences.indexOf(term)
          if (occIdx < 0) {
            occIdx = occurences.push(term) - 1
            for (const termOcc of hyphenTermsOccurences.filter(t => t.term === term)) {
              decorations.push({
                options: {
                  hoverMessage: {
                    value: `[${occIdx + 1}] Inconsistent Hyphenation (Alternate of ${altTerm})`
                  },
                  className: 'dec-warning',
                  minimap: {
                    position: 1
                  },
                  glyphMarginClassName: 'dec-warning-margin'
                },
                range: termOcc.range
              })
              details.push({
                key: crypto.randomUUID(),
                group: occIdx + 1,
                message: `${term} has alternate term(s)`,
                range: termOcc.range,
                value: term
              })
            }
            if (termCount[term]) {
              termCount[term]++
            } else {
              termCount[term] = 1
            }
          }
          decorations.push({
            options: {
              hoverMessage: {
                value: `[${occIdx + 1}] Inconsistent Hyphenation (Alternate of ${term})`
              },
              className: 'dec-warning',
              minimap: {
                position: 1
              },
              glyphMarginClassName: 'dec-warning-margin'
            },
            range: {
              startLineNumber: lineIdx + 1,
              startColumn: match.index + 2,
              endLineNumber: lineIdx + 1,
              endColumn: match.index + match[0].length
            }
          })
          details.push({
            key: crypto.randomUUID(),
            group: occIdx + 1,
            message: `${matchLower} is alternate of ${term}`,
            range: {
              startLineNumber: lineIdx + 1,
              startColumn: match.index + 2,
              endLineNumber: lineIdx + 1,
              endColumn: match.index + match[0].length
            },
            value: matchLower
          })
          if (termCount[matchLower]) {
            termCount[matchLower]++
          } else {
            termCount[matchLower] = 1
          }
        }
      }
    }
  }

  decorationsStore.get('hyphenation').set(decorations)

  return {
    count: details.length,
    details: sortBy(details, d => d.range.startLineNumber),
    hasTextOutput: true,
    getTextOutput: () => {
      return `Hyphenation
-------------
${Object.entries(termCount).map(([k, v]) => `${k} (${v})`).join('\n')}
`
    }
  }
}
