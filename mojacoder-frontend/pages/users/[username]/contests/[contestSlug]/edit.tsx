import React, { useEffect, useMemo, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { Alert } from 'react-bootstrap'
import gql from 'graphql-tag'

import { invokeQuery, invokeQueryWithApiKey } from '../../../../../lib/backend'
import { Contest } from '../../../../../lib/backend_types'
import Auth from '../../../../../lib/auth'
import Title from '../../../../../components/Title'
import Layout from '../../../../../components/Layout'
import ContestTop from '../../../../../containers/ContestTop'
import ContestEditor from '../../../../../containers/ContestEditor'
import Loading from '../../../../../components/Loading'

const GetContestData = gql`
    query GetContestData($username: String!, $contestSlug: String!) {
        user(username: $username) {
            contest(slug: $contestSlug) {
                id
                status
                slug
                name
                description
                startDatetime
                duration
                penaltySeconds
                detail {
                    joined
                    contestID
                    problems {
                        problem {
                            detail {
                                id
                                slug
                                user {
                                    detail {
                                        screenName
                                    }
                                }
                            }
                        }
                        point
                    }
                }
            }
        }
    }
`

interface Props {
    contest: Contest
}

const EditContest: React.FC<Props> = ({ contest }) => {
    const { auth } = Auth.useContainer()
    const {
        query: { username, contestSlug },
    } = useRouter()
    const [data, setData] = useState<Contest | null>(null)
    const detail = data?.detail
    const editorData = useMemo(
        () => ({
            ...data,
            problems: data?.detail?.problems.map(
                ({
                    problem: {
                        detail: {
                            id,
                            slug,
                            user: {
                                detail: { screenName },
                            },
                        },
                    },
                    point,
                }) => ({
                    id,
                    point,
                    owner: screenName,
                    slug,
                })
            ),
        }),
        [data]
    )
    useEffect(() => {
        const loadData = async () => {
            if (!auth) return
            const {
                user: { contest },
            } = await invokeQuery(GetContestData, {
                username,
                contestSlug,
            })
            setData(contest)
        }
        loadData()
    }, [auth, username, contestSlug])
    return (
        <>
            <Title>{contest.name}</Title>
            <ContestTop activeKey="edit" contest={contest} detail={detail} />
            <Layout>
                {auth && auth.userID === contest.user.detail.userID ? (
                    data ? (
                        <ContestEditor data={editorData} />
                    ) : (
                        <Loading />
                    )
                ) : (
                    <Alert variant="danger">権限がありません。</Alert>
                )}
            </Layout>
        </>
    )
}

export default EditContest

const GetContest = gql`
    query GetContest($username: String!, $contestSlug: String!) {
        user(username: $username) {
            contest(slug: $contestSlug) {
                id
                name
                startDatetime
                duration
                user {
                    detail {
                        userID
                        icon
                        screenName
                    }
                }
                description
            }
        }
    }
`
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const res = await invokeQueryWithApiKey(GetContest, {
        username: params.username,
        contestSlug: params.contestSlug,
    })
    if (res.user === null || res.user.contest === null) {
        return {
            notFound: true,
        }
    }
    return {
        props: {
            contest: res.user.contest,
        },
        revalidate: 1,
    }
}

export const getStaticPaths: GetStaticPaths = async () => ({
    paths: [],
    fallback: 'blocking',
})
