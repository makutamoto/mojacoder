type JudgeStatus = 'WJ' | 'CE' | 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'IE';
export default JudgeStatus;

export interface JudgeStatusDetail {
    current: number,
    whole: number,
}

export const JudgeStatusToText = {
    "WJ": "ジャッジ待ち",
    "CE": "コンパイルエラー",
    "AC": "正解",
    "WA": "不正解",
    "TLE": "実行時間制限超過",
    "MLE": "メモリ制限超過",
    "RE": "実行時エラー",
    "IE": "内部エラー",
};
