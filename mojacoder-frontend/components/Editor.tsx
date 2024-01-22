import React, { useEffect, useState } from 'react'
import { Controlled } from 'react-codemirror2'

if (process.browser) {
    require('codemirror/addon/display/autorefresh')

    require('codemirror/mode/markdown/markdown')
    require('codemirror/mode/clike/clike')
    require('codemirror/mode/go/go')
    require('codemirror/mode/python/python')
    require('codemirror/mode/brainfuck/brainfuck')
    require('codemirror/mode/rust/rust')
    require('codemirror/mode/commonlisp/commonlisp')
}

export const LANGUAGE_TO_MODE: { [index: string]: string } = {
    markdown: 'text/x-markdown',

    'python3.8': 'python',
    'pypy3-7.3.1': 'python',
    python: 'python',
    py: 'python',

    'go-1.14': 'text/x-go',
    go: 'text/x-go',

    'gcc-9.3.0': 'text/x-csrc',
    c: 'text/x-csrc',

    'g++-9.3.0': 'text/x-c++src',
    cpp: 'text/x-c++src',

    'csharp-mono-csc-3.6.0': 'text/x-csharp',
    'csharp-mono-mcs-6.12.0.107': 'text/x-csharp',
    csharp: 'text/x-csharp',
    cs: 'text/x-csharp',

    'bf-20041219': 'text/x-brainfuck',
    brainfuck: 'text/x-brainfuck',

    cat: 'text/plain',
    text: 'text/plain',

    'rust-1.43.0': 'text/x-rustsrc',
    rust: 'text/x-rustsrc',

    'ruby-2.7': 'text/x-ruby',
    ruby: 'text/x-ruby',

    'java-11': 'text/x-java',
    java: 'text/x-java',

    'j-902': 'text/plain',
    j: 'text/plain',

    'kotlin-1.4': 'text/x-kotlin',
    kotlin: 'text/x-kotlin',

    'commonlisp-2.0': 'text/x-common-lisp',
    commonlisp: 'text/x-common-lisp',
}

const LangAlias = {
    'text/x-markdown': ['markdown'],
    'text/x-go': [/go/],
    python: [/py/],
    'text/x-csrc': [/gcc/, 'c'],
    'text/x-c++src': [/g\+\+/, 'cpp'],
    'text/x-csharp': [/csharp/, 'cs'],
    'text/x-brainfuck': ['bf-20041219', 'bf'],
    'text/plain': ['cat', 'txt', 'text'],
    'text/x-rustsrc': [/rust/, 'rs'],
    'text/x-ruby': [/ruby/, 'rb'],
    'text/x-java': [/java/],
    'text/x-kotlin': [/kotlin/],
    'text/x-common-lisp': [/lisp/],
}

function toCodemirrorMode(value) {
    for (const [key, aliases] of Object.entries(LangAlias)) {
        for (const alias of aliases) {
            if (
                (alias instanceof RegExp && alias.test(value)) ||
                alias === value
            ) {
                return key
            }
        }
    }
    return 'text/plain'
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
                        autoRefresh: true,
                        mode: toCodemirrorMode(props.lang),
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
