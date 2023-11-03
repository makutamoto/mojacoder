import React from 'react'
import Link from 'next/link'

import { Table } from 'react-bootstrap'
import { Contest } from '../lib/backend_types'
import DateTime from './DateTime'
import Username from './Username'

interface Props {
    contests: Contest[]
}

export const ContestsTable: React.FC<Props> = ({ contests }) => {
    return (
        <Table responsive bordered striped hover>
            <thead>
                <tr>
                    <th className="text-nowrap">開催日時</th>
                    <th className="text-nowrap">主催者</th>
                    <th className="text-nowrap">コンテスト名</th>
                    <th className="text-nowrap">時間(秒)</th>
                    <th className="text-nowrap">問題数</th>
                </tr>
            </thead>
            <tbody>
                {contests.map((item) => (
                    <tr key={item.id}>
                        <td className="text-nowrap">
                            <DateTime>{item.startDatetime}</DateTime>
                        </td>
                        <td className="text-nowrap">
                            <Username>{item.user.detail}</Username>
                        </td>
                        <td className="text-nowrap">
                            <Link
                                href={`/users/${item.user.detail.screenName}/contests/${item.slug}`}
                            >
                                <a>{item.name}</a>
                            </Link>
                        </td>
                        <td className="text-nowrap">{item.duration}</td>
                        <td className="text-nowrap">{item.numberOfTasks}</td>
                    </tr>
                ))}
            </tbody>
        </Table>
    )
}

export default ContestsTable
