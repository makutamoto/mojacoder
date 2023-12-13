import { JudgeStatusDetail } from '../lib/JudgeStatus'

export interface Connection<T> {
    items: T[]
    nextToken: string | null
}

export interface Reply {
    replyID: string
    user: User
    datetime: string
    content: string
}

export interface Comment {
    commentID: string
    user: User
    datetime: string
    content: string
    replyCount: number
    replies: Connection<Reply>
}

export interface Testcase {
    inUrl: string
    outUrl: string
}

export const ProblemStatus = {
    CREATED: 'CREATED',
    CREATED_PRIVATE: 'CREATED_PRIVATE',
} as const
export type ProblemStatus = typeof ProblemStatus[keyof typeof ProblemStatus]

export interface Problem {
    problemID: string
    detail: ProblemDetail
}
export type JudgeType = 'NORMAL' | 'SPECIAL'
export interface ProblemDetail {
    id: string
    slug: string
    title: string
    status: ProblemStatus
    datetime: string
    user: User
    statement: string
    hasEditorial: boolean | null
    editorial: string | null
    hasDifficulty: boolean | null
    difficulty: string | null
    likedByMe: boolean
    likeCount: number
    likers: Connection<User>
    commentCount: number
    comments: Connection<Comment>
    testcase: Testcase | null
    testcaseNames: string[]
    submission: Submission | null
    submissions: Connection<Submission>
    judgeType: JudgeType
    judgeLang: string
    judgeCodeUrl: string | null
}

export const SubmissionStatus = {
    WJ: 'WJ',
    CE: 'CE',
    JUDGED: 'JUDGED',
    IE: 'IE',
    JCE: 'JCE',
} as const
export type SubmissionStatus = typeof SubmissionStatus[keyof typeof SubmissionStatus]

export interface Submission {
    id: string
    problemID: string
    user: User
    datetime: string
    lang: string
    status: SubmissionStatus
    code: string
    stderr: string
    testcases: JudgeStatusDetail[]
}

export interface User {
    userID: string
    detail: UserDetail
}

export interface UserDetail {
    userID: string
    screenName: string
    icon: boolean
    problem: ProblemDetail | null
    problems: Connection<ProblemDetail>
    contests: Connection<Contest>
    contest: Contest | null
}

export interface ContestProblem {
    problem: Problem
    point: number
}

export interface ContestSubmission {
    penalty: number
    score: number
    secondsFromStart: number
}

export interface Standing {
    rank: number
    user: User
    score: number
    penalty: number
    secondsFromStart: number
    submissions: ContestSubmission[]
}

export const ContestStatus = {
    PUBLIC: 'PUBLIC',
    UNLISTED: 'UNLISTED',
} as const
export type ContestStatus = typeof ContestStatus[keyof typeof ContestStatus]

export interface ContestDetail {
    joined: boolean
    contestID?: string
    problems?: ContestProblem[]
    problem?: ContestProblem
    submissions?: Connection<Submission>
    submission?: Submission
}

export interface Contest {
    id: string
    user: User
    status: ContestStatus
    slug: string
    name: string
    description: string
    datetime: string
    startDatetime: string
    duration: number
    penaltySeconds: number
    numberOfTasks: number
    standings: Standing[]
    detail: ContestDetail
}

export interface Query {
    user: UserDetail | null
    newProblems: Connection<ProblemDetail>
    newContests: Contest[]
}

export interface Mutation {
    postComment: Comment
    postReply: Reply
    issueProblemUploadUrl: string
    issueProblemDownloadUrl: string
    submitCode: Submission
}
