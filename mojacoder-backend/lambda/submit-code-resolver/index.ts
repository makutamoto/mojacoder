import { AppSyncResolverHandler, AppSyncIdentityCognito } from 'aws-lambda'
import { DynamoDB, S3, SQS } from 'aws-sdk'
import { v4 as uuid } from 'uuid'

const SUBMISSION_TABLE_NAME = process.env.SUBMISSION_TABLE_NAME as string;
if(SUBMISSION_TABLE_NAME === undefined) throw "SUBMISSION_TABLE_NAME is not defined.";
const SUBMITTED_CODE_BUCKET_NAME = process.env.SUBMITTED_CODE_BUCKET_NAME as string;
if(SUBMITTED_CODE_BUCKET_NAME === undefined) throw "SUBMITTED_CODE_BUCKET_NAME is not defined.";
const JUDGEQUEUE_URL = process.env.JUDGEQUEUE_URL as string;
if(JUDGEQUEUE_URL === undefined) throw "JUDGEQUEUE_URL is not defined.";

const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
const s3 = new S3({apiVersion: '2006-03-01'});
const sqs = new SQS({apiVersion: '2012-11-05'});

interface Arguments {
    problemID: string,
    lang: string,
    code: string,
}

interface Response extends Arguments {
    id: string,
}

type SUBMISSION = 'SUBMISSION';
interface JudgeQueueMessage {
    type: SUBMISSION
	submissionID: string
}

export const handler: AppSyncResolverHandler<{ input: Arguments }, Response> = (event) => {
    return new Promise((resolve, reject) => {
        const id = uuid();
        const { problemID, lang, code } = event.arguments.input;
        const sub = (event.identity as AppSyncIdentityCognito).sub;
        const datetime = new Date();
        dynamodb.putItem({
            Item: {
                id: {
                    S: id,
                },
                lang: {
                    S: lang,
                },
                problemID: {
                    S: problemID
                },
                userID: {
                    S: sub,
                },
                datetime: {
                    N: datetime.toISOString(),
                }
            },
            ConditionExpression: 'attribute_not_exists(#id)',
            ExpressionAttributeNames: {
                '#id': 'id',
            },
            TableName: SUBMISSION_TABLE_NAME,
        }, (err) => {
            if(err) {
                reject(err);
                return;
            }
            s3.putObject({
                Body: code,
                Bucket: SUBMITTED_CODE_BUCKET_NAME,
                Key: id,
            }, (err) => {
                if(err) {
                    reject(err);
                    return;
                }
                const message: JudgeQueueMessage = {
                    type: "SUBMISSION",
                    submissionID: id,
                };
                sqs.sendMessage({
                    MessageBody: JSON.stringify(message),
                    QueueUrl: JUDGEQUEUE_URL,
                }, (err) => {
                    if(err) {
                        reject(err);
                        return;
                    }
                    resolve({
                        id,
                        problemID,
                        lang,
                        code,
                    });
                });
            });
        });
    });
};
