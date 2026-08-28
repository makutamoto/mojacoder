import React, { useEffect, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import gql from 'graphql-tag'
import axios from 'axios'
import { Alert, ProgressBar } from 'react-bootstrap'

import Auth from '../../../../../../lib/auth'
import {
    invokeQuery,
    invokeQueryWithApiKey,
} from '../../../../../../lib/backend'
import { ProblemDetail } from '../../../../../../lib/backend_types'
import Editor from '../../../../../../components/Editor'
import Layout from '../../../../../../components/Layout'
import ProblemTop from '../../../../../../containers/ProblemTop'
import Heading from '../../../../../../components/Heading'
import Title from '../../../../../../components/Title'

const GetTestcase = gql`
    query GetTestcase(
        $authorUsername: String!
        $problemSlug: String!
        $testcaseName: String!
    ) {
        user(username: $authorUsername) {
            problem(slug: $problemSlug) {
                id
                testcase(name: $testcaseName) {
                    inUrl
                    outUrl
                }
            }
        }
    }
`

interface Props {
    problem: ProblemDetail
}

const Status = {
    Loading: 'Loading',
    Done: 'Done',
    Error: 'Error',
} as const
type Status = typeof Status[keyof typeof Status]

const Submissions: React.FC<Props> = ({ problem }) => {
    const { auth } = Auth.useContainer()
    const { query } = useRouter()
    const { username, problemSlug, testcaseName } = query
    const [inTestcase, setInTestcase] = useState<string | null>(null)
    const [outTestcase, setOutTestcase] = useState<string | null>(null)
    const [status, setStatus] = useState<Status>(Status.Loading)
    useEffect(() => {
        if (
            !auth ||
            typeof username !== 'string' ||
            typeof problemSlug !== 'string' ||
            typeof testcaseName !== 'string'
        ) {
            return
        }

        let active = true
        setStatus(Status.Loading)
        setInTestcase(null)
        setOutTestcase(null)

        const loadTestcase = async () => {
            try {
                const { user } = await invokeQuery(GetTestcase, {
                    authorUsername: username,
                    problemSlug,
                    testcaseName,
                })
                const testcase = user?.problem?.testcase
                if (!testcase) {
                    throw new Error('Testcase not found')
                }
                const [inResponse, outResponse] = await Promise.all([
                    axios.get(testcase.inUrl, {
                        transformResponse: (value) => value,
                    }),
                    axios.get(testcase.outUrl, {
                        transformResponse: (value) => value,
                    }),
                ])
                if (!active) {
                    return
                }
                setInTestcase(String(inResponse.data))
                setOutTestcase(String(outResponse.data))
                setStatus(Status.Done)
            } catch (error) {
                console.error(error)
                if (active) {
                    setStatus(Status.Error)
                }
            }
        }
        loadTestcase()

        return () => {
            active = false
        }
    }, [auth, username, problemSlug, testcaseName])
    return (
        <>
            <Title>{`'${problem.title}'のテストケース`}</Title>
            <ProblemTop activeKey="testcases" problem={problem} />
            <Layout>
                <Heading>{testcaseName}</Heading>
                {!auth ? (
                    <Alert variant="danger">
                        テストケースを閲覧するにはサインインしてください。
                    </Alert>
                ) : status === Status.Error ? (
                    <Alert variant="danger">
                        テストケースを取得できませんでした。
                    </Alert>
                ) : (
                    <>
                        <h3>入力</h3>
                        {status === Status.Loading && (
                            <ProgressBar animated now={100} />
                        )}
                        <Editor value={inTestcase || ''} readOnly />
                        <h3>出力</h3>
                        {status === Status.Loading && (
                            <ProgressBar animated now={100} />
                        )}
                        <Editor value={outTestcase || ''} readOnly />
                    </>
                )}
            </Layout>
        </>
    )
}
export default Submissions

const GetProblemOverview = gql`
    query GetProblemOverview($authorUsername: String!, $problemSlug: String!) {
        user(username: $authorUsername) {
            problem(slug: $problemSlug) {
                title
                id
                hasEditorial
                judgeType
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
    if (
        resIn.user === null ||
        resIn.user.problem === null ||
        !resIn.user.problem.testcaseNames.includes(
            params.testcaseName as string
        )
    ) {
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
