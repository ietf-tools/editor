import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
// import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'

export default ({ app }) => {
  self.MonacoEnvironment = {
    getWorker (_, label) {
      // if (label === 'json') {
      //   return new JsonWorker()
      // }
      return new EditorWorker()
    }
  }
}
