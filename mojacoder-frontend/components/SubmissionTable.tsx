import React, { useMemo } from 'react'
import { Table } from 'react-bootstrap'
import Link from 'next/link'

import JudgeStatusBadge, {
    JudgeStatusBadgeProgress,
} from '../components/JudgeStatusBadge'
import { JudgeStatus, JudgeStatusDetail } from '../lib/JudgeStatus'
import { SubmissionStatus, User } from '../lib/backend_types'

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
    const { status, testcases } = props.submission
    const { wholeStatus, progress } = useMemo(() => {
        if (status === SubmissionStatus.CE) {
            return { wholeStatus: JudgeStatus.CE, progress: null }
        }
        if (status === SubmissionStatus.WJ && testcases.length === 0) {
            return { wholeStatus: JudgeStatus.WJ, progress: null }
        }
        let wholeStatus: JudgeStatus = JudgeStatus.AC
        const progress: JudgeStatusBadgeProgress = {
            current: 0,
            whole: testcases.length,
        }
        for (const testcase of testcases) {
            if (testcase.status !== JudgeStatus.WJ) progress.current++
            if (testcase.status === JudgeStatus.WA) {
                wholeStatus = JudgeStatus.WA
            } else if (
                wholeStatus === JudgeStatus.AC &&
                testcase.status === JudgeStatus.TLE
            ) {
                wholeStatus = JudgeStatus.TLE
            }
        }
        if (wholeStatus === JudgeStatus.AC && status === SubmissionStatus.WJ) {
            wholeStatus = JudgeStatus.WJ
        }
        return {
            wholeStatus,
            progress: status === SubmissionStatus.WJ ? progress : null,
        }
    }, [status, testcases])
    const datetime = useMemo(
        () => new Date(props.submission.datetime).toLocaleString(),
        [props.submission.datetime]
    )
    const screenName = props.submission.user.detail.screenName
    return (
        <tr key={props.submission.id}>
            <td>{datetime}</td>
            <td>
                <Link href={`/users/${screenName}`} passHref>
                    <a>{screenName}</a>
                </Link>
            </td>
            <td>{props.submission.lang}</td>
            <td className="text-center">
                <JudgeStatusBadge status={wholeStatus} progress={progress} />
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
