import { SubmissionStatus } from './backend_types'
import { JudgeStatusBadgeProgress } from '../components/JudgeStatusBadge'

export const JudgeStatus = {
    WJ: 'WJ',
    CE: 'CE',
    AC: 'AC',
    WA: 'WA',
    TLE: 'TLE',
    MLE: 'MLE',
    RE: 'RE',
    CC: 'CC',
    IE: 'IE',
    JCE: 'JCE',
    JMLE: 'JMLE',
    JTLE: 'JTLE',
} as const
export type JudgeStatus = typeof JudgeStatus[keyof typeof JudgeStatus]

export interface JudgeStatusDetail {
    name: string
    status: JudgeStatus
    time: number
    memory: number
}

export const JudgeStatusToText = {
    WJ: 'ジャッジ待ち',
    CE: 'コンパイルエラー',
    AC: '正解',
    WA: '不正解',
    TLE: '実行時間制限超過',
    MLE: 'メモリ制限超過',
    RE: '実行時エラー',
    CC: 'ジャッジ中止',
    IE: '内部エラー',
    JCE: 'ジャッジコンパイルエラー',
    JMLE: 'ジャッジメモリ制限超過',
    JTLE: 'ジャッジ実行時間制限超過',
}

type WholeJudgeStatus = {
    wholeStatus: JudgeStatus
    progress: JudgeStatusBadgeProgress | null
    time?: number
    memory?: number
}

export function getJudgeStatusFromTestcases(
    status: SubmissionStatus,
    testcases: JudgeStatusDetail[]
): WholeJudgeStatus {
    if (status === SubmissionStatus.IE) {
        return { wholeStatus: JudgeStatus.IE, progress: null }
    }
    if (status === SubmissionStatus.CE) {
        return { wholeStatus: JudgeStatus.CE, progress: null }
    }
    if (status === SubmissionStatus.WJ && testcases.length === 0) {
        return { wholeStatus: JudgeStatus.WJ, progress: null }
    }
    if (status === SubmissionStatus.JCE) {
        return { wholeStatus: JudgeStatus.JCE, progress: null }
    }
    let wholeStatus: JudgeStatus = JudgeStatus.AC
    let time = -1,
        memory = -1
    const progress: JudgeStatusBadgeProgress = {
        current: 0,
        whole: testcases.length,
    }
    for (const testcase of testcases) {
        if (testcase.status !== JudgeStatus.WJ) progress.current++
        if (
            testcase.status !== JudgeStatus.WJ &&
            testcase.status !== JudgeStatus.AC
        ) {
            wholeStatus = testcase.status
        }
        time = Math.max(time, testcase.time)
        memory = Math.max(memory, testcase.memory)
    }
    if (wholeStatus === JudgeStatus.AC && status === SubmissionStatus.WJ) {
        wholeStatus = JudgeStatus.WJ
    }
    return {
        wholeStatus,
        time,
        memory,
        progress: status === SubmissionStatus.WJ ? progress : null,
    }
}
