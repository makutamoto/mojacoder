import React from 'react'

import Markdown from './Markdown'
import CopyButton from './CopyButton'
import Editor from './Editor'

interface Props {
    lang: string
    title: string
    value: string
}

const Sample: React.FC<Props> = ({ lang, title, value }) => {
    return (
        <div className="my-2 p-2 border rounded bg-light">
            <h6 className="d-inline">{title}</h6>
            <CopyButton className="px-1 py-0" variant="light" value={value} />
            {lang ? (
                lang === 'md' ? (
                    <div
                        {...({ readonly: 'true' } as any)}
                        className="form-control mt-1 mb-0 h-100"
                    >
                        <Markdown source={value} preventLastMargin />
                    </div>
                ) : (
                    <Editor lang={lang} value={value} lineNumbers readOnly />
                )
            ) : (
                <pre
                    {...({ readonly: 'true' } as any)}
                    className="form-control mt-1 mb-0 h-100"
                >
                    {value}
                </pre>
            )}
        </div>
    )
}
export default Sample
