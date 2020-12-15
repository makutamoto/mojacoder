import { AppSyncResolverHandler } from 'aws-lambda'
import { S3 } from 'aws-sdk'

const SUBMITTED_CODE_BUCKET_NAME = process.env.SUBMITTED_CODE_BUCKET_NAME as string;
if(SUBMITTED_CODE_BUCKET_NAME === undefined) throw "SUBMITTED_CODE_BUCKET_NAME is not defined.";

const s3 = new S3({apiVersion: '2006-03-01'});

export const handler: AppSyncResolverHandler<{}, string> = (event) => {
    return new Promise((resolve, reject) => {
        const id = event.source!.id as string
        s3.getObject({
            Bucket: SUBMITTED_CODE_BUCKET_NAME,
            Key: id,
        }, (err, data) => {
            if(err) {
                reject(err);
                return;
            }
            resolve(data.Body!.toString());
        });
    });
};
