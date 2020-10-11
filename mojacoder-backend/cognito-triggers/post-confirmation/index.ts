import { PostConfirmationTriggerHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});

const USER_DATA_TABLE = process.env.USER_DATA_TABLE;
if(USER_DATA_TABLE === undefined) throw "USER_DATA_TABLE is not defined.";

export const handler: PostConfirmationTriggerHandler = (event) => {
    return new Promise((resolve, reject) => {
        const preferred_username = event.request.userAttributes.preferred_username;
        const sub = event.request.userAttributes.sub;
        dynamodb.putItem({
            TableName: USER_DATA_TABLE,
            Item: {
                username: {
                    S: preferred_username,
                },
                id: {
                    S: sub,
                },
            },
        }, (err) => {
            if(err) {
                console.error(err);
                reject("PostConfirmationTriggerError");
                return;
            }
            resolve(event);
        });
    });
};
