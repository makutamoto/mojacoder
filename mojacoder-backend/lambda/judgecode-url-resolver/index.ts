import { AppSyncResolverHandler } from 'aws-lambda'
import { S3 } from 'aws-sdk'

const JUDGECODES_BUCKET_NAME = process.env.JUDGECODES_BUCKET_NAME as string;
if(JUDGECODES_BUCKET_NAME === undefined) throw "JUDGECODES_BUCKET_NAME is not defined.";

const s3 = new S3({apiVersion: '2006-03-01'});

export const handler: AppSyncResolverHandler<{}, string> = async (event) => {
    const problemID = event.source!.id as string
    const signedUrl = await s3.getSignedUrlPromise('getObject', {
        Bucket: JUDGECODES_BUCKET_NAME,
        Key: `${problemID}`,
        Expires: 60,
    })
    return signedUrl
};
