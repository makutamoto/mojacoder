import React, { useEffect, useMemo, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Table } from 'react-bootstrap'
import gql from 'graphql-tag'
import join from 'url-join'

import { invokeQueryWithApiKey } from '../../../../../../lib/backend'
import {
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
        $problemSlug: String!
        $submissionID: ID!
    ) {
        user(username: $authorUsername) {
            problem(slug: $problemSlug) {
                id
                title
                user {
                    detail {
                        screenName
                    }
                }
                submission(id: $submissionID) {
                    id
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
                    problemSlug: query.problemSlug || '',
                    submissionID: query.submissionID || '',
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
                            <td className="text-nowrap">提出日時</td>
                            <td className="text-nowrap">
                                <DateTime>{submission?.datetime}</DateTime>
                            </td>
                        </tr>
                        <tr>
                            <td className="text-nowrap">ユーザー</td>
                            <td className="text-nowrap">
                                <Username>{submission?.user.detail}</Username>
                            </td>
                        </tr>
                        <tr>
                            <td className="text-nowrap">言語</td>
                            <td className="text-nowrap">
                                {getProgrammingLanguageNameFromID(
                                    submission?.lang
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td className="text-nowrap">結果</td>
                            <td className="text-nowrap">
                                <JudgeStatusBadge
                                    status={result?.wholeStatus}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="text-nowrap">実行時間</td>
                            <td className="text-nowrap">{result?.time} kb</td>
                        </tr>
                        <tr>
                            <td className="text-nowrap">メモリ</td>
                            <td className="text-nowrap">{result?.memory} kb</td>
                        </tr>
                    </tbody>
                </Table>
                <Table responsive striped bordered hover>
                    <thead>
                        <tr>
                            <th className="text-nowrap">テストケース名</th>
                            <th className="text-nowrap">結果</th>
                            <th className="text-nowrap">実行時間</th>
                            <th className="text-nowrap">メモリ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submission?.testcases.map((testcase) => (
                            <tr key={testcase.name}>
                                <td className="text-nowrap">
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
                                <td className="text-nowrap">
                                    <JudgeStatusBadge
                                        status={testcase.status}
                                    />
                                </td>
                                <td className="text-nowrap">
                                    {testcase.time} ms
                                </td>
                                <td className="text-nowrap">
                                    {testcase.memory} kb
                                </td>
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
    const { user } = await invokeQueryWithApiKey(GetSubmission, {
        authorUsername: params.username || '',
        problemSlug: params.problemSlug || '',
        submissionID: params.submissionID || '',
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
    fallback: true,
})
