import React from 'react'
import Head from 'next/head'

export interface TitleProps {
    children: string
}

const Title: React.FC<TitleProps> = (props) => {
    return (
        <Head>
            <title>{props.children} - MojaCoder</title>
        </Head>
    )
}
export default Title
