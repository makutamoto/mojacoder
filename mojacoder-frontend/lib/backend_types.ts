import { JudgeStatusDetail } from '../lib/JudgeStatus'

export interface Connection<T> {
    items: T[]
    nextToken: string
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
}

export const SubmissionStatus = {
    WJ: 'WJ',
    CE: 'CE',
    JUDGED: 'JUDGED',
    IE: 'IE',
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
    problem: Problem | null
    problems: Connection<Problem>
}

export interface Query {
    user: UserDetail | null
    newProblems: Problem[]
}

export interface Mutation {
    postComment: Comment
    postReply: Reply
    issueProblemUploadUrl: string
    issueProblemDownloadUrl: string
}
