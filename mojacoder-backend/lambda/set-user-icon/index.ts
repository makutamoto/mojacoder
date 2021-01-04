import { AppSyncResolverHandler, AppSyncIdentityCognito } from 'aws-lambda'
import { S3, DynamoDB } from 'aws-sdk'
import Jimp from 'jimp'

const USER_ICON_BUCKET_NAME = process.env.USER_ICON_BUCKET_NAME as string;
if(USER_ICON_BUCKET_NAME === undefined) throw "USER_ICON_BUCKET_NAME is not defined.";
const USER_TABLE_NAME = process.env.USER_TABLE_NAME as string;
if(USER_TABLE_NAME === undefined) throw "USER_TABLE_NAME is not defined.";

const s3 = new S3({apiVersion: '2006-03-01'});
const dynamodb = new DynamoDB({apiVersion: '2012-08-10'});

async function setUserIconAttribute(userID: string, value: boolean) {
    const user = await dynamodb.query({
        TableName: USER_TABLE_NAME,
        IndexName: 'idIndex',
        ExpressionAttributeNames: {
            '#id': 'id',
        },
        ExpressionAttributeValues: {
            ':id': {
                S: userID,
            },
        },
        KeyConditionExpression: '#id = :id',
    }).promise()
    await dynamodb.updateItem({
        TableName: USER_TABLE_NAME,
        Key: {
            username: {
                S: user.Items?.[0].username.S,
            },
        },
        ExpressionAttributeNames: {
            '#icon': 'icon',
        },
        ExpressionAttributeValues: {
            ':icon': {
                BOOL: value,
            },
        },
        UpdateExpression: 'SET #icon = :icon',
    }).promise()
}

export const handler: AppSyncResolverHandler<{ input: { icon: string } }, string | null> = async (event) => {
    const userID = (event.identity as AppSyncIdentityCognito).sub
    const key = userID + '.png'
    const { input } = event.arguments
    if(input) {
        const buffer = Buffer.from(input.icon, 'base64')
        if(buffer.length > 1048576) throw "The size of the image exceeds the limit."
        const image = await Jimp.read(buffer)
        if(image.getMIME() !== Jimp.MIME_PNG) throw "The image must be PNG encoded." 
        if(image.getWidth() !== image.getHeight()) throw "The image must be square."
        if(image.getWidth() > 512) throw "The dimension of the image exceeds the limit."
        await s3.putObject({
            Bucket: USER_ICON_BUCKET_NAME,
            Key: key,
            ContentType: Jimp.MIME_PNG,
            Body: buffer,
        }).promise()
        setUserIconAttribute(userID, true)
        return key
    }
    await s3.deleteObject({
        Bucket: USER_ICON_BUCKET_NAME,
        Key: key,
    }).promise()
    setUserIconAttribute(userID, false)
    return null
};
