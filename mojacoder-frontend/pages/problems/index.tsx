import React from 'react'
import { GetStaticProps } from 'next'
import Link from 'next/link'
import { Table } from 'react-bootstrap'
import gql from 'graphql-tag'

import { ProblemDetail } from '../../lib/backend_types'
import { invokeQueryWithApiKey } from '../../lib/backend'
import DateTime from '../../components/DateTime'
import Username from '../../components/Username'
import Difficulty from '../../components/Difficulty'
import Layout from '../../components/Layout'
import Top from '../../components/Top'
import Title from '../../components/Title'

interface Props {
    newProblems: ProblemDetail[]
    nextToken: string | null
}

export const Post: React.FC<Props> = ({ newProblems }) => {
    return (
        <>
            <Title>新規問題一覧</Title>
            <Top>
                <h1 className="text-center">新規問題一覧</h1>
            </Top>
            <Layout>
                <Table responsive bordered striped hover>
                    <thead>
                        <tr>
                            <th className="text-nowrap">投稿日時</th>
                            <th className="text-nowrap">投稿者</th>
                            <th className="text-nowrap">問題名</th>
                            <th className="text-nowrap">いいね数</th>
                        </tr>
                    </thead>
                    <tbody>
                        {newProblems?.map((item) => (
                            <tr key={item.id}>
                                <td className="text-nowrap">
                                    <DateTime>{item.datetime}</DateTime>
                                </td>
                                <td className="text-nowrap">
                                    <Username>{item.user.detail}</Username>
                                </td>
                                <td className="text-nowrap">
                                    {item.hasDifficulty && (
                                        <>
                                            <Difficulty>
                                                {item.difficulty}
                                            </Difficulty>{' '}
                                        </>
                                    )}
                                    <Link
                                        href={`/users/${item.user.detail.screenName}/problems/${item.slug}`}
                                    >
                                        <a>{item.title}</a>
                                    </Link>
                                </td>
                                <td className="text-nowrap">
                                    {item.likeCount}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Layout>
        </>
    )
}

export default Post

const GetNewProblems = gql`
    query GetNewProblems {
        newProblems {
            items {
                id
                slug
                title
                datetime
                likeCount
                hasDifficulty
                difficulty
                user {
                    detail {
                        userID
                        icon
                        screenName
                    }
                }
            }
            nextToken
        }
    }
`
export const getStaticProps: GetStaticProps<Props> = async () => {
    const res = await invokeQueryWithApiKey(GetNewProblems)
    return {
        props: {
            newProblems: res.newProblems.items,
            nextToken: res.newProblems.nextToken,
        },
        revalidate: 1,
    }
}
