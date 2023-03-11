import { AppSyncResolverHandler } from 'aws-lambda'
import { DynamoDB } from 'aws-sdk'
import { ItemList, Key, QueryOutput } from 'aws-sdk/clients/dynamodb';

const CONTESTANT_TABLE = process.env.CONTESTANT_TABLE as string;
if(CONTESTANT_TABLE === undefined) throw "CONTESTANT_TABLE is not defined.";
const SUBMISSION_TABLE = process.env.SUBMISSION_TABLE as string;
if(SUBMISSION_TABLE === undefined) throw "SUBMISSION_TABLE is not defined.";

const dynamodb = new DynamoDB({apiVersion: '2012-08-10'})

interface ContestProblem {
    problem: {
        problemID: string
    }
    point: number
}

interface ProblemIndex {
    index: number
    point: number
}

interface Source {
    id: string
    startDatetime: string
    duration: number
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

async function getContestants(contestID: string) {
    let contestants: ItemList = []
    let lastEvaluatedKey: Key | undefined = undefined
    do {
        const partial_contestants = (await dynamodb.query({
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
            ExclusiveStartKey: lastEvaluatedKey,
        }).promise()) as QueryOutput
        contestants = contestants.concat(partial_contestants.Items!)
        lastEvaluatedKey = partial_contestants.LastEvaluatedKey
    } while(lastEvaluatedKey)
    return contestants
}

async function getSubmissions(contestID: string) {
    let submissions: ItemList = []
    let lastEvaluatedKey: Key | undefined = undefined
    do {
        const partial_submissions = (await dynamodb.query({
            TableName: SUBMISSION_TABLE,
            IndexName: 'submission-contestID-index',
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
            KeyConditionExpression: "#contestID = :contestID",
            FilterExpression: '#status = :status',
            ProjectionExpression: "#userID, #datetime, #problemID, #status, #testcases",
            ExclusiveStartKey: lastEvaluatedKey,
        }).promise()) as QueryOutput
        submissions = submissions.concat(partial_submissions.Items!)
        lastEvaluatedKey = partial_submissions.LastEvaluatedKey
    } while(lastEvaluatedKey)
    return submissions
}

export const handler: AppSyncResolverHandler<{ input: { problemName: string } }, Standing[]> = async (event) => {
    const { startDatetime, duration, penaltySeconds, ...source } = event.source as Source
    const contestID = source.id
    const startEpoch = new Date(startDatetime).getTime()
    const problems = new Map<string, ProblemIndex>()
    for(const index of source.problems.keys()) {
        const { problem: { problemID }, point } = source.problems[index]
        problems.set(problemID, {
            index,
            point: point,
        })
    }
    const contestants = await getContestants(contestID)
    if(contestants.length == 0) return []
    const results = new Map<string, Standing>()
    for(let contestant of contestants) {
        const userID = contestant.userID.S!
        results.set(userID, {
            user: {
                userID,
            },
            rank: 1,
            score: 0,
            penalty: 0,
            secondsFromStart: 0,
            submissions: Array.from<undefined, ContestSubmission>({ length: source.problems.length }, () => ({
                penalty: 0,
            })),
        })
    }
    const submissions = await getSubmissions(contestID)
    submissionLoop: for(const submission of submissions) {
        const secondsFromStart = Math.floor((new Date(submission.datetime.S!).getTime() - startEpoch) / 1000)
        if(secondsFromStart < 0 || secondsFromStart > duration) continue
        const userID = submission.userID.S!
        const result = results.get(userID)
        if(!result) continue
        const problem = problems.get(submission.problemID.S!)
        if(!problem) continue
        const resultSubmission = result.submissions[problem.index]
        if(resultSubmission.score !== undefined) continue
        for(let testcase of submission.testcases.L!) {
            const { status } = testcase.M!
            if(status.S !== 'AC') {
                resultSubmission.penalty++
                continue submissionLoop
            }
        }
        resultSubmission.score = problem.point
        resultSubmission.secondsFromStart = secondsFromStart
        result.score += problem.point
        result.penalty += resultSubmission.penalty
        result.secondsFromStart = Math.max(result.secondsFromStart, resultSubmission.secondsFromStart + penaltySeconds * result.penalty)
    }
    const standings = Array.from(results.values())
    standings.sort((a, b) => b.score - a.score || a.secondsFromStart - b.secondsFromStart)
    let rank = 1;
    let prevScore = standings[0].score
    let prevSecondsFromStart = standings[0].secondsFromStart
    for(let i = 1;i < standings.length;i++) {
        if(prevScore !== standings[i].score || prevSecondsFromStart !== standings[i].secondsFromStart) {
            rank++;
            prevScore = standings[i].score
            prevSecondsFromStart = standings[i].secondsFromStart
        }
        standings[i].rank = rank
    }
    return standings
};
