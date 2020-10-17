import { S3Handler } from 'aws-lambda'
import { DynamoDB, S3 } from 'aws-sdk'
import * as JSZip from 'jszip'
import { parse } from 'path'

const TABLE_NAME = process.env.TABLE_NAME as string;
if(TABLE_NAME === undefined) throw "TABLE_NAME is not defined.";
const POSTED_PROBLEMS_BUCKET_NAME = process.env.POSTED_PROBLEMS_BUCKET_NAME as string;
if(POSTED_PROBLEMS_BUCKET_NAME === undefined) throw "POSTED_PROBLEMS_BUCKET_NAME is not defined.";
const TESTCASES_BUCKET_NAME = process.env.TESTCASES_BUCKET_NAME as string;
if(TESTCASES_BUCKET_NAME === undefined) throw "TESTCASES_BUCKET_NAME is not defined.";

const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
const s3 = new S3({apiVersion: '2006-03-01'});

interface Config {
    title: string,
}

interface Task {
    title: string,
    statement: string,
    testcases: Buffer,
}

async function parseZip(data: Buffer): Promise<Task> {
    const zip = await JSZip.loadAsync(data);
    const configFile = zip.file('task.json');
    if(configFile === null) throw "Config not fonud.";
    const { title } = JSON.parse(await configFile.async("string")) as Config;
    const statementFile = zip.file('README.md');
    if(statementFile === null) throw "Statement not found.";
    const statement = await statementFile.async("string");
    const testcasesDir = zip.folder('testcases');
    if(testcasesDir === null) throw "Testcases not found.";
    const testcases = await testcasesDir.generateAsync({
        type: "nodebuffer",
    });
    return {
        title,
        statement,
        testcases,
    }
}

function deployProblem(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
        s3.getObject({
            Bucket: POSTED_PROBLEMS_BUCKET_NAME,
            Key: key,
        }, (err, data) => {
            if(err) {
                console.error(err);
                reject("Internal Error Occurred.");
                return;
            }
            parseZip(data.Body as Buffer).then((task) => {
                const keyPath = parse(key);
                dynamodb.updateItem({
                    TableName: TABLE_NAME,
                    Key: {
                        id: {
                            S: keyPath.name,
                        },
                    },
                    ExpressionAttributeValues: {
                        ":title": {
                            S: task.title,
                        },
                        ":statement": {
                            S: task.statement,
                        },
                    },
                    UpdateExpression: "SET title = :title, statement = :statement",
                }, (err) => {
                    if(err) {
                        console.error(err);
                        reject("Failed to update Database.");
                        return;
                    }
                    s3.putObject({
                        Bucket: TESTCASES_BUCKET_NAME,
                        Key: keyPath.base,
                        Body: task.testcases,
                    }, (err) => {
                        if(err) {
                            console.error(err);
                            reject("Failed to update testcases.");
                            return;
                        }
                        resolve();
                    });
                });
            }).catch((err) => reject(err));
        });
    });
}

export const handler: S3Handler = async (event) => {
    for(let record of event.Records) {
        const key = record.s3.object.key;
        try {
            await deployProblem(key);
        } catch(err) {
            console.error(err);
        }
    }
};
