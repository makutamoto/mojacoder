import React, { useEffect, useMemo, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Table } from 'react-bootstrap'
import gql from 'graphql-tag'
import join from 'url-join'
import clsx from 'clsx'

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
import Title from '../../../../../../components/Title'
import CopyButton from '../../../../../../components/CopyButton'
import ProblemTop from '../../../../../../containers/ProblemTop'

import positionStyles from '../../../../../../css/position.module.css'

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
    problem: Problem
}

const Submissions: React.FC<Props> = ({ problem }) => {
    const { query, pathname } = useRouter()
    const [submission, setSubmission] = useState<Submission | null>(
        problem.submission
    )
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
            <Title>{`'${problem.title}'の${submission.user.detail.screenName}さんの提出`}</Title>
            <ProblemTop activeKey="submissions" problem={problem} />
            <Layout>
                <div className="position-relative">
                    <Editor
                        lang={submission.lang}
                        value={submission.code}
                        lineNumbers
                        readOnly
                    />
                    <CopyButton
                        className={clsx(
                            'position-absolute',
                            positionStyles['top-right-0']
                        )}
                        variant="light"
                        size="sm"
                        value={submission.code}
                    />
                </div>
                <h2>コンパイルエラー</h2>
                <Editor value={submission.stderr} lineNumbers readOnly />
                <Table responsive striped bordered hover>
                    <tbody>
                        <tr>
                            <td className="text-nowrap">提出日時</td>
                            <td className="text-nowrap">
                                <DateTime>{submission.datetime}</DateTime>
                            </td>
                        </tr>
                        <tr>
                            <td className="text-nowrap">ユーザー</td>
                            <td className="text-nowrap">
                                <Username>{submission.user.detail}</Username>
                            </td>
                        </tr>
                        <tr>
                            <td className="text-nowrap">言語</td>
                            <td className="text-nowrap">
                                {getProgrammingLanguageNameFromID(
                                    submission.lang
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td className="text-nowrap">結果</td>
                            <td className="text-nowrap">
                                <JudgeStatusBadge status={result.wholeStatus} />
                            </td>
                        </tr>
                        <tr>
                            <td className="text-nowrap">実行時間</td>
                            <td className="text-nowrap">{result.time} ms</td>
                        </tr>
                        <tr>
                            <td className="text-nowrap">メモリ</td>
                            <td className="text-nowrap">{result.memory} kb</td>
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
                        {submission.testcases.map((testcase) => (
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
