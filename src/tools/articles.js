import { MarkerSeverity } from 'monaco-editor/esm/vs/editor/editor.api'

export function checkArticles (text) {
  const partARgx = /(?<!(?:[aA]ppendix|[cC]onnection|[lL]ink|[nN]ode|Operator)) (?!(?:[aA] (?:AAA|Europe|[oO]ne|U[A-Z]|U-label|[uU]biquitous|[uU]nicast|[uU]nicode|[uU]nidir|[uU]nif|[uU]nion|[uU]nique|[uU]nit|[uU]nivers|[uU]sable|[uU]sability|[uU]sage|[uU]se|[uU]tility)|a uCDN|A and))[aA] [aeiouAEIOU]/g
  const partARRgx = /(?!(?:[aA] (?:RADIUS|RECEIVE|RECOMMENDED|REFER|RELOAD|RST|REALM|RESERVATION|REQUEST|RESET|ROUTE|RPL)))[aA] R[A-Z]/g
  const partBRgx = / (?!(?:[aA]n (?:hour|honest|honor|Mtrace|x-coordinate|x coordinate|A[A-Z]|E[A-Z]|F[A-Z]|H[A-Z]|I[A-Z]|L[A-Z]|L[0-9][A-Z]|M[A-Z]|N[A-Z]|O[A-Z]|R[A-Z]|R[0-9]|S[A-Z]|X[A-Z]|X\.509|xTR)))[aA]n [b-df-hj-np-tv-zB-DF-HJ-NP-TV-Z]/g
  const partCRgx = /[aA]n (?:AAA|FEC|FIR|LIS|LRDD|MEG|MEP|MRHOF|MIC|NAPTR|NAT|NAS|RAS|ROHC|RPL|RST|SAFI|SCSI|SID|SIP|SMPTE|SYN|rinit)/g
  const partCLFRgx = /[aA]n LF /g
  const textLines = text.split('\n')

  const occurences = []
  for (const [lineIdx, line] of textLines.entries()) {
    for (const match of line.matchAll(partARgx)) {
      occurences.push({
        message: 'Bad indefinite article usage detected. Consider using "an" instead of "a".',
        severity: MarkerSeverity.Warning,
        startLineNumber: lineIdx + 1,
        startColumn: match.index + 2,
        endLineNumber: lineIdx + 1,
        endColumn: match.index + 1 + match[0].length,
        source: 'articles (part 1-A)'
      })
    }
    for (const match of line.matchAll(partARRgx)) {
      occurences.push({
        message: 'Bad indefinite article usage detected. Consider using "an" instead of "a".',
        severity: MarkerSeverity.Warning,
        startLineNumber: lineIdx + 1,
        startColumn: match.index + 1,
        endLineNumber: lineIdx + 1,
        endColumn: match.index + 1 + match[0].length,
        source: 'articles (part 1-B)'
      })
    }
    for (const match of line.matchAll(partBRgx)) {
      occurences.push({
        message: 'Bad indefinite article usage detected. Consider using "a" instead of "an".',
        severity: MarkerSeverity.Warning,
        startLineNumber: lineIdx + 1,
        startColumn: match.index + 2,
        endLineNumber: lineIdx + 1,
        endColumn: match.index + 1 + match[0].length,
        source: 'articles (part 2)'
      })
    }
    for (const match of line.matchAll(partCRgx)) {
      occurences.push({
        message: 'Bad indefinite article usage detected. Consider using "a" instead of "an".',
        severity: MarkerSeverity.Warning,
        startLineNumber: lineIdx + 1,
        startColumn: match.index + 1,
        endLineNumber: lineIdx + 1,
        endColumn: match.index + 1 + match[0].length,
        source: 'articles (part 3-A)'
      })
    }
    for (const match of line.matchAll(partCLFRgx)) {
      occurences.push({
        message: 'Bad indefinite article usage detected. Consider using "a LF" instead of "an LF".',
        severity: MarkerSeverity.Warning,
        startLineNumber: lineIdx + 1,
        startColumn: match.index + 1,
        endLineNumber: lineIdx + 1,
        endColumn: match.index + match[0].length,
        source: 'articles (part 3-B)'
      })
    }
  }

  return occurences
}
