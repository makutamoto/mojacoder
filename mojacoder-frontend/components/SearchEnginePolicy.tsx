import React from 'react'
import Head from 'next/head'

export const problemStatementPathname =
    '/users/[username]/problems/[problemSlug]'

export const isProblemStatementPage = (pathname: string): boolean =>
    pathname === problemStatementPathname

interface Props {
    pathname: string
}

const SearchEnginePolicy: React.FC<Props> = ({ pathname }) => {
    if (isProblemStatementPage(pathname)) {
        return null
    }

    return (
        <Head>
            <meta key="robots" name="robots" content="noindex,nofollow" />
        </Head>
    )
}

export default SearchEnginePolicy
