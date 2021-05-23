import React from 'react'
import { GetServerSideProps } from 'next'
import gql from 'graphql-tag'

import { invokeQueryWithApiKey } from '../lib/backend'

export const SitemapXml: React.FC = () => null

export default SitemapXml

const GetNewProblems = gql`
    query GetNewProblems {
        newProblems {
            slug
            title
            datetime
            user {
                detail {
                    screenName
                }
            }
        }
    }
`
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
    const { newProblems } = await invokeQueryWithApiKey(GetNewProblems)
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url>
            <loc>${process.env.ORIGIN}</loc>
        
            </url>
        <url>
            <loc>${process.env.ORIGIN}/problems</loc>
        </url>
    `
    newProblems.forEach((problem) => {
        sitemap += `
        <url>
            <loc>${process.env.ORIGIN}/users/${problem.user.detail.screenName}/problems/${problem.slug}</loc>
            <lastmod>${problem.datetime}</lastmod>
            <changefreq>always</changefreq>
        </url>
        `
    })
    sitemap += `</urlset>`
    res.setHeader('Content-Type', 'text/xml')
    res.setHeader('Cache-Control', 's-maxage=86400')
    res.end(sitemap)
    return {
        props: {},
    }
}
