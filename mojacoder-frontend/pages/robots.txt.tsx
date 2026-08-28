import React from 'react'
import { GetServerSideProps } from 'next'

export const RobotsTxt: React.FC = () => null

export default RobotsTxt

// A wildcard can also match `/`, so each problem-page Allow needs a longer
// child-path Disallow to keep submissions, testcases, and other nested pages out.
export const createRobotsTxt = (origin: string): string => `User-agent: *
Disallow: /
Allow: /sitemap.xml$
Allow: /_next/static/
Allow: /users/*/problems/*$
Disallow: /users/*/problems/*/*
Allow: /en/users/*/problems/*$
Disallow: /en/users/*/problems/*/*

Sitemap: ${origin}/sitemap.xml
`

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
    res.setHeader('Content-Type', 'text/plain')
    res.end(createRobotsTxt(process.env.ORIGIN))
    return {
        props: {},
    }
}
