import { JudgeStatusDetail } from '../lib/JudgeStatus'

export interface Connection<T> {
    items: T[]
    nextToken: string
}

export interface Problem {
    id: string
    title: string
    statement
    submissions: Connection<Submission>
}

export const SubmissionStatus = {
    WJ: 'WJ',
    CE: 'CE',
    JUDGED: 'JUDGED',
} as const
export type SubmissionStatus = typeof SubmissionStatus[keyof typeof SubmissionStatus]

export interface Submission {
    id: string
    problemID: string
    userID: string
    datetime: string
    lang: string
    status: SubmissionStatus
    testcases: JudgeStatusDetail[]
}

export interface User {
    userID: string | null
    screenName: string | null
    problem: Problem
    problems: Connection<Problem>
}
