import { AppSyncResolverHandler } from 'aws-lambda'
import { DynamoDB } from 'aws-sdk'

const CONTESTANT_TABLE = process.env.CONTESTANT_TABLE as string;
if(CONTESTANT_TABLE === undefined) throw "CONTESTANT_TABLE is not defined.";
const SUBMISSION_TABLE = process.env.SUBMISSION_TABLE as string;
if(SUBMISSION_TABLE === undefined) throw "SUBMISSION_TABLE is not defined.";

const dynamodb = new DynamoDB({apiVersion: '2012-08-10'})

interface ContestProblem {
    problemID: string
    point: number
}

interface ProblemIndex {
    index: number
    point: number
}

interface Source {
    id: string
    startDatetime: string
    penaltySeconds: number
    problems: ContestProblem[]
}

interface User {
    userID: string
}

interface ContestSubmission {
    penalty: number
    score?: number
    secondsFromStart?: number
}

interface Standing {
    rank: number
    user: User
    score: number
    penalty: number
    secondsFromStart: number
    submissions: ContestSubmission[]
}

export const handler: AppSyncResolverHandler<{ input: { problemName: string } }, Standing[]> = async (event) => {
    const { startDatetime, penaltySeconds, ...source } = event.source as Source
    const contestID = source.id
    const startEpoch = new Date(startDatetime).getTime()
    const problems = new Map<string, ProblemIndex>()
    for(const index of source.problems.keys()) {
        const { problemID, point } = source.problems[index]
        problems.set(problemID, {
            index,
            point: point,
        })
    }
    const contestants = (await dynamodb.query({
        TableName: CONTESTANT_TABLE,
        ExpressionAttributeNames: {
            '#contestID': 'contestID',
            '#userID': 'userID',
        },
        ExpressionAttributeValues: {
            ':contestID': {
                S: contestID,
            },
        }, 
        KeyConditionExpression: "#contestID = :contestID",
        ProjectionExpression: "#userID",
    }).promise()).Items!
    const results = new Map<string, Standing>()
    for(let contestant of contestants) {
        const userID = contestant.userID.S!
        results.set(userID, {
            user: {
                userID,
            },
            rank: 0,
            score: 0,
            penalty: 0,
            secondsFromStart: 0,
            submissions: new Array<ContestSubmission>(source.problems.length).fill({
                penalty: 0,
            }),
        })
    }
    const submissions = (await dynamodb.query({
        TableName: SUBMISSION_TABLE,
        ExpressionAttributeNames: {
            '#contestID': 'contestID',
            '#userID': 'userID',
            '#datetime': 'datetime',
            '#problemID': 'problemID',
            '#status': 'status',
            '#testcases': 'testcases',
        },
        ExpressionAttributeValues: {
            ':contestID': {
                S: contestID,
            },
            ':status': {
                S: 'JUDGED',
            },
        }, 
        KeyConditionExpression: "#contestID = :contestID AND #status = :status",
        ProjectionExpression: "#userID, #datetime, #problemID, #status, #testcases",
    }).promise()).Items!
    submissionLoop: for(const submission of submissions) {
        const userID = submission.userID.S!
        const result = results.get(userID)
        if(!result) continue
        const problem = problems.get(submission.problemID.S!)
        if(!problem) continue
        const resultSubmission = result.submissions[problem.index]
        if(submission.score !== undefined) continue
        for(let testcase of submission.testcases.L!) {
            const { status } = testcase.M!
            if(status.S !== 'AC') {
                resultSubmission.penalty++
                continue submissionLoop
            }
        }
        resultSubmission.score = problem.point
        resultSubmission.secondsFromStart = Math.floor((new Date(submission.datetime.S!).getTime() - startEpoch) / 1000)
        result.score += problem.point
        result.penalty += resultSubmission.penalty
        result.secondsFromStart = Math.max(result.secondsFromStart, resultSubmission.secondsFromStart + penaltySeconds * resultSubmission.secondsFromStart)
    }
    const standings = Array.from(results.values())
    standings.sort((a, b) => a.score - b.score || b.secondsFromStart - a.secondsFromStart)
    return standings
};
