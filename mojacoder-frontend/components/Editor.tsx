import React, { useEffect, useState } from 'react'
import { Controlled } from 'react-codemirror2'

if (process.browser) {
    require('codemirror/mode/clike/clike')
    require('codemirror/mode/go/go')
    require('codemirror/mode/python/python')
    require('codemirror/mode/brainfuck/brainfuck')
    require('codemirror/mode/rust/rust')
}

const LANGUAGE_TO_MODE: { [index: string]: string } = {
    'python3.8': 'python',
    'go-1.14': 'text/x-go',
    'gcc-9.3.0': 'text/x-csrc',
    'g++-9.3.0': 'text/x-c++src',
    'csharp-mono-csc-3.6.0': 'text/x-csharp',
    'csharp-mono-mcs-6.12.0.107': 'text/x-csharp',
    'bf-20041219': 'text/x-brainfuck',
    cat: 'text/plain',
    'rust-1.43.0': 'text/x-rustsrc',
    'pypy3-7.3.1': 'python',
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
