import React, { useEffect, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import gql from 'graphql-tag'
import { Alert } from 'react-bootstrap'
import { invokeQueryWithApiKey } from '../../../../../lib/backend'
import { ProblemDetail } from '../../../../../lib/backend_types'
import Layout from '../../../../../components/Layout'
import Title from '../../../../../components/Title'
import ProblemTop from '../../../../../containers/ProblemTop'
import { useRouter } from 'next/router'
import axios from 'axios'
import { ProgressBar } from 'react-bootstrap'
import Editor from '../../../../../components/Editor'

const getJudgeCodeUrl = gql`
    query GetTestcase($authorUsername: String!, $problemSlug: String!) {
        user(username: $authorUsername) {
            problem(slug: $problemSlug) {
                id
                judgeCodeUrl
            }
        }
    }
`

interface Props {
    problem: ProblemDetail
}
const JudgeCode: React.FC<Props> = ({ problem }) => {
    if (problem.judgeType === 'NORMAL') {
        return (
            <>
                <Title>{`'${problem.title}'のジャッジコード`}</Title>
                <ProblemTop activeKey="judgecode" problem={problem} />
                <Layout>
                    <Alert variant="danger">この問題は通常ジャッジです</Alert>
                </Layout>
            </>
        )
    }
    const { query } = useRouter()
    const { username, problemSlug } = query
    const [judgeCode, setjudgeCode] = useState<string | null>(null)
    useEffect(() => {
        invokeQueryWithApiKey(getJudgeCodeUrl, {
            authorUsername: username,
            problemSlug: problemSlug,
        }).then(({ user }) => {
            axios
                .get(user.problem.judgeCodeUrl, {
                    transformResponse: (value) => value,
                })
                .then(({ data }) => {
                    setjudgeCode(String(data))
                })
        })
    }, [query, setjudgeCode])
    return (
        <>
            <Title>{`'${problem.title}'のジャッジコード`}</Title>
            <ProblemTop activeKey="judgecode" problem={problem} />
            <Layout>
                {!judgeCode && <ProgressBar animated now={100} />}
                <Editor
                    value={judgeCode || ''}
                    readOnly
                    lang={problem.judgeLang}
                />
            </Layout>
        </>
    )
}
export default JudgeCode

const GetProblemOverview = gql`
    query GetProblemOverview($authorUsername: String!, $problemSlug: String!) {
        user(username: $authorUsername) {
            problem(slug: $problemSlug) {
                title
                id
                hasEditorial
                judgeType
                judgeLang
                user {
                    detail {
                        userID
                        icon
                        screenName
                    }
                }
                testcaseNames
            }
        }
    }
`
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const resIn = await invokeQueryWithApiKey(GetProblemOverview, {
        authorUsername: params.username,
        problemSlug: params.problemSlug,
    })
    if (resIn.user === null || resIn.user.problem === null) {
        return {
            notFound: true,
        }
    }
    return {
        props: {
            problem: resIn.user.problem,
        },
        revalidate: 1,
    }
}

export const getStaticPaths: GetStaticPaths = async () => ({
    paths: [],
    fallback: 'blocking',
})
