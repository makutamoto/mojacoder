import { S3Handler } from 'aws-lambda'
import { DynamoDB, S3 } from 'aws-sdk'
import * as JSZip from 'jszip'
import join from 'url-join'
import { posix } from 'path'
import { v4 as uuid } from 'uuid'

const PROBLEM_TABLE_NAME = process.env.PROBLEM_TABLE_NAME as string;
if(PROBLEM_TABLE_NAME === undefined) throw "PROBLEM_TABLE_NAME is not defined.";
const SLUG_TABLE_NAME = process.env.SLUG_TABLE_NAME as string;
if(SLUG_TABLE_NAME === undefined) throw "SLUG_TABLE_NAME is not defined.";
const POSTED_PROBLEMS_BUCKET_NAME = process.env.POSTED_PROBLEMS_BUCKET_NAME as string;
if(POSTED_PROBLEMS_BUCKET_NAME === undefined) throw "POSTED_PROBLEMS_BUCKET_NAME is not defined.";
const TESTCASES_BUCKET_NAME = process.env.TESTCASES_BUCKET_NAME as string;
if(TESTCASES_BUCKET_NAME === undefined) throw "TESTCASES_BUCKET_NAME is not defined.";
const TESTCASES_FOR_VIEW_BUCKET_NAME = process.env.TESTCASES_FOR_VIEW_BUCKET_NAME as string;
if(TESTCASES_FOR_VIEW_BUCKET_NAME === undefined) throw "TESTCASES_FOR_VIEW_BUCKET_NAME is not defined.";
const JUDGECODES_BUCKET_NAME = process.env.JUDGECODES_BUCKET_NAME as string;
if(JUDGECODES_BUCKET_NAME === undefined) throw "JUDGECODES_BUCKET_NAME is not defined.";

const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});
const s3 = new S3({apiVersion: '2006-03-01'});

type JudgeType = "NORMAL" | "SPECIAL";
interface Config {
    title: string,
    notListed?: boolean,
    difficulty?: string,
    judgeType?: JudgeType
    judgeLang?: string
}

interface Problem {
    title: string
    notListed: boolean,
    statement: string
    editorial: string | null
    difficulty: string | null
    testcases: Buffer
    testcasesDir: JSZip
    testcaseNames: string[]
    judgeType: JudgeType
    judgeLang: string
    judgeCode: string | null
}

async function parseZip(data: Buffer): Promise<Problem> {
    const zip = await JSZip.loadAsync(data);
    const configFile = zip.file('problem.json');
    if(configFile === null) throw "Config not fonud.";
    const { title, notListed, difficulty, judgeType, judgeLang } = JSON.parse(await configFile.async("string")) as Config;
    const statementFile = zip.file('README.md');
    if(statementFile === null) throw "Statement not found.";
    const statement = await statementFile.async("string");
    const editorialFile = zip.file('EDITORIAL.md');
    let editorial: string | null;
    if(editorialFile) editorial = await editorialFile.async("string");
    else editorial = null;
    const judgeCodeFile = zip.file("judgeCode");
    let judgeCode: string | null;
    if(judgeCodeFile) judgeCode = await judgeCodeFile.async("string");
    else judgeCode = null;
    if(judgeType && judgeType !== "NORMAL"  && judgeCode === null) throw "Judge code is required for special judge."
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
        notListed: notListed || false,
        statement,
        editorial,
        difficulty: difficulty || null,
        testcases,
        testcasesDir,
        testcaseNames,
        judgeType: judgeType || "NORMAL",
        judgeLang: judgeLang || "",
        judgeCode
    }
}

async function uploadToS3(problemID: string, testcases: Buffer, testcasesDir: JSZip, judgeCode: string | null) {
    await s3.putObject({ Bucket: TESTCASES_BUCKET_NAME, Key: problemID + '.zip', Body: testcases }).promise()
    const inTestcases = testcasesDir.folder('in')!
    const outTestcases = testcasesDir.folder('out')!
    const inTestcaseFiles = inTestcases.filter((_, file) => !file.dir)
    for(let file of inTestcaseFiles) {
        const { base } = posix.parse(file.name)
        const outTestcaseFile = outTestcases.file(base)
        if(outTestcaseFile === null || outTestcaseFile.dir) continue
        const inTestcaseBuffer = await file.async("nodebuffer")
        await s3.putObject({ Bucket: TESTCASES_FOR_VIEW_BUCKET_NAME, Key: join(problemID, 'in', base), Body: inTestcaseBuffer }).promise()
        const outTestcaseBuffer = await outTestcaseFile.async("nodebuffer")
        await s3.putObject({ Bucket: TESTCASES_FOR_VIEW_BUCKET_NAME, Key: join(problemID, 'out', base), Body: outTestcaseBuffer }).promise()
    }
    if(judgeCode){
        await s3.putObject({ Bucket: JUDGECODES_BUCKET_NAME, Key: problemID, Body: judgeCode }).promise()
    }
}

async function deployProblem(key: string): Promise<void> {
    const data = await s3.getObject({
        Bucket: POSTED_PROBLEMS_BUCKET_NAME,
        Key: key,
    }).promise();
    const problem = await parseZip(data.Body as Buffer);
    const keyPath = posix.parse(key);
    const userID = keyPath.dir;
    const status = problem.notListed ? 'CREATED_NOT_LISTED' : 'CREATED'
    const slug = decodeURIComponent(keyPath.name);
    const slugRecord = await dynamodb.getItem({
        TableName: SLUG_TABLE_NAME,
        Key: {
            userID: {
                S: userID,
            },
            slug: {
                S: slug,
            },
        },
    }).promise();
    let problemID: string
    if(slugRecord.Item) {
        problemID = slugRecord.Item.problemID.S!;
        await dynamodb.updateItem({
            TableName: PROBLEM_TABLE_NAME,
            Key: {
                id: {
                    S: problemID,
                },
            },
            ExpressionAttributeNames: {
                "#status": "status",
            },
            ExpressionAttributeValues: {
                ":title": {
                    S: problem.title,
                },
                ":status": {
                    S: status,
                },
                ":statement": {
                    S: problem.statement,
                },
                ":hasEditorial": {
                    BOOL: problem.editorial !== null,
                },
                ":editorial": {
                    S: problem.editorial || '',
                },
                ":hasDifficulty": {
                    BOOL: problem.difficulty !== null,
                },
                ":difficulty": {
                    S: problem.difficulty || '',
                },
                ":testcaseNames": {
                    L: problem.testcaseNames.map((name) => ({ S: name })),
                },
                ":judgeType": {
                    S: problem.judgeType
                },
                ":judgeLang": {
                    S: problem.judgeLang
                }
            },
            UpdateExpression: "SET title = :title, #status = :status, statement = :statement, hasEditorial = :hasEditorial, editorial = :editorial, hasDifficulty = :hasDifficulty, difficulty = :difficulty, testcaseNames = :testcaseNames, judgeType = :judgeType, judgeLang = :judgeLang",
        }).promise();
    } else {
        problemID = uuid();
        await dynamodb.transactWriteItems({
            TransactItems: [
                {
                    Put: {
                        TableName: SLUG_TABLE_NAME,
                        Item: {
                            userID: {
                                S: userID,
                            },
                            slug: {
                                S: slug,
                            },
                            problemID: {
                                S: problemID,
                            },
                        },
                        ConditionExpression: 'attribute_not_exists(#problemID)',
                        ExpressionAttributeNames: {
                            '#problemID': 'problemID',
                        },
                    },
                },
                {
                    Put: {
                        TableName: PROBLEM_TABLE_NAME,
                        Item: {
                            id: {
                                S: problemID,
                            },
                            slug: {
                                S: slug,
                            },
                            userID: {
                                S: userID,
                            },
                            datetime: {
                                S: (new Date()).toISOString(),
                            },
                            status: {
                                S: status,
                            },
                            likeCount: {
                                N: '0',
                            },
                            commentCount: {
                                N: '0',
                            },
                            title: {
                                S: problem.title,
                            },
                            statement: {
                                S: problem.statement,
                            },
                            hasEditorial: {
                                BOOL: problem.editorial !== null,
                            },
                            editorial: {
                                S: problem.editorial || '',
                            },
                            hasDifficulty: {
                                BOOL: problem.difficulty !== null,
                            },
                            difficulty: {
                                S: problem.difficulty || '',
                            },
                            testcaseNames: {
                                L: problem.testcaseNames.map((name) => ({ S: name })),
                            },
                            judgeType: {
                                S: problem.judgeType
                            },
                            judgeLang: {
                                S: problem.judgeLang
                            },
                        },
                        ConditionExpression: 'attribute_not_exists(#id)',
                        ExpressionAttributeNames: {
                            '#id': 'id',
                        },
                    },
                },
            ],
        }).promise();
    }
    await uploadToS3(problemID, problem.testcases, problem.testcasesDir, problem.judgeCode);
}

export const handler: S3Handler = async (event) => {
    for(let record of event.Records) {
        const key = record.s3.object.key;
        console.log(`processing '${key}'...`)
        try {
            await deployProblem(key);
        } catch(err) {
            console.error(err);
        }
    }
};
