import React from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Spinner, Table } from 'react-bootstrap'
import gql from 'graphql-tag'
import join from 'url-join'

import { invokeQueryWithApiKey } from '../../../../../../lib/backend'
import { ProblemDetail } from '../../../../../../lib/backend_types'
import Layout from '../../../../../../components/Layout'
import ProblemTop from '../../../../../../containers/ProblemTop'
import Title from '../../../../../../components/Title'

interface Props {
    problem: ProblemDetail
}
const Submissions: React.FC<Props> = ({ problem }) => {
    const { query, pathname } = useRouter()
    return (
        <>
            <Title>{`'${problem.title}'のテストケース一覧`}</Title>
            <ProblemTop activeKey="testcases" problem={problem} />
            <Layout>
                {problem.testcaseNames === null ? (
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
                            {problem.testcaseNames.map((name) => (
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
                                            {name}
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
    query GetTestcaseNames($username: String!, $problemSlug: String!) {
        user(username: $username) {
            problem(slug: $problemSlug) {
                id
                title
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
    const res = await invokeQueryWithApiKey(GetTestcaseNames, {
        username: params.username,
        problemSlug: params.problemSlug,
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
    fallback: 'blocking',
})
