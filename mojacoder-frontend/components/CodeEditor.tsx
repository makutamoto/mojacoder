import React from 'react'

import LanguageSelector from './LanguageSelector'
import Editor from './Editor'

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
            <Editor
                mode={LANGUAGE_TO_MODE[props.value.lang]}
                lineNumbers
                value={props.value.code}
                onChange={(value) =>
                    props.onChange({ ...props.value, code: value })
                }
            />
        </div>
    )
}

export default CodeEditor
