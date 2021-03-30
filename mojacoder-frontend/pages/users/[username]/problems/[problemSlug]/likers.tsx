import React, { useEffect, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import gql from 'graphql-tag'
import { Spinner, Table } from 'react-bootstrap'

import { invokeQueryWithApiKey } from '../../../../../lib/backend'
import { User, UserDetail } from '../../../../../lib/backend_types'
import Username from '../../../../../components/Username'
import Layout from '../../../../../components/Layout'
import Title from '../../../../../components/Title'
import ProblemTop from '../../../../../containers/ProblemTop'

interface Props {
    user: UserDetail
}

const GetLikers = gql`
    query GetLikers($username: String!, $problemSlug: String!) {
        user(username: $username) {
            problem(slug: $problemSlug) {
                id
                likers {
                    items {
                        detail {
                            userID
                            icon
                            screenName
                        }
                    }
                }
            }
        }
    }
`

const ProblemPage: React.FC<Props> = ({ user }) => {
    const {
        query: { username, problemSlug },
    } = useRouter()
    const [likers, setLikers] = useState<User[] | null>(null)
    useEffect(() => {
        const loadLikers = async () => {
            const res = await invokeQueryWithApiKey(GetLikers, {
                username: username,
                problemSlug: problemSlug,
            })
            setLikers(res.user.problem.likers.items)
        }
        loadLikers()
    }, [username, problemSlug])
    return (
        <>
            <Title>{`'${user.problem.title}'をいいねした人たち`}</Title>
            <ProblemTop problem={user.problem} />
            <Layout>
                {likers ? (
                    <Table responsive striped bordered hover>
                        <thead>
                            <tr>
                                <th className="text-nowrap">いいねした人</th>
                            </tr>
                        </thead>
                        <tbody>
                            {likers.map((liker) => (
                                <tr key={liker.detail.userID}>
                                    <td className="text-nowrap">
                                        <Username>{liker.detail}</Username>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <Spinner animation="border" />
                )}
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
    fallback: 'blocking',
})
