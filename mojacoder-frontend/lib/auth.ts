import { useState } from 'react'
import { createContainer } from 'unstated-next'
import { CognitoUserSession } from 'amazon-cognito-identity-js'
import gql from 'graphql-tag'

import { invokeQueryWithApiKey } from './backend'

export interface AuthSession {
    userID: string
    screenName: string
}

function useAuth(initialState: AuthSession | null = null) {
    const [auth, setAuth] = useState(initialState)
    return { auth, setAuth }
}
export default createContainer(useAuth)

const GetScreenNameFromUserID = gql`
    query GetScreenNameFromUserID($userID: ID!) {
        user(userID: $userID) {
            screenName
        }
    }
`
interface GetUsernameFromUserIDResponse {
    user: { screenName: string } | null
}
export async function genAuthSession(
    session: CognitoUserSession
): Promise<AuthSession> {
    const userID = session.getIdToken().payload.sub
    const res = (await invokeQueryWithApiKey(GetScreenNameFromUserID, {
        userID,
    })) as GetUsernameFromUserIDResponse
    return {
        userID,
        screenName: res.user.screenName,
    }
}
