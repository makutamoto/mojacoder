import { AppSyncResolverHandler } from 'aws-lambda'

interface Arguments {
    problemID: string,
    lang: string,
    code: string,
}

interface Response extends Arguments {
    id: string,
}

export const handler: AppSyncResolverHandler<Arguments, Response> = async (event) => {
    return {
        id: JSON.stringify(event),
        problemID: "testID",
        lang: "c",
        code: "#",
    };
};
