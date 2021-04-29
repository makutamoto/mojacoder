import React from 'react'
import { GetStaticProps } from 'next'
import Link from 'next/link'
import { Table } from 'react-bootstrap'
import gql from 'graphql-tag'

import { Contest } from '../../lib/backend_types'
import { invokeQueryWithApiKey } from '../../lib/backend'
import DateTime from '../../components/DateTime'
import Username from '../../components/Username'
import Layout from '../../components/Layout'
import Top from '../../components/Top'
import Title from '../../components/Title'

interface Props {
    newContests: Contest[]
}

export const Post: React.FC<Props> = ({ newContests }) => {
    return (
        <>
            <Title>新規コンテスト一覧</Title>
            <Top>
                <h1 className="text-center">新規コンテスト一覧</h1>
            </Top>
            <Layout>
                <Table responsive bordered striped hover>
                    <thead>
                        <tr>
                            <th className="text-nowrap">開催日時</th>
                            <th className="text-nowrap">主催者</th>
                            <th className="text-nowrap">コンテスト名</th>
                            <th className="text-nowrap">時間(秒)</th>
                            <th className="text-nowrap">問題数</th>
                        </tr>
                    </thead>
                    <tbody>
                        {newContests?.map((item) => (
                            <tr key={item.id}>
                                <td className="text-nowrap">
                                    <DateTime>{item.startDatetime}</DateTime>
                                </td>
                                <td className="text-nowrap">
                                    <Username>{item.user.detail}</Username>
                                </td>
                                <td className="text-nowrap">
                                    <Link
                                        href={`/users/${item.user.detail.screenName}/contests/${item.slug}`}
                                    >
                                        <a>{item.name}</a>
                                    </Link>
                                </td>
                                <td className="text-nowrap">{item.duration}</td>
                                <td className="text-nowrap">
                                    {item.numberOfTasks}
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

const GetNewContests = gql`
    query GetNewContests {
        newContests {
            id
            slug
            name
            duration
            startDatetime
            numberOfTasks
            user {
                detail {
                    userID
                    icon
                    screenName
                }
            }
        }
    }
`
export const getStaticProps: GetStaticProps<Props> = async () => {
    const res = await invokeQueryWithApiKey(GetNewContests)
    return {
        props: {
            newContests: res.newContests,
        },
        revalidate: 1,
    }
}
