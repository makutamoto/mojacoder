import React, { useEffect, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import gql from 'graphql-tag'
import { Alert, Spinner, Table } from 'react-bootstrap'

import { useI18n } from '../../../../../../lib/i18n'
import Auth from '../../../../../../lib/auth'
import {
    invokeQuery,
    invokeQueryWithApiKey,
} from '../../../../../../lib/backend'
import { Contest, ContestDetail } from '../../../../../../lib/backend_types'
import Title from '../../../../../../components/Title'
import Layout from '../../../../../../components/Layout'
import ContestTop from '../../../../../../containers/ContestTop'

const Status = {
    Loading: 'Loading',
    Done: 'Done',
    AccessDenied: 'AccessDenied',
}
type Status = typeof Status[keyof typeof Status]

interface Props {
    contest: Contest
}

const GetContestTasks = gql`
    query GetContestTasks($username: String!, $contestSlug: String!) {
        user(username: $username) {
            contest(slug: $contestSlug) {
                id
                detail {
                    contestID
                    problems {
                        point
                        problem {
                            detail {
                                id
                                title
                            }
                        }
                    }
                }
            }
        }
    }
`

const ContestTasks: React.FC<Props> = ({ contest }) => {
    const { t } = useI18n('contestTasks')
    const { auth } = Auth.useContainer()
    const { query } = useRouter()
    const { username, contestSlug } = query
    const [status, setStatus] = useState<Status>(Status.Loading)
    const [detail, setDetail] = useState<ContestDetail | null>(null)
    const tasks = detail?.problems
    useEffect(() => {
        if (!auth) {
            setStatus(Status.AccessDenied)
            return
        }
        const loadTasks = async () => {
            const {
                user: {
                    contest: { detail },
                },
            } = await invokeQuery(GetContestTasks, {
                username,
                contestSlug,
            })
            setDetail(detail)
            setStatus(Status.Done)
        }
        loadTasks()
    }, [auth, username, contestSlug])
    return (
        <>
            <Title>{t`title`}</Title>
            <ContestTop activeKey="tasks" contest={contest} detail={detail} />
            <Layout>
                {status === Status.AccessDenied ? (
                    <Alert variant="danger">{t`accessDenied`}</Alert>
                ) : status === Status.Done ? (
                    <Table responsive bordered striped hover>
                        <thead>
                            <tr>
                                <th className="text-nowrap">#</th>
                                <th className="text-nowrap">{t`problemName`}</th>
                                <th className="text-nowrap">{t`point`}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map((item, i) => {
                                const index = i + 1
                                return (
                                    <tr key={item.problem.detail.id}>
                                        <td className="text-nowrap">{index}</td>
                                        <td className="text-nowrap">
                                            <Link
                                                href={`/users/${username}/contests/${contestSlug}/tasks/${index}`}
                                            >
                                                <a>
                                                    {item.problem.detail.title}
                                                </a>
                                            </Link>
                                        </td>
                                        <td className="text-nowrap">
                                            {item.point}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </Table>
                ) : (
                    <Spinner animation="border" />
                )}
            </Layout>
        </>
    )
}

export default ContestTasks

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
