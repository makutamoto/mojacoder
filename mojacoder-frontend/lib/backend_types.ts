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

export interface Problem {
    id: string
    slug: string
    title: string
    datetime: string
    user: User
    statement: string
    likedByMe: boolean
    likeCount: number
    likers: Connection<User>
    commentCount: number
    comments: Connection<Comment>
    inTestcase: string
    outTestcase: string
    testcaseNames: string[]
    submission: Submission | null
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
