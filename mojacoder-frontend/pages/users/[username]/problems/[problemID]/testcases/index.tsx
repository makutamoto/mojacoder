import React, { useEffect, useState } from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Spinner, Table } from 'react-bootstrap'
import gql from 'graphql-tag'

import { invokeQueryWithApiKey } from '../../../../../../lib/backend'
import { UserDetail, Problem } from '../../../../../../lib/backend_types'
import Layout from '../../../../../../components/Layout'
import ProblemTop from '../../../../../../containers/ProblemTop'
import { join } from 'path'

const GetTestcaseNames = gql`
    query GetTestcaseNames($authorUsername: String!, $problemID: ID!) {
        user(username: $authorUsername) {
            problem(id: $problemID) {
                testcaseNames
            }
        }
    }
`
interface GetTestcaseNamesResponse {
    user: UserDetail | null
}

interface Props {
    problem: Problem
}
const Submissions: React.FC<Props> = (props) => {
    const { query, pathname } = useRouter()
    const { problem } = props
    const [testcaseNames, setTestcaseNames] = useState<string[] | null>(null)
    useEffect(() => {
        invokeQueryWithApiKey(GetTestcaseNames, {
            authorUsername: query.username,
            problemID: query.problemID,
        }).then((data: GetTestcaseNamesResponse) => {
            const { testcaseNames } = data.user.problem
            setTestcaseNames(testcaseNames)
        })
    }, [query])
    return (
        <>
            <ProblemTop activeKey="testcases" problem={problem} />
            <Layout>
                {testcaseNames === null ? (
                    <div className="text-center">
                        <Spinner animation="border" />
                    </div>
                ) : (
                    <Table responsive striped bordered hover>
                        <thead>
                            <tr>
                                <th>テストケース名</th>
                            </tr>
                        </thead>
                        <tbody>
                            {testcaseNames.map((name) => (
                                <tr key={name}>
                                    <td>
                                        <Link
                                            href={{
                                                pathname: join(
                                                    pathname,
                                                    '[testcaseName]'
                                                ),
                                                query: {
                                                    ...query,
                                                    testcaseName: name,
                                                },
                                            }}
                                        >
                                            <a>{name}</a>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
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
    return {
        props: {
            problem: res.user.problem,
        },
    }
}
