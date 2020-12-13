import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Alert, Spinner } from 'react-bootstrap'
import gql from 'graphql-tag'

import { useI18n } from '../../../../../lib/i18n'
import Auth from '../../../../../lib/auth'
import { invokeQueryWithApiKey } from '../../../../../lib/backend'
import {
    UserDetail,
    Submission,
    SubmissionStatus,
} from '../../../../../lib/backend_types'
import SubmissionTable from '../../../../../components/SubmissionTable'
import ProblemTab from '../../../../../components/ProblemTab'

const GetSubmissions = gql`
    query GetSubmissions(
        $authorUsername: String!
        $problemID: ID!
        $userID: ID!
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

const Submissions: React.FC = () => {
    const { t } = useI18n('submissions')
    const { query } = useRouter()
    const { auth } = Auth.useContainer()
    const [submissions, setSubmissions] = useState<Submission[] | null>(null)
    const updateSubmissions = useCallback(() => {
        if (auth) {
            invokeQueryWithApiKey(GetSubmissions, {
                authorUsername: query.username,
                problemID: query.id,
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
            <ProblemTab activeKey="submissions" />
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
        </>
    )
}
export default Submissions
