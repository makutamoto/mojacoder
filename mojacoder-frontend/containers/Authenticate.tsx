import React, { useEffect } from 'react'
import { Auth as AmplifyAuth } from 'aws-amplify'

import Auth, { genAuthSession } from '../lib/auth'

const Authenticate: React.FC = () => {
    const { setAuth } = Auth.useContainer()
    useEffect(() => {
        AmplifyAuth.currentSession().then((session) => {
            genAuthSession(session).then((authSession) => {
                setAuth(authSession)
            })
        })
    }, [setAuth])
    return null
}
export default Authenticate
