import React from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Spinner, Table } from 'react-bootstrap'
import gql from 'graphql-tag'

import { invokeQueryWithApiKey } from '../../../../../../lib/backend'
import { Problem } from '../../../../../../lib/backend_types'
import Layout from '../../../../../../components/Layout'
import ProblemTop from '../../../../../../containers/ProblemTop'
import join from 'url-join'

interface Props {
    problem?: Problem
}
const Submissions: React.FC<Props> = (props) => {
    const { query, pathname } = useRouter()
    const { problem } = props
    return (
        <>
            <ProblemTop activeKey="testcases" problem={problem} />
            <Layout>
                {problem?.testcaseNames === null ? (
                    <div className="text-center">
                        <Spinner animation="border" />
                    </div>
                ) : (
                    <Table responsive striped bordered hover>
                        <thead>
                            <tr>
                                <th className="text-nowrap">テストケース名</th>
                            </tr>
                        </thead>
                        <tbody>
                            {problem?.testcaseNames.map((name) => (
                                <tr key={name}>
                                    <td className="text-nowrap">
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

const GetTestcaseNames = gql`
    query GetTestcaseNames($username: String!, $problemID: ID!) {
        user(username: $username) {
            problem(id: $problemID) {
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
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const res = await invokeQueryWithApiKey(GetTestcaseNames, {
        username: params.username || '',
        problemID: params.problemID || '',
    })
    if (res.user === null || res.user.problem === null) {
        return {
            notFound: true,
        }
    }
    return {
        props: {
            problem: res.user.problem,
        },
        revalidate: 1,
    }
}

export const getStaticPaths: GetStaticPaths = async () => ({
    paths: [],
    fallback: true,
})
