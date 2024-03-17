/**
 * Registers custom themes for the Monaco editor.
 *
 * @param {object} monaco - The Monaco editor instance.
 */
export function registerThemes (monaco) {
  monaco.editor.defineTheme('ietf-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#070a0d',
      'editor.lineHighlightBackground': '#0d1117',
      'editorLineNumber.foreground': '#546e7a',
      'editorGutter.background': '#0d1117'
    }
  })
  monaco.editor.defineTheme('ietf-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {}
  })
}
