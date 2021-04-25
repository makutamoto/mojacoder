import React, { useCallback } from 'react'
import Link from 'next/link'
import { Auth as Cognito } from 'aws-amplify'
import { Button } from 'react-bootstrap'

import { useI18n } from '../lib/i18n'
import Auth from '../lib/auth'
import { UserDetail } from '../lib/backend_types'
import Layout from '../components/Layout'
import Top from '../components/Top'
import UserIcon from '../components/UserIcon'
import Title from '../components/Title'

interface Props {
    user: UserDetail
}

const UserPage: React.FC<Props> = ({ user, children }) => {
    const { t } = useI18n('user')
    const { auth, setAuth } = Auth.useContainer()
    const OnClickSignOutCallback = useCallback(() => {
        Cognito.signOut()
            .then(() => setAuth(null))
            .catch((err) => console.error(err))
    }, [])
    return (
        <>
            <Title>{`${user.screenName}さんのユーザーページ`}</Title>
            <Top>
                <div className="text-center">
                    <UserIcon size={256}>{user}</UserIcon>
                    <h2>{user.screenName}</h2>
                    {auth && auth.userID === user.userID && (
                        <>
                            <Button
                                variant="danger"
                                onClick={OnClickSignOutCallback}
                            >
                                {t`signOut`}
                            </Button>{' '}
                            <Link href="/settings" passHref>
                                <Button variant="secondary">
                                    {t`settings`}
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </Top>
            <Layout>{children}</Layout>
        </>
    )
}

export default UserPage
