import React, { useEffect, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import gql from 'graphql-tag'
import { Alert, Spinner } from 'react-bootstrap'

import { useI18n } from '../../../../../../lib/i18n'
import Auth from '../../../../../../lib/auth'
import {
    invokeQuery,
    invokeQueryWithApiKey,
} from '../../../../../../lib/backend'
import { Contest, ContestDetail } from '../../../../../../lib/backend_types'
import Title from '../../../../../../components/Title'
import Layout from '../../../../../../components/Layout'
import Markdown from '../../../../../../components/Markdown'
import ContestTop from '../../../../../../containers/ContestTop'
import Username from '../../../../../../components/Username'
import Heading from '../../../../../../components/Heading'
import SubmissionBox from '../../../../../../components/SubmissionBox'

const Status = {
    Loading: 'Loading',
    Done: 'Done',
    AccessDenied: 'AccessDenied',
}
type Status = typeof Status[keyof typeof Status]

interface Props {
    contest: Contest
}

const GetContestTask = gql`
    query GetContestTask(
        $username: String!
        $contestSlug: String!
        $taskNumber: Int!
    ) {
        user(username: $username) {
            contest(slug: $contestSlug) {
                id
                detail {
                    contestID
                    problem(index: $taskNumber) {
                        problem {
                            detail {
                                id
                                slug
                                title
                                statement
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
                }
            }
        }
    }
`

const ContestTask: React.FC<Props> = ({ contest }) => {
    const { t } = useI18n('contestTasks')
    const { auth } = Auth.useContainer()
    const { query } = useRouter()
    const { username, contestSlug, taskNumber } = query
    const [status, setStatus] = useState<Status>(Status.Loading)
    const [detail, setDetail] = useState<ContestDetail | null>(null)
    const problem = detail?.problem?.problem.detail
    useEffect(() => {
        if (!auth) {
            setStatus(Status.AccessDenied)
            return
        }
        const loadTask = async () => {
            const {
                user: {
                    contest: { detail },
                },
            } = await invokeQuery(GetContestTask, {
                username,
                contestSlug,
                taskNumber,
            })
            if (detail.contestID === null || detail.problem === null) {
                setStatus(Status.AccessDenied)
            } else {
                setDetail(detail)
                setStatus(Status.Done)
            }
        }
        loadTask()
    }, [auth, username, contestSlug, taskNumber])
    return (
        <>
            <Title>{t`title`}</Title>
            <ContestTop activeKey="tasks" contest={contest} detail={detail} />
            <Layout>
                {status === Status.AccessDenied ? (
                    <Alert variant="danger">{t`accessDenied`}</Alert>
                ) : status === Status.Done ? (
                    <>
                        <div className="p-4 mb-4 bg-light border rounded">
                            <h2>{problem.title}</h2>
                            <Username>{problem.user.detail}</Username>
                        </div>
                        <Markdown source={problem.statement} />
                        <div>
                            <Heading>{t`submit`}</Heading>
                            <SubmissionBox
                                id="task-code-editor"
                                contestID={contest.id}
                                problemID={problem.id}
                                redirect="../../submissions"
                            />
                        </div>
                    </>
                ) : (
                    <Spinner animation="border" />
                )}
            </Layout>
        </>
    )
}

export default ContestTask

const GetContestOverview = gql`
    query GetContestOverview($username: String!, $contestSlug: String!) {
        user(username: $username) {
            contest(slug: $contestSlug) {
                id
                name
                duration
                startDatetime
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
