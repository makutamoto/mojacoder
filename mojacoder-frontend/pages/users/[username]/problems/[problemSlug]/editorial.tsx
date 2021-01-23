import React from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import gql from 'graphql-tag'

import { invokeQueryWithApiKey } from '../../../../../lib/backend'
import { UserDetail } from '../../../../../lib/backend_types'
import Layout from '../../../../../components/Layout'
import Markdown from '../../../../../components/Markdown'
import Title from '../../../../../components/Title'
import ProblemTop from '../../../../../containers/ProblemTop'

interface Props {
    user: UserDetail | null
}

const ProblemPage: React.FC<Props> = (props) => {
    const { user } = props
    return (
        <>
            <Title>{`'${user.problem.title}'の解説`}</Title>
            <ProblemTop activeKey="editorial" problem={user.problem} />
            <Layout>
                <Markdown source={user.problem.editorial} />
            </Layout>
        </>
    )
}
export default ProblemPage

const GetProblem = gql`
    query GetProblem($username: String!, $problemSlug: String!) {
        user(username: $username) {
            problem(slug: $problemSlug) {
                id
                title
                editorial
                hasEditorial
                user {
                    detail {
                        userID
                        icon
                        screenName
                    }
                }
            }
        }
    }
`
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const res = await invokeQueryWithApiKey(GetProblem, {
        username: params.username,
        problemSlug: params.problemSlug,
    })
    if (
        res.user === null ||
        res.user.problem === null ||
        !res.user.problem.hasEditorial
    ) {
        return {
            notFound: true,
        }
    }
    return {
        props: {
            user: res.user,
        },
        revalidate: 1,
    }
}

export const getStaticPaths: GetStaticPaths = async () => ({
    paths: [],
    fallback: 'blocking',
})
