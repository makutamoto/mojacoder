export interface ProblemConnection {
    items: Problem[]
    nextToken: string
}

export interface Problem {
    id: string
    title: string
    statement
}

export interface User {
    userID: string | null
    screenName: string | null
    problem: Problem
    problems: ProblemConnection
}
