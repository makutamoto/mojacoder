import React from 'react'
import ReactMarkdown from 'react-markdown'
import Tex from '@matejmazur/react-katex'
import math from 'remark-math'

import Sample from './Sample'

export interface MarkdownProps {
    source: string
}

const Markdown: React.FC<MarkdownProps> = ({ source }) => {
    return (
        <ReactMarkdown
            className="text-break"
            source={source}
            plugins={[math]}
            renderers={{
                code: ({ language, value }) => (
                    <Sample title={language} value={value} />
                ),
                heading: (props) => {
                    const H = `h${Math.min(
                        6,
                        props.level + 1
                    )}` as React.ElementType
                    return (
                        <div>
                            <H>{props.children}</H>
                            <hr />
                        </div>
                    )
                },
                inlineMath: ({ value }) => <Tex math={value} />,
                math: ({ value }) => <Tex block math={value} />,
            }}
        />
    )
}
export default Markdown
