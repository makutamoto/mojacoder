import { AppSyncResolverHandler } from 'aws-lambda'
import { S3 } from 'aws-sdk'
import { join } from 'path'

const TESTCASES_FOR_VIEW_BUCKET_NAME = process.env.TESTCASES_FOR_VIEW_BUCKET_NAME as string;
if(TESTCASES_FOR_VIEW_BUCKET_NAME === undefined) throw "TESTCASES_FOR_VIEW_BUCKET_NAME is not defined.";

const s3 = new S3({apiVersion: '2006-03-01'});

export const handler: AppSyncResolverHandler<{}, string> = (event) => {
    return new Promise((resolve, reject) => {
        const id = event.source!.id as string
        const name = event.source!.name as string
        s3.getObject({
            Bucket: TESTCASES_FOR_VIEW_BUCKET_NAME,
            Key: join(id, 'out', name),
        }, (err, data) => {
            if(err) {
                reject(err);
                return;
            }
            resolve(data.Body!.toString());
        });
    });
};
