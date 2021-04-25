import React, { useEffect, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import gql from 'graphql-tag'
import { Alert, Spinner, Table } from 'react-bootstrap'

import { useI18n } from '../../../../../lib/i18n'
import Auth from '../../../../../lib/auth'
import { invokeQuery, invokeQueryWithApiKey } from '../../../../../lib/backend'
import { Contest } from '../../../../../lib/backend_types'
import Username from '../../../../../components/Username'
import Score from '../../../../../components/Score'
import Title from '../../../../../components/Title'
import Layout from '../../../../../components/Layout'
import ContestTop from '../../../../../containers/ContestTop'

const Status = {
    Loading: 'Loading',
    Done: 'Done',
    AccessDenied: 'AccessDenied',
}
type Status = typeof Status[keyof typeof Status]

interface Props {
    contest: Contest
}

const GetContestStandings = gql`
    query GetContestStandings($username: String!, $contestSlug: String!) {
        user(username: $username) {
            contest(slug: $contestSlug) {
                id
                standings {
                    rank
                    user {
                        detail {
                            userID
                            icon
                            screenName
                        }
                    }
                    score
                    penalty
                    secondsFromStart
                    submissions {
                        penalty
                        score
                        secondsFromStart
                    }
                }
                detail {
                    contestID
                    problems {
                        point
                    }
                }
            }
        }
    }
`

const ContestStandings: React.FC<Props> = ({ contest }) => {
    const { t } = useI18n('contestStandings')
    const { auth } = Auth.useContainer()
    const { query } = useRouter()
    const { username, contestSlug } = query
    const [status, setStatus] = useState<Status>(Status.Loading)
    const [realtimeContest, setRealtimeContest] = useState<Contest | null>(null)
    const detail = realtimeContest?.detail
    const standings = realtimeContest?.standings
    useEffect(() => {
        if (!auth) {
            setStatus(Status.AccessDenied)
            return
        }
        const loadTasks = async () => {
            const {
                user: { contest },
            } = await invokeQuery(GetContestStandings, {
                username,
                contestSlug,
            })
            setRealtimeContest(contest)
            setStatus(Status.Done)
        }
        loadTasks()
    }, [auth, username, contestSlug])
    return (
        <>
            <Title>{contest.name}</Title>
            <ContestTop
                activeKey="standings"
                contest={contest}
                detail={detail}
            />
            <Layout>
                {status === Status.AccessDenied ? (
                    <Alert variant="danger">{t`accessDenied`}</Alert>
                ) : status === Status.Done ? (
                    <Table responsive bordered striped hover>
                        <thead>
                            <tr>
                                <th className="text-nowrap text-center">{t`rank`}</th>
                                <th className="text-nowrap">{t`user`}</th>
                                <th className="text-nowrap text-center">{t`sum`}</th>
                                {new Array(contest.numberOfTasks).map(
                                    (_, i) => (
                                        <th
                                            key={i}
                                            className="text-nowrap text-center"
                                        >
                                            {i + 1}
                                        </th>
                                    )
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {standings.map((standing) => (
                                <tr key={standing.user.detail.userID}>
                                    <td className="text-nowrap text-center">
                                        {standing.rank}
                                    </td>
                                    <td className="text-nowrap">
                                        <Username>
                                            {standing.user.detail}
                                        </Username>
                                    </td>
                                    <td className="text-nowrap text-center">
                                        <Score
                                            penalty={standing.penalty}
                                            score={standing.score}
                                            secondsFromStart={
                                                standing.secondsFromStart
                                            }
                                        />
                                    </td>
                                    {standing.submissions.map(
                                        (submission, i) => (
                                            <td
                                                key={i}
                                                className="text-nowrap text-center"
                                            >
                                                <Score
                                                    penalty={submission.penalty}
                                                    score={submission.score}
                                                    secondsFromStart={
                                                        submission.secondsFromStart
                                                    }
                                                />
                                            </td>
                                        )
                                    )}
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

export default ContestStandings

const GetContestOverview = gql`
    query GetContestOverview($username: String!, $contestSlug: String!) {
        user(username: $username) {
            contest(slug: $contestSlug) {
                id
                name
                duration
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
    const res = await invokeQueryWithApiKey(GetContestOverview, {
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
