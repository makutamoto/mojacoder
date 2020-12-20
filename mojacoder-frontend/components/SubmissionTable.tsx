import React, { useMemo } from 'react'
import { Table } from 'react-bootstrap'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { join } from 'path'

import {
    JudgeStatusDetail,
    getJudgeStatusFromTestcases,
} from '../lib/JudgeStatus'
import { SubmissionStatus, User } from '../lib/backend_types'
import { getProgrammingLanguageNameFromID } from '../lib/programming_language'
import DateTime from './DateTime'
import JudgeStatusBadge from './JudgeStatusBadge'
import Username from './Username'

interface Submission {
    id: string
    problemID: string
    user: User
    datetime: string
    lang: string
    status: SubmissionStatus
    testcases: JudgeStatusDetail[]
}

interface SubmissionTableRowProps {
    submission: Submission
}
const SubmissionTableRow: React.FC<SubmissionTableRowProps> = (props) => {
    const router = useRouter()
    const { status, testcases } = props.submission
    const { wholeStatus, time, memory, progress } = useMemo(() => {
        return getJudgeStatusFromTestcases(status, testcases)
    }, [status, testcases])
    const { id, lang } = props.submission
    const userDetail = props.submission.user.detail
    return (
        <tr key={props.submission.id}>
            <td>
                <DateTime>{props.submission.datetime}</DateTime>
            </td>
            <td>
                <Username>{userDetail}</Username>
            </td>
            <td>{getProgrammingLanguageNameFromID(lang)}</td>
            <td className="text-center">
                <JudgeStatusBadge status={wholeStatus} progress={progress} />
            </td>
            <td>{time} ms</td>
            <td>{memory} kb</td>
            <td className="text-center">
                <Link
                    href={{
                        pathname: join(router.pathname, '[id]'),
                        query: {
                            ...router.query,
                            id,
                        },
                    }}
                    passHref
                >
                    <a>詳細</a>
                </Link>
            </td>
        </tr>
    )
}

interface SubmissionTableProps {
    submissions: Submission[]
}
const SubmissionTable: React.FC<SubmissionTableProps> = (props) => {
    return (
        <Table responsive striped bordered hover>
            <thead>
                <tr>
                    <th>提出日時</th>
                    <th>ユーザー</th>
                    <th>言語</th>
                    <th>結果</th>
                    <th>実行時間</th>
                    <th>メモリ</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {props.submissions.map((submission) => (
                    <SubmissionTableRow
                        key={submission.id}
                        submission={submission}
                    />
                ))}
            </tbody>
        </Table>
    )
}

export default SubmissionTable
