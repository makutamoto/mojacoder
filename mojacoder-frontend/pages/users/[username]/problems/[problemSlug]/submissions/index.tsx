import React, { useEffect, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Alert, Nav, Spinner } from 'react-bootstrap'
import gql from 'graphql-tag'

import { useI18n } from '../../../../../../lib/i18n'
import Auth from '../../../../../../lib/auth'
import { invokeQueryWithApiKey } from '../../../../../../lib/backend'
import {
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
        $problemSlug: String!
        $userID: ID
    ) {
        user(username: $authorUsername) {
            problem(slug: $problemSlug) {
                id
                submissions(userID: $userID) {
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
`

interface Props {
    problem: Problem
}
const Submissions: React.FC<Props> = ({ problem }) => {
    const { t } = useI18n('submissions')
    const { query, pathname } = useRouter()
    const { auth } = Auth.useContainer()
    const me = query.me === 'true'
    const [submissions, setSubmissions] = useState<Submission[] | null>(null)
    useEffect(() => {
        let valid = true
        setSubmissions(null)
        const updateSubmissions = () => {
            if (valid) {
                if (!me || auth) {
                    invokeQueryWithApiKey(GetSubmissions, {
                        authorUsername: query.username,
                        problemSlug: query.problemSlug,
                        userID: me ? auth.userID : null,
                    }).then((data) => {
                        const items = data.user.problem.submissions.items
                        setSubmissions(items)
                        if (
                            items &&
                            items.some(
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
    }, [query, me, auth])
    return (
        <>
            <ProblemTop activeKey="submissions" problem={problem} />
            <Layout>
                <Nav variant="pills" activeKey={me ? 'me' : 'all'}>
                    <Nav.Item>
                        <Link
                            href={{
                                pathname: pathname,
                                query: {
                                    ...query,
                                    me: true,
                                },
                            }}
                            passHref
                        >
                            <Nav.Link eventKey="me">自分の提出</Nav.Link>
                        </Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Link
                            href={{
                                pathname: pathname,
                                query: {
                                    ...query,
                                    me: false,
                                },
                            }}
                            passHref
                        >
                            <Nav.Link eventKey="all">すべての提出</Nav.Link>
                        </Link>
                    </Nav.Item>
                </Nav>
                <hr />
                {!me || auth ? (
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

const GetProblemOverview = gql`
    query GetProblemOverview($username: String!, $problemSlug: String!) {
        user(username: $username) {
            problem(slug: $problemSlug) {
                id
                title
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
    const res = await invokeQueryWithApiKey(GetProblemOverview, {
        username: params.username,
        problemSlug: params.problemSlug,
    })
    if (res.user === null || res.user.problem === null) {
        return {
            notFound: true,
        }
    }
    return {
        props: {
            problem: res.user.problem,
        },
        revalidate: 1,
    }
}

export const getStaticPaths: GetStaticPaths = async () => ({
    paths: [],
    fallback: 'blocking',
})
