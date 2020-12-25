import React from 'react'
import { Badge, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap'

import { JudgeStatus, JudgeStatusToText } from '../lib/JudgeStatus'

export interface JudgeStatusBadgeProgress {
    current: number
    whole: number
}

export interface JudgeStatusBadgeProps {
    status?: JudgeStatus
    progress?: JudgeStatusBadgeProgress
}

export const JudgeStatusColors = {
    WJ: 'secondary',
    CE: 'warning',
    AC: 'success',
    WA: 'warning',
    TLE: 'warning',
    MLE: 'warning',
    RE: 'warning',
    IE: 'danger',
}

const JudgeStatusBadge: React.FC<JudgeStatusBadgeProps> = (props) => {
    return (
        <OverlayTrigger
            placement="top"
            overlay={
                <Tooltip id="judgestatusbadge-tooltip">
                    {JudgeStatusToText[props.status]}
                </Tooltip>
            }
        >
            <Badge
                className="text-white p-2"
                variant={JudgeStatusColors[props.status]}
            >
                {(props.status === JudgeStatus.WJ || props.progress) && (
                    <Spinner className="mr-2" animation="border" size="sm" />
                )}
                {props.progress &&
                    `${props.progress.current}/${props.progress.whole} `}
                {props.progress && props.status == JudgeStatus.WJ
                    ? null
                    : props.status}
            </Badge>
        </OverlayTrigger>
    )
}

export default JudgeStatusBadge
