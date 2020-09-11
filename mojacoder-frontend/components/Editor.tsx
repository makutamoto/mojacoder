import React from 'react'
import { Controlled as CodeMirror } from 'react-codemirror2'

export interface EditorProps {
  value: string
  readOnly?: boolean
  onChange?: (value: string) => void
}

const Editor: React.FC<EditorProps> = (props) => {
  return (
    <CodeMirror
      className="my-2"
      value={props.value}
      options={{
        readOnly: props.readOnly,
      }}
      onBeforeChange={(_editor, _data, value) => props.onChange(value)}
    />
  )
}

export default Editor
