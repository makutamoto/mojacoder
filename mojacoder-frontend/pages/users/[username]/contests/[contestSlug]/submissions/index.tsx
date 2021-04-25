import React, { useEffect, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { Alert, Spinner } from 'react-bootstrap'
import gql from 'graphql-tag'

import { useI18n } from '../../../../../../lib/i18n'
import Auth from '../../../../../../lib/auth'
import {
    invokeQuery,
    invokeQueryWithApiKey,
} from '../../../../../../lib/backend'
import {
    Contest,
    ContestDetail,
    SubmissionStatus,
} from '../../../../../../lib/backend_types'
import SubmissionTable from '../../../../../../components/SubmissionTable'
import Layout from '../../../../../../components/Layout'
import Title from '../../../../../../components/Title'
import ContestTop from '../../../../../../containers/ContestTop'

const GetContestSubmissions = gql`
    query GetContestSubmissions($username: String!, $contestSlug: String!) {
        user(username: $username) {
            contest(slug: $contestSlug) {
                id
                detail {
                    submissions {
                        items {
                            id
                            problemID
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
    }
`

interface Props {
    contest: Contest
}
const Submissions: React.FC<Props> = ({ contest }) => {
    const { t } = useI18n('submissions')
    const { query } = useRouter()
    const { username, contestSlug } = query
    const { auth } = Auth.useContainer()
    const [detail, setDetail] = useState<ContestDetail | null>(null)
    const submissions = detail?.submissions.items
    useEffect(() => {
        let valid = true
        setDetail(null)
        const updateSubmissions = () => {
            if (valid) {
                if (auth) {
                    invokeQuery(GetContestSubmissions, {
                        username,
                        contestSlug,
                    }).then((data) => {
                        const {
                            user: {
                                contest: { detail },
                            },
                        } = data
                        setDetail(detail)
                        if (
                            detail.submissions.items.some(
                                (item) => item.status === SubmissionStatus.WJ
                            )
                        ) {
                            setTimeout(updateSubmissions, 1000)
                        }
                    })
                }
            }
        }
        updateSubmissions()
        return () => (valid = false)
    }, [query, auth])
    return (
        <>
            <Title>{`'${contest.name}'の提出一覧`}</Title>
            <ContestTop
                activeKey="submissions"
                contest={contest}
                detail={detail}
            />
            <Layout>
                {auth ? (
                    submissions ? (
                        <SubmissionTable submissions={submissions} />
                    ) : (
                        <div className="text-center">
                            <Spinner animation="border" />
                        </div>
                    )
                ) : (
                    <Alert variant="danger">{t`signInRequired`}</Alert>
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
                description
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
