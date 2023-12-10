import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGFM from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import clsx from 'clsx'
import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root, Properties } from 'hast'

import Sample from './Sample'
import { LANGUAGE_TO_MODE } from './Editor'
import styles from './Markdown.module.css'
import mdStyle from '../css/MarkdownStyle.module.css'

export interface MarkdownProps {
    source: string
    preventLastMargin?: boolean
}

const rehypeInlineCodeProperty: Plugin<[], Root> = () => {
    return (tree) => {
        visit(tree, 'element', (node, index, parent) => {
            if (node.tagName !== 'code') return
            if (parent && parent.tagName === 'pre') {
                parent.tagName = 'div'
            } else {
                const properties: Properties = node.properties || {}
                properties.className = 'inline'
                node.properties = properties
            }
        })
    }
}

const bootstrapTable = (props) => {
    return (
        <div className="d-flex justify-content-center">
            <table
                className="table table-striped table-hover"
                style={{ width: 'auto' }}
                {...props}
            />
        </div>
    )
}

const Markdown: React.FC<MarkdownProps> = ({ source, preventLastMargin }) => {
    return (
        <ReactMarkdown
            className={clsx(
                'text-break',
                mdStyle.markdownContainer,
                preventLastMargin && styles.paragraph
            )}
            remarkPlugins={[remarkMath, remarkGFM]}
            rehypePlugins={[
                [rehypeKatex, { strict: false }],
                rehypeInlineCodeProperty,
            ]}
            components={{
                code: ({ children, className, ...props }) => {
                    if (className?.includes('inline')) {
                        return <code {...props}>{children || ''}</code>
                    }
                    const language = className?.replace(/language-/, '')
                    const [langTemp, ...titleTemp] = language?.split(':') || [
                        '',
                    ]
                    let lang = langTemp
                    let title = titleTemp.join(':')
                    if (lang !== 'md' && LANGUAGE_TO_MODE[lang] === undefined) {
                        lang = ''
                        title = language
                    }

                    return (
                        <Sample
                            lang={lang}
                            title={title}
                            value={String(children || '').slice(0, -1)}
                        />
                    )
                },
                table: bootstrapTable,
            }}
        >
            {source}
        </ReactMarkdown>
    )
}
export default Markdown
