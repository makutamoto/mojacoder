import { PreSignUpTriggerHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});

const USERNAME_TABLE_NAME = process.env.USERNAME_TABLE_NAME;
if(USERNAME_TABLE_NAME === undefined) throw "USERNAME_TABLE_NAME is not defined.";

export const handler: PreSignUpTriggerHandler = async (event) => {
    const preferred_username = event.request.userAttributes.preferred_username;
    try {
        await dynamodb.putItem({
            TableName: USERNAME_TABLE_NAME,
            Item: {
                username: {
                    S: preferred_username.toUpperCase(),
                },
            },
            ConditionExpression: 'attribute_not_exists(#username)',
            ExpressionAttributeNames: {
                '#username': 'username',
            },
        }).promise()
    } catch(err) {
        console.error(err);
        throw "UsernameAlreadyExists";
    }
    return event;
};
