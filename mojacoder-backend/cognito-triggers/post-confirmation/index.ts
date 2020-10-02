import { PostConfirmationTriggerHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});

const USERNAME_TO_ID_TABLE_NAME = process.env.USERNAME_TO_ID_TABLE_NAME;
if(USERNAME_TO_ID_TABLE_NAME === undefined) throw "USERNAME_TO_ID_TABLE_NAME is not defined.";
const USER_DATA_TABLE = process.env.USER_DATA_TABLE;
if(USER_DATA_TABLE === undefined) throw "USER_DATA_TABLE is not defined.";

export const handler: PostConfirmationTriggerHandler = (event) => {
    return new Promise((resolve, reject) => {
        const preferred_username = event.request.userAttributes.preferred_username;
        const sub = event.request.userAttributes.sub;
        dynamodb.transactWriteItems({
            TransactItems: [
                {
                    Put: {
                        TableName: USERNAME_TO_ID_TABLE_NAME,
                        Item: {
                            username: {
                                S: preferred_username,
                            },
                            id: {
                                S: sub,
                            }
                        },
                    },
                },
                {
                    Put: {
                        TableName: USER_DATA_TABLE,
                        Item: {
                            id: {
                                S: sub,
                            },
                            username: {
                                S: preferred_username,
                            },
                        },
                    },
                },
            ]
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
