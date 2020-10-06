import { useState } from 'react'
import { createContainer } from 'unstated-next'
import { CognitoUserSession } from 'amazon-cognito-identity-js'
import gql from 'graphql-tag'

import { invokeQueryWithApiKey } from './backend'

export interface AuthSession {
    userID: string
    username: string
}

function useAuth(initialState: AuthSession | null = null) {
    const [auth, setAuth] = useState(initialState)
    return { auth, setAuth }
}
export default createContainer(useAuth)

const GetUsernameFromUserID = gql`
    query GetUserIDFromUsername($userID: String!) {
        getUsernameFromUserID(userID: $userID)
    }
`
interface GetUsernameFromUserIDResponse {
    getUsernameFromUserID: string | null
}
export async function genAuthSession(
    session: CognitoUserSession
): Promise<AuthSession> {
    const userID = session.getIdToken().payload.sub
    const res = (await invokeQueryWithApiKey(GetUsernameFromUserID, {
        userID,
    })) as GetUsernameFromUserIDResponse
    return {
        userID,
        username: res.getUsernameFromUserID,
    }
}
