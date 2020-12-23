import React, { useEffect, useState } from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { Spinner } from 'react-bootstrap'
import gql from 'graphql-tag'

import { invokeQueryWithApiKey } from '../../../../../../lib/backend'
import { UserDetail, Problem } from '../../../../../../lib/backend_types'
import Editor from '../../../../../../components/Editor'
import Layout from '../../../../../../components/Layout'
import ProblemTop from '../../../../../../containers/ProblemTop'

const GetInTestcase = gql`
    query GetInTestcase(
        $authorUsername: String!
        $problemID: ID!
        $testcaseName: String!
    ) {
        user(username: $authorUsername) {
            problem(id: $problemID) {
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

interface GetTestcaseResponse {
    user: UserDetail | null
}

interface Testcase {
    in: string
    out: string
}

interface Props {
    problem: Problem
}
const Submissions: React.FC<Props> = (props) => {
    const { query } = useRouter()
    const { problem } = props
    const [testcase, setTestcase] = useState<Testcase | null>(null)
    useEffect(() => {
        invokeQueryWithApiKey(GetInTestcase, {
            authorUsername: query.username,
            problemID: query.problemID,
            testcaseName: query.testcaseName,
        }).then((data: GetTestcaseResponse) => {
            const { inTestcase } = data.user.problem
            invokeQueryWithApiKey(GetOutTestcase, {
                authorUsername: query.username,
                problemID: query.problemID,
                testcaseName: query.testcaseName,
            }).then((data: GetTestcaseResponse) => {
                const { outTestcase } = data.user.problem
                setTestcase({
                    in: inTestcase,
                    out: outTestcase,
                })
            })
        })
    }, [query])
    return (
        <>
            <ProblemTop activeKey="testcases" problem={problem} />
            <Layout>
                {testcase === null ? (
                    <div className="text-center">
                        <Spinner animation="border" />
                    </div>
                ) : (
                    <>
                        <h2>入力</h2>
                        <hr />
                        <Editor value={testcase.in} readOnly />
                        <h2>出力</h2>
                        <hr />
                        <Editor value={testcase.out} readOnly />
                    </>
                )}
            </Layout>
        </>
    )
}
export default Submissions

const GetProblemOverview = gql`
    query GetProblemOverview($username: String!, $id: ID!) {
        user(username: $username) {
            problem(id: $id) {
                title
                user {
                    detail {
                        screenName
                    }
                }
                testcaseNames
            }
        }
    }
`
interface GetProblemOverviewResponse {
    user: UserDetail | null
}
export const getServerSideProps: GetServerSideProps<Props> = async ({
    query,
}) => {
    const res = (await invokeQueryWithApiKey(GetProblemOverview, {
        username: query.username,
        id: query.problemID,
    })) as GetProblemOverviewResponse
    const testcaseName = query.testcaseName as string
    if (res.user.problem.testcaseNames.indexOf(testcaseName) === -1) {
        return {
            notFound: true,
        }
    }
    return {
        props: {
            problem: res.user.problem,
        },
    }
}
