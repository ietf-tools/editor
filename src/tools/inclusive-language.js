import { find, flatten } from 'lodash-es'
import { MarkerSeverity } from 'monaco-editor/esm/vs/editor/editor.api'

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

  const occurences = []
  for (const [lineIdx, line] of textLines.entries()) {
    for (const match of line.matchAll(matchRgx)) {
      const dictEntry = find(dictionnary, d => d.triggers.includes(match[1].toLowerCase()))
      occurences.push({
        message: `Consider using "${dictEntry.suggestion}" instead.`,
        severity: MarkerSeverity.Warning,
        startLineNumber: lineIdx + 1,
        startColumn: match.index + 2,
        endLineNumber: lineIdx + 1,
        endColumn: match.index + 2 + match[1].length,
        source: 'inclusive-language'
      })
    }
  }

  return occurences
}
