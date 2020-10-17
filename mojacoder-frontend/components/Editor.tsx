import React, { useEffect, useState } from 'react'
import { Controlled } from 'react-codemirror2'

if (process.browser) {
    require('codemirror/mode/clike/clike')
    require('codemirror/mode/go/go')
    require('codemirror/mode/python/python')
    require('codemirror/mode/markdown/markdown')
}

export interface EditorProps {
    mode?: string
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
                        mode: props.mode,
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
