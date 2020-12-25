import React from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import gql from 'graphql-tag'

import { invokeQueryWithApiKey } from '../../../../../../lib/backend'
import { UserDetail, Problem } from '../../../../../../lib/backend_types'
import Editor from '../../../../../../components/Editor'
import Layout from '../../../../../../components/Layout'
import ProblemTop from '../../../../../../containers/ProblemTop'

interface Testcase {
    in: string
    out: string
}

interface Props {
    problem?: Problem
    testcase?: Testcase
}
const Submissions: React.FC<Props> = (props) => {
    const { problem, testcase } = props
    return (
        <>
            <ProblemTop activeKey="testcases" problem={problem} />
            <Layout>
                <h2>入力</h2>
                <hr />
                <Editor value={testcase?.in} readOnly />
                <h2>出力</h2>
                <hr />
                <Editor value={testcase?.out} readOnly />
            </Layout>
        </>
    )
}
export default Submissions

const GetProblemOverview = gql`
    query GetProblemOverview(
        $authorUsername: String!
        $problemID: ID!
        $testcaseName: String!
    ) {
        user(username: $authorUsername) {
            problem(id: $problemID) {
                title
                user {
                    detail {
                        screenName
                    }
                }
                inTestcase(name: $testcaseName)
            }
        }
    }
`

const GetOutTestcase = gql`
    query GetOutTestcase(
        $authorUsername: String!
        $problemID: ID!
        $testcaseName: String!
    ) {
        user(username: $authorUsername) {
            problem(id: $problemID) {
                outTestcase(name: $testcaseName)
            }
        }
    }
`
interface GetProblemOverviewResponse {
    user: UserDetail | null
}
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const resIn = (await invokeQueryWithApiKey(GetProblemOverview, {
        authorUsername: params.username || '',
        id: params.problemID || '',
        testcaseName: params.testcaseName || '',
    })) as GetProblemOverviewResponse
    if (
        resIn.user === null ||
        resIn.user.problem === null ||
        resIn.user.problem.inTestcase === null
    ) {
        return {
            notFound: true,
        }
    }
    const resOut = (await invokeQueryWithApiKey(GetOutTestcase, {
        authorUsername: params.username || '',
        id: params.problemID || '',
        testcaseName: params.testcaseName || '',
    })) as GetProblemOverviewResponse
    if (
        resOut.user === null ||
        resOut.user.problem === null ||
        resOut.user.problem.outTestcase === null
    ) {
        return {
            notFound: true,
        }
    }
    return {
        props: {
            problem: resIn.user.problem,
            testcase: {
                in: resIn.user.problem.inTestcase,
                out: resOut.user.problem.outTestcase,
            },
        },
        revalidate: 1,
    }
}

export const getStaticPaths: GetStaticPaths = async () => ({
    paths: [],
    fallback: true,
})
