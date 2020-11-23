export const JudgeStatus = {
    WJ: 'WJ',
    CE: 'CE',
    AC: 'AC',
    WA: 'WA',
    TLE: 'TLE',
    MLE: 'MLE',
    RE: 'RE',
    IE: 'IE',
} as const
export type JudgeStatus = typeof JudgeStatus[keyof typeof JudgeStatus]

export interface JudgeStatusDetail {
    name: string
    status: JudgeStatus
}

export const JudgeStatusToText = {
    WJ: 'ジャッジ待ち',
    CE: 'コンパイルエラー',
    AC: '正解',
    WA: '不正解',
    TLE: '実行時間制限超過',
    MLE: 'メモリ制限超過',
    RE: '実行時エラー',
    IE: '内部エラー',
}
