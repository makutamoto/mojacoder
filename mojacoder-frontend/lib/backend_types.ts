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

export interface Submission {
    id: string
    problemID: string
    userID: string
    datetime: string
    lang: string
}

export interface User {
    userID: string | null
    screenName: string | null
    problem: Problem
    problems: Connection<Problem>
}
