import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Spinner } from 'react-bootstrap'
import gql from 'graphql-tag'

import Auth from '../../../../../lib/auth'
import { invokeQueryWithApiKey } from '../../../../../lib/backend'
import { User, Submission } from '../../../../../lib/backend_types'
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
                        userID
                        datetime
                        lang
                    }
                }
            }
        }
    }
`
interface GetSubmissionsResponse {
    user: User | null
}

const Submissions: React.FC = () => {
    const { query } = useRouter()
    const { auth } = Auth.useContainer()
    const [submissions, setSubmissions] = useState<Submission[] | null>(null)
    useEffect(() => {
        if (auth) {
            invokeQueryWithApiKey(GetSubmissions, {
                authorUsername: query.username,
                problemID: query.id,
                userID: auth.userID,
            }).then((data: GetSubmissionsResponse) => {
                setSubmissions(data.user.problem.submissions.items)
            })
        }
    }, [query, auth])
    return (
        <>
            <ProblemTab activeKey="submissions" />
            {submissions === null ? (
                <Spinner animation="border" />
            ) : (
                <SubmissionTable submissions={submissions} />
            )}
        </>
    )
}
export default Submissions
