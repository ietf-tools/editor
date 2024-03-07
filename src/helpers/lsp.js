import { MarkerSeverity } from 'monaco-editor/esm/vs/editor/editor.api'

/**
 * Convert a marker severity from an LSP server to a Monaco editor marker severity
 *
 * @param {number} severity LSP Marker Severity
 * @returns Monaco Marker Severity
 */
export function convertLSPSeverityToMonaco (severity) {
  switch (severity) {
    case 1:
      return MarkerSeverity.Error
    case 2:
      return MarkerSeverity.Warning
    case 3:
      return MarkerSeverity.Info
    default:
      return MarkerSeverity.Hint
  }
}

/**
 * Convert a range from LSP server to Monaco editor range
 *
 * @param {object} range LSP Range object
 * @returns Monaco Range object
 */
export function convertLSPRangeToMonaco (range) {
  return {
    startLineNumber: range.start.line + 1,
    startColumn: range.start.character + 1,
    endLineNumber: range.end.line + 1,
    endColumn: range.end.character + 1
  }
}
