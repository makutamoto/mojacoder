import { ScheduledHandler } from 'aws-lambda'
import { AppSync } from 'aws-sdk'

const APPSYNC_API_ID = process.env.APPSYNC_API_ID as string;
if(APPSYNC_API_ID === undefined) throw "APPSYNC_API_ID is not defined.";
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY as string;
if(APPSYNC_API_KEY === undefined) throw "APPSYNC_API_KEY is not defined.";

const appsync = new AppSync({apiVersion: '2017-07-25'});

export const handler: ScheduledHandler = () => {
    return new Promise((resolve, reject) => {
        const now = Date.now() / 1000
        appsync.updateApiKey({
            apiId: APPSYNC_API_ID,
            id: APPSYNC_API_KEY,
            expires: now + 7 * 24 * 3600,
        }, (err) => {
            if(err) {
                reject(err)
                return;
            }
            resolve()
        })
    });
};
