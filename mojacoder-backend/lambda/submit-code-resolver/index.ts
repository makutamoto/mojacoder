import { AppSyncResolverHandler } from 'aws-lambda'

interface Arguments {
    problemID: string,
    lang: string,
    code: string,
}

interface Response extends Arguments {
    id: string,
}

export const handler: AppSyncResolverHandler<Arguments, Response> = async () => {
    return {
        id: "a",
        problemID: "testID",
        lang: "c",
        code: "#",
    };
};
