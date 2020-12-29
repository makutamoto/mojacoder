import { useState } from 'react'
import { createContainer } from 'unstated-next'
import { CognitoUserSession } from 'amazon-cognito-identity-js'
import gql from 'graphql-tag'

import { invokeQueryWithApiKey } from './backend'
import { UserDetail } from './backend_types'

function useAuth(initialState: UserDetail | null = null) {
    const [auth, setAuth] = useState(initialState)
    return { auth, setAuth }
}
export default createContainer(useAuth)

const GetScreenNameFromUserID = gql`
    query GetScreenNameFromUserID($userID: ID!) {
        user(userID: $userID) {
            userID
            screenName
        }
    }
`
export async function genAuthSession(
    session: CognitoUserSession
): Promise<UserDetail> {
    const userID = session.getIdToken().payload.sub
    const res = await invokeQueryWithApiKey(GetScreenNameFromUserID, {
        userID,
    })
    return res.user
}
