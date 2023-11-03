import React from 'react'
import { GetStaticProps } from 'next'
import gql from 'graphql-tag'

import { Contest } from '../../lib/backend_types'
import { invokeQueryWithApiKey } from '../../lib/backend'
import Layout from '../../components/Layout'
import Top from '../../components/Top'
import Title from '../../components/Title'
import ContestsTable from '../../components/ContestsTable'

interface Props {
    pastContests: Contest[]
    currentContests: Contest[]
    upcomingContests: Contest[]
}

export const Post: React.FC<Props> = ({
    pastContests,
    currentContests,
    upcomingContests,
}) => {
    return (
        <>
            <Title>新規コンテスト一覧</Title>
            <Top>
                <h1 className="text-center">新規コンテスト一覧</h1>
            </Top>
            <Layout>
                <h3>開催中のコンテスト</h3>
                <ContestsTable contests={currentContests} />

                <h3>予定されたコンテスト</h3>
                <ContestsTable contests={upcomingContests} />

                <h3>過去のコンテスト</h3>
                <ContestsTable contests={pastContests} />
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
    const newContests = res.newContests

    newContests.sort(
        (a, b) =>
            new Date(b.startDatetime).getTime() -
            new Date(a.startDatetime).getTime()
    )

    const nowUTC = Date.now()
    let upcommingIdx = 0
    let currentIdx = 0
    for (let i = 0; i < newContests.length; ++i) {
        const start = new Date(newContests[i].startDatetime).getTime()
        const end = start + newContests[i].duration * 1000 // s -> ms
        if (start >= nowUTC) {
            upcommingIdx = i + 1
            currentIdx = i + 1
        } else if (start <= nowUTC && nowUTC <= end) {
            currentIdx = i + 1
        } else {
            break
        }
    }

    const pastContests = newContests.slice(currentIdx, newContests.length)
    const currentContests = newContests.slice(upcommingIdx, currentIdx)
    const upcomingContests = newContests.slice(0, upcommingIdx)

    return {
        props: {
            currentContests: currentContests,
            pastContests: pastContests,
            upcomingContests: upcomingContests,
        },
        revalidate: 1,
    }
}
