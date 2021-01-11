import { AppSyncResolverHandler, AppSyncIdentityCognito } from 'aws-lambda'
import { S3 } from 'aws-sdk'

const POSTED_PROBLEMS_BUCKET_NAME = process.env.POSTED_PROBLEMS_BUCKET_NAME as string;
if(POSTED_PROBLEMS_BUCKET_NAME === undefined) throw "POSTED_PROBLEMS_BUCKET_NAME is not defined.";

const s3 = new S3({apiVersion: '2006-03-01'});

export const handler: AppSyncResolverHandler<{ input: { problemName: string } }, string> = async (event) => {
    const userID = (event.identity as AppSyncIdentityCognito).sub
    const problemName = event.arguments.input.problemName.replace(/\//g, '')
    if(problemName.length === 0) throw "Empty problem slugs are not allowed."
    const signedUrl = await s3.getSignedUrlPromise('getObject', {
        Bucket: POSTED_PROBLEMS_BUCKET_NAME,
        Key: `${userID}/${problemName}.zip`,
        Expires: 60,
    })
    return signedUrl
};
