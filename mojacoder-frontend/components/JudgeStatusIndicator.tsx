import React, { useEffect, useState } from 'react';
import { Badge } from 'react-bootstrap';

import JudgeStatus, { JudgeStatusDetail } from '../lib/JudgeStatus';

import styles from './JudgeStatusIndicator.module.css';

export interface JudgeStatusIndicatorProps {
    status: JudgeStatus,
    detail?: JudgeStatusDetail,
}

export const JudgeStatusColors = {
    WJ: "secondary",
    AC: "success",
    WA: "warning",
    TLE: "warning",
    MLE: "warning",
    RE: "warning",
    IE: "danger",
};

const JudgeStatusIndicator: React.FC<JudgeStatusIndicatorProps> = (props) => {
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
            <Badge className="text-white" variant={JudgeStatusColors[props.status]}>
                {props.detail && `${props.detail.current}/${props.detail.whole} `}
                {props.detail && props.status == 'WJ' ? null : props.status}
            </Badge>
            <span className={styles["align-sub"]}>{progressDot}</span>
        </span>
    );
}

export default JudgeStatusIndicator;
