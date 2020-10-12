import { PreSignUpTriggerHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});

const TABLE_NAME = process.env.TABLE_NAME;
if(TABLE_NAME === undefined) throw "TABLE_NAME is not defined.";

export const handler: PreSignUpTriggerHandler = (event) => {
    return new Promise((resolve, reject) => {
        const preferred_username = event.request.userAttributes.preferred_username;
        dynamodb.putItem({
            TableName: TABLE_NAME,
            Item: {
                username: {
                    S: preferred_username.toUpperCase(),
                },
            },
            ConditionExpression: 'attribute_not_exists(#username)',
            ExpressionAttributeNames: {
                '#username': 'username',
            },
        }, (err) => {
            if(err) {
                console.error(err);
                reject("UsernameAlreadyExists");
                return;
            }
            resolve(event);
        });
    });
};
