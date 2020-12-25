import React, { useEffect, useMemo, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Table } from 'react-bootstrap'
import gql from 'graphql-tag'
import join from 'url-join'

import { invokeQueryWithApiKey } from '../../../../../../lib/backend'
import {
    UserDetail,
    Problem,
    Submission,
    SubmissionStatus,
} from '../../../../../../lib/backend_types'
import Editor from '../../../../../../components/Editor'
import JudgeStatusBadge from '../../../../../../components/JudgeStatusBadge'
import DateTime from '../../../../../../components/DateTime'
import { getProgrammingLanguageNameFromID } from '../../../../../../lib/programming_language'
import { getJudgeStatusFromTestcases } from '../../../../../../lib/JudgeStatus'
import Username from '../../../../../../components/Username'
import Layout from '../../../../../../components/Layout'
import ProblemTop from '../../../../../../containers/ProblemTop'

const GetSubmission = gql`
    query GetSubmission(
        $authorUsername: String!
        $problemID: ID!
        $submissionID: ID!
    ) {
        user(username: $authorUsername) {
            problem(id: $problemID) {
                title
                user {
                    detail {
                        screenName
                    }
                }
                submission(id: $submissionID) {
                    user {
                        detail {
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
interface GetSubmissionsResponse {
    user: UserDetail | null
}

interface Props {
    problem?: Problem
}

const Submissions: React.FC<Props> = (props) => {
    const { query, pathname } = useRouter()
    const [submission, setSubmission] = useState<Submission | null>(
        props.problem?.submission || null
    )
    const { problem } = props
    const result = useMemo(() => {
        if (submission)
            return getJudgeStatusFromTestcases(
                submission.status,
                submission.testcases
            )
        else return null
    }, [submission])
    useEffect(() => {
        let valid = true
        const updateSubmissions = () => {
            if (
                valid &&
                submission &&
                submission.status === SubmissionStatus.WJ
            ) {
                invokeQueryWithApiKey(GetSubmission, {
                    authorUsername: query.username || '',
                    problemID: query.problemID || '',
                    submissionID: query.submissionID || '',
                }).then((data: GetSubmissionsResponse) => {
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
            <ProblemTop activeKey="submissions" problem={problem} />
            <Layout>
                <Editor
                    lang={submission?.lang}
                    value={submission?.code}
                    lineNumbers
                    readOnly
                />
                <h2>コンパイルエラー</h2>
                <Editor value={submission?.stderr} lineNumbers readOnly />
                <Table responsive striped bordered hover>
                    <tbody>
                        <tr>
                            <td>提出日時</td>
                            <td>
                                <DateTime>{submission?.datetime}</DateTime>
                            </td>
                        </tr>
                        <tr>
                            <td>ユーザー</td>
                            <td>
                                <Username>{submission?.user.detail}</Username>
                            </td>
                        </tr>
                        <tr>
                            <td>言語</td>
                            <td>
                                {getProgrammingLanguageNameFromID(
                                    submission?.lang
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td>結果</td>
                            <td>
                                <JudgeStatusBadge
                                    status={result?.wholeStatus}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>実行時間</td>
                            <td>{result?.time} kb</td>
                        </tr>
                        <tr>
                            <td>メモリ</td>
                            <td>{result?.memory} kb</td>
                        </tr>
                    </tbody>
                </Table>
                <Table responsive striped bordered hover>
                    <thead>
                        <tr>
                            <th>テストケース名</th>
                            <th>結果</th>
                            <th>実行時間</th>
                            <th>メモリ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submission?.testcases.map((testcase) => (
                            <tr key={testcase.name}>
                                <td>
                                    <Link
                                        href={{
                                            pathname: join(
                                                pathname,
                                                '../../testcases/[testcaseName]'
                                            ),
                                            query: {
                                                ...query,
                                                testcaseName: testcase.name,
                                            },
                                        }}
                                    >
                                        <a>{testcase.name}</a>
                                    </Link>
                                </td>
                                <td>
                                    <JudgeStatusBadge
                                        status={testcase.status}
                                    />
                                </td>
                                <td>{testcase.time} ms</td>
                                <td>{testcase.memory} kb</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Layout>
        </>
    )
}
export default Submissions

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const { user } = (await invokeQueryWithApiKey(GetSubmission, {
        authorUsername: params.username || '',
        problemID: params.problemID || '',
        submissionID: params.submissionID || '',
    })) as GetSubmissionsResponse
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
    fallback: true,
})
