import React, { useEffect, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { Alert } from 'react-bootstrap'
import gql from 'graphql-tag'

import Auth from '../../../../../../lib/auth'
import { useI18n } from '../../../../../../lib/i18n'
import {
    invokeQuery,
    invokeQueryWithApiKey,
} from '../../../../../../lib/backend'
import {
    Contest,
    ContestDetail,
    SubmissionStatus,
} from '../../../../../../lib/backend_types'
import Layout from '../../../../../../components/Layout'
import Title from '../../../../../../components/Title'
import Loading from '../../../../../../components/Loading'
import ContestTop from '../../../../../../containers/ContestTop'
import SubmissionPage from '../../../../../../containers/SubmissionPage'

const GetSubmission = gql`
    query GetSubmission(
        $username: String!
        $contestSlug: String!
        $submissionID: ID!
    ) {
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
                detail {
                    contestID
                    submission(id: $submissionID) {
                        id
                        user {
                            detail {
                                userID
                                icon
                                screenName
                            }
                        }
                        datetime
                        lang
                        status
                        code
                        stderr
                        testcases {
                            name
                            status
                            time
                            memory
                        }
                    }
                }
            }
        }
    }
`

const Status = {
    Loading: 'Loading',
    Done: 'Done',
    AccessDenied: 'AccessDenied',
}
type Status = typeof Status[keyof typeof Status]

interface Props {
    contest: Contest
}

const Submissions: React.FC<Props> = ({ contest }) => {
    const [status, setStatus] = useState<Status>(Status.Loading)
    const { auth } = Auth.useContainer()
    const { t } = useI18n('contestSubmission')
    const { query } = useRouter()
    const { username, contestSlug, submissionID } = query
    const [detail, setDetail] = useState<ContestDetail | null>(null)
    const submission = detail?.submission
    useEffect(() => {
        let valid = true
        const updateSubmissions = () => {
            if (!auth) {
                setStatus(Status.AccessDenied)
                return
            }
            if (
                valid &&
                (!submission || submission.status === SubmissionStatus.WJ)
            ) {
                invokeQuery(GetSubmission, {
                    username,
                    contestSlug,
                    submissionID,
                }).then(
                    ({
                        user: {
                            contest: { detail },
                        },
                    }) => {
                        setDetail(detail)
                        if (detail.submission) {
                            setStatus(Status.Done)
                            setTimeout(updateSubmissions, 1000)
                        } else {
                            setStatus(Status.AccessDenied)
                        }
                    }
                )
            }
        }
        updateSubmissions()
        return () => (valid = false)
    }, [auth, submission, username, contestSlug, submissionID])
    return (
        <>
            <Title>{`'${contest.name}'の提出`}</Title>
            <ContestTop
                activeKey="submissions"
                contest={contest}
                detail={detail}
            />
            <Layout>
                {status === Status.AccessDenied ? (
                    <Alert variant="danger">{t`accessDenied`}</Alert>
                ) : status === Status.Loading ? (
                    <Loading />
                ) : (
                    <SubmissionPage submission={submission} />
                )}
            </Layout>
        </>
    )
}
export default Submissions

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
export const getStaticProps: GetStaticProps<Props> = async ({
    params: { username, contestSlug, submissionID },
}) => {
    const { user } = await invokeQueryWithApiKey(GetContestOverview, {
        username,
        contestSlug,
        submissionID,
    })
    if (user === null || user.contest === null) {
        return {
            notFound: true,
        }
    }
    return {
        props: {
            contest: user.contest,
        },
    }
}

export const getStaticPaths: GetStaticPaths = async () => ({
    paths: [],
    fallback: 'blocking',
})
