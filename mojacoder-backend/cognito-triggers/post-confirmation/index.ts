import { PostConfirmationTriggerHandler } from 'aws-lambda';
// import { StringMap } from 'aws-lambda/trigger/cognito-user-pool-trigger/_common';
// import { DynamoDB } from 'aws-sdk';

// const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});

// const TABLE_NAME = process.env.TABLE_NAME;
// if(TABLE_NAME === undefined) throw "TABLE_NAME is not defined.";

export const handler: PostConfirmationTriggerHandler = (event) => {
    return new Promise((resolve, reject) => {
        console.log(event);
        resolve(event);
        // const username = (event.request.clientMetadata as StringMap).username;
        // dynamodb.putItem({
        //     TableName: TABLE_NAME,
        //     Item: {
        //         username: {
        //             S: username,
        //         },
        //     },
        //     ConditionExpression: 'attribute_not_exists(#username)',
        //     ExpressionAttributeNames: {
        //         '#username': 'username',
        //     },
        // }, (err) => {
        //     if(err) {
        //         console.error(err);
        //         reject("UsernameAlreadyExists");
        //         return;
        //     }
        //     resolve(event);
        // });
    });
};
