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

const CodeEditor: React.FC<CodeEditorProps> = (props) => {
    return (
        <div>
            <LanguageSelector
                id={props.id}
                value={props.value.lang}
                onChange={(lang) => props.onChange({ ...props.value, lang })}
            />
            <Editor
                lang={props.value.lang}
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
