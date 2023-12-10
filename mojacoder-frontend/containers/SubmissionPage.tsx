import React, { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Table } from 'react-bootstrap'
import clsx from 'clsx'
import join from 'url-join'

import { Submission, SubmissionStatus } from '../lib/backend_types'
import { JudgeStatus } from '../lib/JudgeStatus'
import { getProgrammingLanguageNameFromID } from '../lib/programming_language'
import { getJudgeStatusFromTestcases } from '../lib/JudgeStatus'
import Editor from '../components/Editor'
import CopyButton from '../components/CopyButton'
import DateTime from '../components/DateTime'
import Username from '../components/Username'
import JudgeStatusBadge from '../components/JudgeStatusBadge'

import positionStyles from '../css/position.module.css'

export interface SubmissionPageProps {
    submission: Submission
}

const SubmissionPage: React.FC<SubmissionPageProps> = ({ submission }) => {
    const { query, pathname } = useRouter()
    const result = useMemo(() => {
        if (submission)
            return getJudgeStatusFromTestcases(
                submission.status,
                submission.testcases
            )
        else return null
    }, [submission])
    return (
        <div>
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
                            {getProgrammingLanguageNameFromID(submission.lang)}
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
                                    {testcase.name}
                                </Link>
                            </td>
                            <td className="text-nowrap">
                                <JudgeStatusBadge
                                    status={
                                        submission.status !==
                                            SubmissionStatus.WJ &&
                                        testcase.status === JudgeStatus.WJ
                                            ? JudgeStatus.CC
                                            : testcase.status
                                    }
                                />
                            </td>
                            <td className="text-nowrap">{testcase.time} ms</td>
                            <td className="text-nowrap">
                                {testcase.memory} kb
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    )
}
export default SubmissionPage
