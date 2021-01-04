import { AppSyncResolverHandler, AppSyncIdentityCognito } from 'aws-lambda'
import { S3 } from 'aws-sdk'
import Jimp from 'jimp'

const USER_ICON_BUCKET_NAME = process.env.USER_ICON_BUCKET_NAME as string;
if(USER_ICON_BUCKET_NAME === undefined) throw "USER_ICON_BUCKET_NAME is not defined.";

const s3 = new S3({apiVersion: '2006-03-01'});

export const handler: AppSyncResolverHandler<{ input: { icon: string } }, { width: number } | null> = async (event) => {
    const userID = (event.identity as AppSyncIdentityCognito).sub
    const { input } = event.arguments
    if(input) {
        const buffer = Buffer.from(input.icon, 'base64')
        if(buffer.length > 1048576) throw "The size of the image exceeds the limit."
        const image = await Jimp.read(buffer)
        const width = Math.max(image.getWidth(), image.getHeight())
        if(width > 512) {
            throw "The dimension of the image exceeds the limit."
        }
        const data = await image.resize(width, width).getBufferAsync(Jimp.MIME_PNG)
        await s3.putObject({
            Bucket: USER_ICON_BUCKET_NAME,
            Key: userID + '.png',
            Body: data,
        }).promise()
        return {
            width,
        }
    }
    await s3.deleteObject({
        Bucket: USER_ICON_BUCKET_NAME,
        Key: userID + '.png',
    }).promise()
    return null
};
