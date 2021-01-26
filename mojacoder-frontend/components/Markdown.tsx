import React from 'react'
import ReactMarkdown from 'react-markdown'
import Tex from '@matejmazur/react-katex'
import math from 'remark-math'
import clsx from 'clsx'

import Sample from './Sample'
import { LANGUAGE_TO_MODE } from './Editor'

import styles from './Markdown.module.css'

export interface MarkdownProps {
    source: string
    preventLastMargin?: boolean
}

const Markdown: React.FC<MarkdownProps> = ({ source, preventLastMargin }) => {
    return (
        <ReactMarkdown
            className={clsx(
                'text-break',
                preventLastMargin && styles.paragraph
            )}
            source={source}
            plugins={[math]}
            renderers={{
                code: ({ language, value }) => {
                    const [langTemp, ...titleTemp] = language?.split(':') || [
                        '',
                    ]
                    let lang = langTemp
                    let title = titleTemp.join(':')
                    if (lang !== 'md' && LANGUAGE_TO_MODE[lang] === undefined) {
                        lang = ''
                        title = language
                    }
                    return <Sample lang={lang} title={title} value={value} />
                },
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
