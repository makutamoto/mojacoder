type JudgeStatus = 'WJ' | 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'IE';
export default JudgeStatus;

export interface JudgeStatusDetail {
    current: number,
    whole: number,
}
