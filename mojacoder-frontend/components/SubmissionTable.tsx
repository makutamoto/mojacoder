import React from 'react'
import { Table } from 'react-bootstrap'

import JudgeStatusBadge from '../components/JudgeStatusBadge'
// import { CodetestSubmission } from '../lib/backend'

// export interface SubmissionTableProps {
//   submissions: CodetestSubmission[]
// }

const SubmissionTable: React.FC<any> = (props) => {
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
                    <tr key={submission.submissionID}>
                        <td>{submission.time}</td>
                        <td>{submission.userID}</td>
                        <td>{submission.lang}</td>
                        <td className="text-center">
                            <JudgeStatusBadge status="AC" />
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    )
}

export default SubmissionTable
