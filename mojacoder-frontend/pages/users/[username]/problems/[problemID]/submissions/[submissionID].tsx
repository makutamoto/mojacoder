import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Spinner, Table } from 'react-bootstrap'
import gql from 'graphql-tag'

import { invokeQueryWithApiKey } from '../../../../../../lib/backend'
import {
    UserDetail,
    Submission,
    SubmissionStatus,
} from '../../../../../../lib/backend_types'
import ProblemTab from '../../../../../../components/ProblemTab'
import Editor from '../../../../../../components/Editor'
import JudgeStatusBadge from '../../../../../../components/JudgeStatusBadge'
import DateTime from '../../../../../../components/DateTime'
import { getProgrammingLanguageNameFromID } from '../../../../../../lib/programming_language'
import { getJudgeStatusFromTestcases } from '../../../../../../lib/JudgeStatus'
import Username from '../../../../../../components/Username'

const GetSubmission = gql`
    query GetSubmission(
        $authorUsername: String!
        $problemID: ID!
        $submissionID: ID!
    ) {
        user(username: $authorUsername) {
            problem(id: $problemID) {
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

const Submissions: React.FC = () => {
    const { query } = useRouter()
    const [submission, setSubmission] = useState<Submission | null>(null)
    const updateSubmissions = useCallback(() => {
        invokeQueryWithApiKey(GetSubmission, {
            authorUsername: query.username,
            problemID: query.problemID,
            submissionID: query.submissionID,
        }).then((data: GetSubmissionsResponse) => {
            const submission = data.user.problem.submission
            setSubmission(submission)
            if (submission && submission.status === SubmissionStatus.WJ) {
                setTimeout(updateSubmissions, 1000)
            }
        })
    }, [query])
    const result = useMemo(() => {
        if (submission)
            return getJudgeStatusFromTestcases(
                submission.status,
                submission.testcases
            )
        else return null
    }, [submission])
    useEffect(updateSubmissions, [updateSubmissions])
    return (
        <>
            <ProblemTab activeKey="submissions" />
            {submission === null ? (
                <div className="text-center">
                    <Spinner animation="border" />
                </div>
            ) : (
                <>
                    <Editor
                        lang={submission.lang}
                        value={submission.code}
                        lineNumbers
                        readOnly
                    />
                    <Table responsive striped bordered hover>
                        <tbody>
                            <tr>
                                <td>提出日時</td>
                                <td>
                                    <DateTime>{submission.datetime}</DateTime>
                                </td>
                            </tr>
                            <tr>
                                <td>ユーザー</td>
                                <td>
                                    <Username>
                                        {submission.user.detail}
                                    </Username>
                                </td>
                            </tr>
                            <tr>
                                <td>言語</td>
                                <td>
                                    {getProgrammingLanguageNameFromID(
                                        submission.lang
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td>結果</td>
                                <td>
                                    <JudgeStatusBadge
                                        status={result.wholeStatus}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>実行時間</td>
                                <td>{result.time} kb</td>
                            </tr>
                            <tr>
                                <td>メモリ</td>
                                <td>{result.memory} kb</td>
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
                            {submission.testcases.map((testcase) => (
                                <tr key={testcase.name}>
                                    <td>{testcase.name}</td>
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
                </>
            )}
        </>
    )
}
export default Submissions
