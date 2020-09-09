import React, { useEffect, useState } from 'react';
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';

import JudgeStatus, { JudgeStatusDetail, JudgeStatusToText } from '../lib/JudgeStatus';

import styles from './JudgeStatusBadge.module.css';

export interface JudgeStatusBadgeProps {
    status: JudgeStatus,
    detail?: JudgeStatusDetail,
}

export const JudgeStatusColors = {
    WJ: "secondary",
    CE: "warning",
    AC: "success",
    WA: "warning",
    TLE: "warning",
    MLE: "warning",
    RE: "warning",
    IE: "danger",
};

const JudgeStatusBadge: React.FC<JudgeStatusBadgeProps> = (props) => {
    const [progressDot, setProgressDot] = useState('');
    useEffect(() => {
        if(props.detail || props.status == 'WJ') {
            const interval = setInterval(() => {
                if(progressDot === '...') setProgressDot('');
                else setProgressDot(progressDot + '.');
            }, 250);
            return () => clearInterval(interval);
        } else {
            setProgressDot('');
        }
    }, [progressDot, setProgressDot, props.status, props.detail]);
    return (
        <span>
            <OverlayTrigger
                placement="top"
                overlay={<Tooltip id="judgestatusbadge-tooltip">{JudgeStatusToText[props.status]}</Tooltip>}
            >
                <Badge className="text-white" variant={JudgeStatusColors[props.status]}>
                    {props.detail && `${props.detail.current}/${props.detail.whole} `}
                    {props.detail && props.status == 'WJ' ? null : props.status}
                </Badge>
            </OverlayTrigger>
            <span className={styles["align-sub"]}>{progressDot}</span>
        </span>
    );
}

export default JudgeStatusBadge;
