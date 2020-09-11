import React from 'react'
import { Controlled as CodeMirror } from 'react-codemirror2'

import LanguageSelector from './LanguageSelector'

if (process.browser) {
  require('codemirror/mode/clike/clike')
  require('codemirror/mode/go/go')
  require('codemirror/mode/python/python')
  require('codemirror/mode/markdown/markdown')
}

export interface Code {
  lang: string
  code: string
}

export interface CodeEditorProps {
  id: string
  value: Code
  onChange: (value: Code) => void
}

const LANGUAGE_TO_MODE: { [index: string]: string } = {
  'python3.8': 'python',
  'go-1.14': 'text/x-go',
}

const CodeEditor: React.FC<CodeEditorProps> = (props) => {
  return (
    <div>
      <LanguageSelector
        id={props.id}
        value={props.value.lang}
        onChange={(lang) => props.onChange({ ...props.value, lang })}
      />
      <CodeMirror
        className="my-2"
        value={props.value.code}
        options={{
          mode: LANGUAGE_TO_MODE[props.value.lang],
          lineNumbers: true,
        }}
        onBeforeChange={(_editor, _data, value) =>
          props.onChange({ ...props.value, code: value })
        }
      />
    </div>
  )
}

export default CodeEditor
