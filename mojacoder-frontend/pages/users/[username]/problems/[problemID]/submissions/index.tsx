import React, { useCallback, useEffect, useState } from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { Alert, Spinner } from 'react-bootstrap'
import gql from 'graphql-tag'

import { useI18n } from '../../../../../../lib/i18n'
import Auth from '../../../../../../lib/auth'
import { invokeQueryWithApiKey } from '../../../../../../lib/backend'
import {
    UserDetail,
    Problem,
    Submission,
    SubmissionStatus,
} from '../../../../../../lib/backend_types'
import SubmissionTable from '../../../../../../components/SubmissionTable'
import Layout from '../../../../../../components/Layout'
import ProblemTop from '../../../../../../containers/ProblemTop'

const GetSubmissions = gql`
    query GetSubmissions(
        $authorUsername: String!
        $problemID: ID!
        $userID: ID
    ) {
        user(username: $authorUsername) {
            problem(id: $problemID) {
                submissions(userID: $userID) {
                    items {
                        id
                        problemID
                        user {
                            detail {
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
`
interface GetSubmissionsResponse {
    user: UserDetail | null
}

interface Props {
    problem: Problem
}
const Submissions: React.FC<Props> = (props) => {
    const { t } = useI18n('submissions')
    const { query } = useRouter()
    const { auth } = Auth.useContainer()
    const { problem } = props
    const [submissions, setSubmissions] = useState<Submission[] | null>(null)
    const updateSubmissions = useCallback(() => {
        if (auth) {
            invokeQueryWithApiKey(GetSubmissions, {
                authorUsername: query.username,
                problemID: query.problemID,
                userID: auth.userID,
            }).then((data: GetSubmissionsResponse) => {
                const items = data.user.problem.submissions.items
                setSubmissions(items)
                for (const item of items) {
                    if (item.status === SubmissionStatus.WJ) {
                        setTimeout(updateSubmissions, 1000)
                        break
                    }
                }
            })
        }
    }, [query, auth])
    useEffect(updateSubmissions, [updateSubmissions])
    return (
        <>
            <ProblemTop activeKey="submissions" problem={problem} />
            <Layout>
                {auth ? (
                    submissions === null ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <SubmissionTable submissions={submissions} />
                    )
                ) : (
                    <Alert variant="danger">{t`signInRequired`}</Alert>
                )}
            </Layout>
        </>
    )
}
export default Submissions

const GetProblemOverview = gql`
    query GetProblemOverview($username: String!, $id: ID!) {
        user(username: $username) {
            problem(id: $id) {
                title
                user {
                    detail {
                        screenName
                    }
                }
            }
        }
    }
`
interface GetProblemOverviewResponse {
    user: UserDetail | null
}
export const getServerSideProps: GetServerSideProps<Props> = async ({
    query,
}) => {
    const res = (await invokeQueryWithApiKey(GetProblemOverview, {
        username: query.username,
        id: query.problemID,
    })) as GetProblemOverviewResponse
    return {
        props: {
            problem: res.user.problem,
        },
    }
}
