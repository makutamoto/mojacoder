import { GraphQLClient, gql } from 'graphql-request';

const APPSYNC_ENDPOINT = process.env['APPSYNC_ENDPOINT'];
const APPSYNC_API_KEY = process.env['APPSYNC_API_KEY'];

const client = new GraphQLClient(APPSYNC_ENDPOINT, {
    headers: {
        ['x-api-key']: APPSYNC_API_KEY,
    },
});

export interface CodetestSubmission {
    submissionID: string,
    time: string,
    userID: string,
    lang: string,
}

export async function getCodetestSubmissions(): Promise<CodetestSubmission[]> {
    const query = gql`
    query {
        listSubmissions {
            items {
                submissionID
                time
                userID
                lang
            }
        }
    }
    `;
    const res = await client.request(query)
    return res.listSubmissions.items;
}

export async function submitCodetest(userID: string, lang: string, code: string, stdin: string): Promise<string> {
    const query = gql`
    mutation($submission: CreateSubmissionsInput!) {
        submitCodetest(input: $submission) {
            submissionID
        }
    }
    `;
    const res = await client.request(query, {
        submission: { userID, lang, code, stdin },
    });
    console.log(res);
    return res.submitCodetest.submissionID;
}
