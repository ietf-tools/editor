import { find, flatten } from 'lodash-es'
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
  for (const [lineIdx, line] of textLines.entries()) {
    for (const match of line.matchAll(matchRgx)) {
      const dictEntry = find(dictionnary, d => d.triggers.includes(match[1].toLowerCase()))
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
    }
  }

  decorationsStore.get('inclusiveLanguage').set(decorations)

  return decorations.length
}
