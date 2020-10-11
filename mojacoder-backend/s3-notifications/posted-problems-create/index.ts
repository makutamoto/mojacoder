import { S3Handler } from 'aws-lambda'
import { S3 } from 'aws-sdk'
import { loadAsync } from 'jszip'

const s3 = new S3({apiVersion: '2006-03-01'});

function deployProblem(bucket: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
        s3.getObject({
            Bucket: bucket,
            Key: key,
            
        }, (err, data) => {
            if(err) reject(err);
            loadAsync(data.Body).then((zip) => {
                console.log(zip.files);
                resolve();
            });
        });
    });
}

export const handler: S3Handler = async (event) => {
    for(let record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = record.s3.object.key;
        try {
            await deployProblem(bucket, key);
        } catch(err) {
            console.error(err);
        }
    }
};
