import React, { useEffect, useState } from 'react'
import { Controlled } from 'react-codemirror2'

if (process.browser) {
    require('codemirror/mode/clike/clike')
    require('codemirror/mode/go/go')
    require('codemirror/mode/python/python')
    require('codemirror/mode/markdown/markdown')
}

const LANGUAGE_TO_MODE: { [index: string]: string } = {
    'python3.8': 'python',
    'go-1.14': 'text/x-go',
}

export interface EditorProps {
    lang?: string
    lineNumbers?: boolean
    readOnly?: boolean
    value?: string
    onChange?: (value: string) => void
}

const Editor: React.FC<EditorProps> = (props) => {
    const [browser, setBrowser] = useState(false)
    useEffect(() => setBrowser(true))
    return (
        <>
            {browser && (
                <Controlled
                    className="my-2"
                    value={props.value}
                    options={{
                        mode: LANGUAGE_TO_MODE[props.lang],
                        lineNumbers: props.lineNumbers,
                        readOnly: props.readOnly,
                    }}
                    onBeforeChange={(_editor, _data, value) =>
                        props.onChange && props.onChange(value)
                    }
                />
            )}
        </>
    )
}

export default Editor
