import { find, flatten, sortBy } from 'lodash-es'
import { decorationsStore } from 'src/stores/models'

const dictionnary = [
  {
    triggers: ['whitelist'],
    suggestion: 'allowlist or passlist'
  },
  {
    triggers: ['blacklist'],
    suggestion: 'denylist or blocklist'
  },
  {
    triggers: ['master'],
    suggestion: 'primary, main, host, leader or orchestrator'
  },
  {
    triggers: ['slave'],
    suggestion: 'secondary, replica, target, follower or worker'
  },
  {
    triggers: ['native'],
    suggestion: 'built-in'
  },
  {
    triggers: ['grandfather'],
    suggestion: 'exemption or approve'
  },
  {
    triggers: ['he/she', 'he or she'],
    suggestion: 'they'
  },
  {
    triggers: ['cripple', 'handicap'],
    suggestion: 'impair or impeded'
  }
]

export function checkInclusiveLanguage (text) {
  const matchRgx = new RegExp(`[<> "'.:;=([{-](${flatten(dictionnary.map(d => d.triggers)).join('|')})`, 'gi')
  const textLines = text.split('\n')

  const decorations = []
  const occurences = []
  const details = []
  const termCount = {}
  for (const [lineIdx, line] of textLines.entries()) {
    for (const match of line.matchAll(matchRgx)) {
      const term = match[1].toLowerCase()
      const dictEntry = find(dictionnary, d => d.triggers.includes(term))
      let occIdx = occurences.indexOf(term)
      if (occIdx < 0) {
        occIdx = occurences.push(term) - 1
      }
      decorations.push({
        options: {
          hoverMessage: {
            value: `Consider using ${dictEntry.suggestion} instead.`
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
          endColumn: match.index + 1 + match[0].length
        }
      })
      details.push({
        key: crypto.randomUUID(),
        group: occIdx + 1,
        message: match[1].toLowerCase(),
        range: {
          startLineNumber: lineIdx + 1,
          startColumn: match.index + 2,
          endLineNumber: lineIdx + 1,
          endColumn: match.index + 1 + match[0].length
        }
      })
      if (termCount[term]) {
        termCount[term]++
      } else {
        termCount[term] = 1
      }
    }
  }

  decorationsStore.get('inclusiveLanguage').set(decorations)

  return {
    count: decorations.length,
    details: sortBy(details, d => d.range.startLineNumber),
    hasTextOutput: true,
    getTextOutput: () => {
      return `Inclusive Language
-------------
${Object.entries(termCount).map(([k, v]) => `${k} (${v})`).join('\n')}
`
    }
  }
}
