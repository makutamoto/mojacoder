import { useState } from 'react'
import { createContainer } from 'unstated-next'
import {
    CognitoIdToken,
    CognitoRefreshToken,
    CognitoAccessToken,
} from 'amazon-cognito-identity-js'

export interface AuthSession {
    idToken: CognitoIdToken
    refreshToken: CognitoRefreshToken
    accessToken: CognitoAccessToken
}

function useAuth(initialState: AuthSession | null = null) {
    const [auth, setAuth] = useState(initialState)
    return { auth, setAuth }
}
export default createContainer(useAuth)
