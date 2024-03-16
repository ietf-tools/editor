import * as monaco from 'monaco-editor'

const completionItemKindMapping = [
  null,
  monaco.languages.CompletionItemKind.Text,
  monaco.languages.CompletionItemKind.Method,
  monaco.languages.CompletionItemKind.Function,
  monaco.languages.CompletionItemKind.Constructor,
  monaco.languages.CompletionItemKind.Field,
  monaco.languages.CompletionItemKind.Variable,
  monaco.languages.CompletionItemKind.Class,
  monaco.languages.CompletionItemKind.Interface,
  monaco.languages.CompletionItemKind.Module,
  monaco.languages.CompletionItemKind.Property,
  monaco.languages.CompletionItemKind.Unit,
  monaco.languages.CompletionItemKind.Value,
  monaco.languages.CompletionItemKind.Enum,
  monaco.languages.CompletionItemKind.Keyword,
  monaco.languages.CompletionItemKind.Snippet,
  monaco.languages.CompletionItemKind.Color,
  monaco.languages.CompletionItemKind.File,
  monaco.languages.CompletionItemKind.Reference,
  monaco.languages.CompletionItemKind.Folder,
  monaco.languages.CompletionItemKind.EnumMember,
  monaco.languages.CompletionItemKind.Constant,
  monaco.languages.CompletionItemKind.Struct,
  monaco.languages.CompletionItemKind.Event,
  monaco.languages.CompletionItemKind.Operator,
  monaco.languages.CompletionItemKind.TypeParameter
]

const symbolKindMapping = [
  null,
  monaco.languages.SymbolKind.File,
  monaco.languages.SymbolKind.Module,
  monaco.languages.SymbolKind.Namespace,
  monaco.languages.SymbolKind.Package,
  monaco.languages.SymbolKind.Class,
  monaco.languages.SymbolKind.Method,
  monaco.languages.SymbolKind.Property,
  monaco.languages.SymbolKind.Field,
  monaco.languages.SymbolKind.Constructor,
  monaco.languages.SymbolKind.Enum,
  monaco.languages.SymbolKind.Interface,
  monaco.languages.SymbolKind.Function,
  monaco.languages.SymbolKind.Variable,
  monaco.languages.SymbolKind.Constant,
  monaco.languages.SymbolKind.String,
  monaco.languages.SymbolKind.Number,
  monaco.languages.SymbolKind.Boolean,
  monaco.languages.SymbolKind.Array,
  monaco.languages.SymbolKind.Object,
  monaco.languages.SymbolKind.Key,
  monaco.languages.SymbolKind.Null,
  monaco.languages.SymbolKind.EnumMember,
  monaco.languages.SymbolKind.Struct,
  monaco.languages.SymbolKind.Event,
  monaco.languages.SymbolKind.Operator,
  monaco.languages.SymbolKind.TypeParameter
]

/**
 * Convert a marker severity from an LSP server to a Monaco editor marker severity
 *
 * @param {number} severity LSP Marker Severity
 * @returns Monaco Marker Severity
 */
export function convertLSPSeverityToMonaco (severity) {
  switch (severity) {
    case 1:
      return monaco.MarkerSeverity.Error
    case 2:
      return monaco.MarkerSeverity.Warning
    case 3:
      return monaco.MarkerSeverity.Info
    default:
      return monaco.MarkerSeverity.Hint
  }
}

/**
 * Converts a Monaco severity value to an LSP severity value.
 *
 * @param {number} severity - The Monaco severity value.
 * @returns {number} The corresponding LSP severity value.
 */
export function convertMonacoSeverityToLSP (severity) {
  switch (severity) {
    case monaco.MarkerSeverity.Error:
      return 1
    case monaco.MarkerSeverity.Warning:
      return 2
    case monaco.MarkerSeverity.Info:
      return 3
    default:
      return 4
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

/**
 * Convert a folding range kind from LSP server to Monaco editor folding range kind
 *
 * @param {string} kind LSP Folding Range Kind
 * @returns Monaco Folding Range Kind
 */
export function convertLSPFoldingRangeKindToMonaco (kind) {
  switch (kind) {
    case 'comment':
      return monaco.languages.FoldingRangeKind.Comment
    case 'imports':
      return monaco.languages.FoldingRangeKind.Imports
    case 'region':
      return monaco.languages.FoldingRangeKind.Region
    default:
      return monaco.languages.FoldingRangeKind.Other
  }
}

/**
 * Convert a completion item kind from LSP server to Monaco editor completion item kind
 *
 * @param {number} kind LSP Completion Item Kind
 * @returns Monaco Completion Item Kind
 */
export function convertLSPCompletionItemKindToMonaco (kind) {
  return completionItemKindMapping[kind] ?? monaco.languages.CompletionItemKind.Text
}

/**
 * Converts LSP completion items to Monaco suggestions.
 *
 * @param {Object} resp The response object containing LSP completion items.
 * @returns {Object} Monaco CompletionList.
 */
export function convertLSPCompletionItemsToMonaco (resp) {
  const itemDefaults = handleCompletionItemProperties({}, resp.itemDefaults)

  return {
    incomplete: resp.isIncomplete,
    suggestions: resp.items.map(c => ({
      ...itemDefaults,
      ...handleCompletionItemProperties(itemDefaults, c)
    }))
  }
}

/**
 * Converts a LSP completion item into a Monaco CompletionItem
 *
 * @param {Object} props LSP completion item.
 * @returns {Object} Monaco CompletionItem
 */
function handleCompletionItemProperties (itemDefaults, props) {
  const item = {
    insertTextRules: itemDefaults.insertTextRules ?? 0
  }

  if (props.commitCharacters?.length) {
    item.commitCharacters = props.commitCharacters
  }
  if (props.detail) {
    item.detail = props.detail
  }
  if (props.documentation) {
    if (typeof props.documentation === 'string' || props.documentation?.kind === 'plaintext') {
      item.documentation = props.documentation
    } else if (props.documentation?.kind === 'markdown') {
      item.documentation = {
        value: props.documentation.value
      }
    }
  }
  if (props.filterText) {
    item.filterText = props.filterText
  }
  if (props.textEditText) {
    item.insertText = props.textEditText
  }
  if (props.insertTextFormat === 2) {
    item.insertTextRules = item.insertTextRules | 4
  }
  if (props.insertTextMode === 2) {
    item.insertTextRules = item.insertTextRules | 1
  }
  if (props.kind) {
    item.kind = completionItemKindMapping[props.kind] ?? monaco.languages.CompletionItemKind.Text
  }
  if (props.label) {
    item.label = props.label
  }
  if (props.preselect) {
    item.preselect = props.preselect
  }
  if (props.editRange) {
    item.range = {
      startLineNumber: props.editRange.start.line + 1,
      startColumn: props.editRange.start.character + 1,
      endLineNumber: props.editRange.end.line + 1,
      endColumn: props.editRange.end.character + 1
    }
  }
  if (props.sortText) {
    item.sortText = props.sortText
  }

  return item
}

/**
 * Convert an LSP SymbolKind to Monaco editor SymbolKind
 *
 * @param {number} kind LSP SymbolKind
 * @returns Monaco SymbolKind
 */
export function convertLSPSymbolKindToMonaco (kind) {
  return symbolKindMapping[kind] ?? monaco.languages.SymbolKind.Property
}

/**
 * Converts LSP document symbols to Monaco symbols.
 *
 * @param {Array} items - The array of LSP document symbols to be converted.
 * @returns {Array} - The array of converted Monaco symbols.
 */
export function convertLSPDocumentSymbolsToMonaco (items) {
  return items.map(s => ({
    name: s.name,
    range: {
      endColumn: s.range.end.character + 1,
      endLineNumber: s.range.end.line + 1,
      startColumn: s.range.start.character + 1,
      startLineNumber: s.range.start.line + 1
    },
    selectionRange: {
      endColumn: s.selectionRange.end.character + 1,
      endLineNumber: s.selectionRange.end.line + 1,
      startColumn: s.selectionRange.start.character + 1,
      startLineNumber: s.selectionRange.start.line + 1
    },
    kind: symbolKindMapping[s.kind] ?? monaco.languages.SymbolKind.Property,
    ...s.detail && { detail: s.detail },
    ...s.children && { children: convertLSPDocumentSymbolsToMonaco(s.children) }
  }))
}
