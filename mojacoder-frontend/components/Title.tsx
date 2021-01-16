import React from 'react'
import Head from 'next/head'

export interface TitleProps {
    image?: string
    large?: boolean
    children?: string
}

const Title: React.FC<TitleProps> = ({ image, large, children }) => {
    const title = children ? `${children} | MojaCoder` : 'MojaCoder'
    return (
        <Head>
            <title>{title}</title>
            <meta
                property="twitter:card"
                content={large ? 'summary_large_image' : 'summary'}
            />
            <meta property="og:title" content={title} />
            <meta
                property="og:image"
                content={image ? image : '/images/logo.png'}
            />
        </Head>
    )
}
export default Title
