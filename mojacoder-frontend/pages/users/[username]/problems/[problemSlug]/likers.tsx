import React from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import gql from 'graphql-tag'
import { Table } from 'react-bootstrap'

import { invokeQueryWithApiKey } from '../../../../../lib/backend'
import { UserDetail } from '../../../../../lib/backend_types'
import Username from '../../../../../components/Username'
import Layout from '../../../../../components/Layout'
import ProblemTop from '../../../../../containers/ProblemTop'

interface Props {
    user?: UserDetail
}

const ProblemPage: React.FC<Props> = (props) => {
    const { user } = props
    return (
        <>
            <ProblemTop problem={user?.problem} />
            <Layout>
                <Table responsive striped bordered hover>
                    <thead>
                        <tr>
                            <th className="text-nowrap">いいねした人</th>
                        </tr>
                    </thead>
                    <tbody>
                        {user?.problem.likers.items.map((liker) => (
                            <tr key={liker.userID}>
                                <td className="text-nowrap">
                                    <Username>{liker.detail}</Username>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Layout>
        </>
    )
}
export default ProblemPage

const GetProblem = gql`
    query GetProblem($username: String!, $id: ID!) {
        user(username: $username) {
            problem(id: $id) {
                title
                likers {
                    items {
                        userID
                        detail {
                            screenName
                        }
                    }
                }
                user {
                    detail {
                        screenName
                    }
                }
            }
        }
    }
`
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const res = await invokeQueryWithApiKey(GetProblem, {
        username: params.username || '',
        id: params.problemID || '',
    })
    if (res.user === null || res.user.problem === null) {
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
    fallback: true,
})
