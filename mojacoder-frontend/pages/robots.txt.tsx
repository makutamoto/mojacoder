import React from 'react'
import { GetServerSideProps } from 'next'

export const RobotsTxt: React.FC = () => null

export default RobotsTxt

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
    res.setHeader('Content-Type', 'text/plain')
    res.end(`Sitemap: ${process.env.ORIGIN}/sitemap.xml\n`)
    return {
        props: null,
    }
}
