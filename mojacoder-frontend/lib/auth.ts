import { useState } from 'react'
import { createContainer } from 'unstated-next'

export interface AuthSession {
    userID: string
    username: string
}

function useAuth(initialState: AuthSession | null = null) {
    const [auth, setAuth] = useState(initialState)
    return { auth, setAuth }
}
export default createContainer(useAuth)
