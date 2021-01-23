import { AppSyncResolverHandler } from 'aws-lambda'
import { S3 } from 'aws-sdk'

const TESTCASES_FOR_VIEW = process.env.TESTCASES_FOR_VIEW as string;
if(TESTCASES_FOR_VIEW === undefined) throw "TESTCASES_FOR_VIEW is not defined.";

const s3 = new S3({apiVersion: '2006-03-01'});

export const handler: AppSyncResolverHandler<{ input: { problemName: string } }, string> = async (event) => {
    const problemID = event.source!.problemID as string
    const name = event.source!.name as string
    const signedUrl = await s3.getSignedUrlPromise('getObject', {
        Bucket: TESTCASES_FOR_VIEW,
        Key: `${problemID}/in/${name}`,
        Expires: 60,
        ContentType: 'text/plain',
    })
    return signedUrl
};
