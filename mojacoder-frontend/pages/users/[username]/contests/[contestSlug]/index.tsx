import React, { useCallback, useEffect, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { Alert, Button } from 'react-bootstrap'
import gql from 'graphql-tag'

import { useI18n } from '../../../../../lib/i18n'
import {
    invokeMutation,
    invokeQuery,
    invokeQueryWithApiKey,
} from '../../../../../lib/backend'
import { Contest, ContestDetail } from '../../../../../lib/backend_types'
import Auth from '../../../../../lib/auth'
import Title from '../../../../../components/Title'
import Layout from '../../../../../components/Layout'
import ContestTop from '../../../../../containers/ContestTop'

const JoinContest = gql`
    mutation JoinContest($input: JoinContestInput!) {
        joinContest(input: $input)
    }
`

const GetContestDetail = gql`
    query GetContestDetail($username: String!, $contestSlug: String!) {
        user(username: $username) {
            contest(slug: $contestSlug) {
                id
                detail {
                    joined
                    contestID
                }
            }
        }
    }
`

interface Props {
    contest: Contest
}

const ContestPage: React.FC<Props> = ({ contest }) => {
    const { t } = useI18n('contest')
    const { auth } = Auth.useContainer()
    const {
        query: { username, contestSlug },
    } = useRouter()
    const [detail, setDetail] = useState<ContestDetail | null>(null)
    const now = new Date().toISOString()
    const joinContest = useCallback(
        (join: boolean) => {
            const joinContestMutation = async () => {
                await invokeMutation(JoinContest, {
                    input: {
                        contestID: contest.id,
                        join,
                    },
                })
                await loadDetail()
            }
            joinContestMutation()
        },
        [contest.id]
    )
    const loadDetail = useCallback(async () => {
        if (!auth) return
        const {
            user: {
                contest: { detail },
            },
        } = await invokeQuery(GetContestDetail, {
            username,
            contestSlug,
        })
        setDetail(detail)
    }, [auth, username, contestSlug])
    useEffect(() => {
        loadDetail()
    }, [auth, username, contestSlug])
    return (
        <>
            <Title>{contest.name}</Title>
            <ContestTop activeKey="top" contest={contest} detail={detail} />
            <Layout>
                {detail?.joined ? (
                    <Alert variant="success">
                        <Alert.Heading>{t`contestJoined`}</Alert.Heading>
                        <p>{t`contestJoinedMessage`}</p>
                        {now < contest.startDatetime && (
                            <>
                                <hr />
                                <div className="text-right">
                                    <Button
                                        onClick={() => joinContest(false)}
                                        variant="outline-danger"
                                    >
                                        {t`leave`}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Alert>
                ) : (
                    <Alert variant="primary">
                        <Alert.Heading>{t`contestNotJoined`}</Alert.Heading>
                        <p>{t`contestNotJoinedMessage`}</p>
                        <hr />
                        <div className="text-right">
                            <Button
                                onClick={() => joinContest(true)}
                                variant="outline-primary"
                            >
                                {t`join`}
                            </Button>
                        </div>
                    </Alert>
                )}
                <div>{contest.description}</div>
            </Layout>
        </>
    )
}

export default ContestPage

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
