import React, { useEffect, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import gql from 'graphql-tag'

import { invokeQueryWithApiKey } from '../../../../../../lib/backend'
import {
    ProblemDetail,
    Submission,
    SubmissionStatus,
} from '../../../../../../lib/backend_types'
import Layout from '../../../../../../components/Layout'
import Title from '../../../../../../components/Title'
import ProblemTop from '../../../../../../containers/ProblemTop'
import SubmissionPage from '../../../../../../containers/SubmissionPage'

const GetSubmission = gql`
    query GetSubmission(
        $authorUsername: String!
        $problemSlug: String!
        $submissionID: ID!
    ) {
        user(username: $authorUsername) {
            problem(slug: $problemSlug) {
                id
                title
                hasEditorial
                judgeType
                user {
                    detail {
                        userID
                        icon
                        screenName
                    }
                }
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
`

interface Props {
    problem: ProblemDetail
}

const Submissions: React.FC<Props> = ({ problem }) => {
    const { query } = useRouter()
    const [submission, setSubmission] = useState<Submission>(problem.submission)
    useEffect(() => {
        let valid = true
        const updateSubmissions = () => {
            if (valid && submission.status === SubmissionStatus.WJ) {
                invokeQueryWithApiKey(GetSubmission, {
                    authorUsername: query.username,
                    problemSlug: query.problemSlug,
                    submissionID: query.submissionID,
                }).then((data) => {
                    const submission = data.user.problem.submission
                    setSubmission(submission)
                    setTimeout(updateSubmissions, 1000)
                })
            }
        }
        updateSubmissions()
        return () => (valid = false)
    }, [])
    return (
        <>
            <Title>{`'${problem.title}'の${
                submission.user.detail?.screenName || 'Guest'
            }さんの提出`}</Title>
            <ProblemTop activeKey="submissions" problem={problem} />
            <Layout>
                <SubmissionPage submission={submission} />
            </Layout>
        </>
    )
}
export default Submissions

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const { user } = await invokeQueryWithApiKey(GetSubmission, {
        authorUsername: params.username,
        problemSlug: params.problemSlug,
        submissionID: params.submissionID,
    })
    if (
        user === null ||
        user.problem === null ||
        user.problem.submission === null
    ) {
        return {
            notFound: true,
        }
    }
    return {
        props: {
            problem: user.problem,
        },
    }
}

export const getStaticPaths: GetStaticPaths = async () => ({
    paths: [],
    fallback: 'blocking',
})
