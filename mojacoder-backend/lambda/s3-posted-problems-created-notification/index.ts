import { S3Handler } from 'aws-lambda'
import { DynamoDB, S3 } from 'aws-sdk'
import * as JSZip from 'jszip'
import { join, parse, ParsedPath } from 'path'

const TABLE_NAME = process.env.TABLE_NAME as string;
if(TABLE_NAME === undefined) throw "TABLE_NAME is not defined.";
const POSTED_PROBLEMS_BUCKET_NAME = process.env.POSTED_PROBLEMS_BUCKET_NAME as string;
if(POSTED_PROBLEMS_BUCKET_NAME === undefined) throw "POSTED_PROBLEMS_BUCKET_NAME is not defined.";
const TESTCASES_BUCKET_NAME = process.env.TESTCASES_BUCKET_NAME as string;
if(TESTCASES_BUCKET_NAME === undefined) throw "TESTCASES_BUCKET_NAME is not defined.";
const TESTCASES_FOR_VIEW_BUCKET_NAME = process.env.TESTCASES_FOR_VIEW_BUCKET_NAME as string;
if(TESTCASES_FOR_VIEW_BUCKET_NAME === undefined) throw "TESTCASES_FOR_VIEW_BUCKET_NAME is not defined.";

const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
const s3 = new S3({apiVersion: '2006-03-01'});

interface Config {
    title: string,
}

interface Problem {
    title: string
    statement: string
    testcases: Buffer
    testcasesDir: JSZip
    testcaseNames: string[]
}

async function parseZip(data: Buffer): Promise<Problem> {
    const zip = await JSZip.loadAsync(data);
    const configFile = zip.file('problem.json');
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
    const testcaseNames: string[] = []
    const inTestcases = testcasesDir.folder('in')
    if(inTestcases === null) {
        throw "Testcase directory 'in' not found."
    }
    const outTestcases = testcasesDir.folder('out')
    if(outTestcases === null) {
        throw "Testcase directory 'out' not found."
    }
    inTestcases.forEach((path, file) => {
        if(file.dir) return
        const outTestcaseFile = outTestcases.file(path)
        if(outTestcaseFile === null || outTestcaseFile.dir) return
        testcaseNames.push(path)
    })
    return {
        title,
        statement,
        testcases,
        testcasesDir,
        testcaseNames,
    }
}

function putObject(bucket: string, key: string, body: Buffer) {
    return new Promise((resolve, reject) => {
        s3.putObject({
            Bucket: bucket,
            Key: key,
            Body: body,
        }, (err) => {
            if(err) {
                console.error(err);
                reject("Failed to update testcases.");
                return;
            }
            resolve();
        });
    })
}

async function uploadToS3(keyPath: ParsedPath, testcases: Buffer, testcasesDir: JSZip) {
    await putObject(TESTCASES_BUCKET_NAME, keyPath.base, testcases)
    const inTestcases = testcasesDir.folder('in')!
    const outTestcases = testcasesDir.folder('out')!
    const inTestcaseFiles = inTestcases.filter((_, file) => !file.dir)
    for(let file of inTestcaseFiles) {
        const { base } = parse(file.name)
        const outTestcaseFile = outTestcases.file(base)
        if(outTestcaseFile === null || outTestcaseFile.dir) continue
        const inTestcaseBuffer = await file.async("nodebuffer")
        await putObject(TESTCASES_FOR_VIEW_BUCKET_NAME, join(keyPath.name, 'in', base), inTestcaseBuffer)
        const outTestcaseBuffer = await outTestcaseFile.async("nodebuffer")
        await putObject(TESTCASES_FOR_VIEW_BUCKET_NAME, join(keyPath.name, 'out', base), outTestcaseBuffer)
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
            parseZip(data.Body as Buffer).then((problem) => {
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
                            S: problem.title,
                        },
                        ":statement": {
                            S: problem.statement,
                        },
                        ":testcaseNames": {
                            L: problem.testcaseNames.map((name) => ({ S: name })),
                        },
                    },
                    UpdateExpression: "SET title = :title, statement = :statement, testcaseNames = :testcaseNames",
                }, (err) => {
                    if(err) {
                        console.error(err);
                        reject("Failed to update Database.");
                        return;
                    }
                    uploadToS3(keyPath, problem.testcases, problem.testcasesDir).then(() => {
                        resolve()
                    }).catch((err) => reject(err))
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
