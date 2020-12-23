import { AppSyncResolverHandler } from 'aws-lambda'
import { S3 } from 'aws-sdk'
import { join } from 'path'

const TESTCASES_FOR_VIEW_BUCKET_NAME = process.env.TESTCASES_FOR_VIEW_BUCKET_NAME as string;
if(TESTCASES_FOR_VIEW_BUCKET_NAME === undefined) throw "TESTCASES_FOR_VIEW_BUCKET_NAME is not defined.";

const s3 = new S3({apiVersion: '2006-03-01'});

interface Arguments {
    name: string
}

export const handler: AppSyncResolverHandler<Arguments, string | null> = (event) => {
    return new Promise((resolve, reject) => {
        const id = event.source!.id as string
        const testcaseNames = event.source!.testcaseNames as string[]
        const name = event.arguments.name
        if(testcaseNames.indexOf(name) === -1) {
            resolve(null)
        }
        s3.getObject({
            Bucket: TESTCASES_FOR_VIEW_BUCKET_NAME,
            Key: join(id, 'in', name),
        }, (err, data) => {
            if(err) {
                reject(err);
                return;
            }
            resolve(data.Body!.toString());
        });
    });
};
