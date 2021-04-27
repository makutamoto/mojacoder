import React, { useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Auth as Cognito } from 'aws-amplify'
import { Button, Nav } from 'react-bootstrap'
import join from 'url-join'

import { useI18n } from '../lib/i18n'
import Auth from '../lib/auth'
import { UserDetail } from '../lib/backend_types'
import Layout from '../components/Layout'
import Top from '../components/Top'
import UserIcon from '../components/UserIcon'
import Title from '../components/Title'

interface Props {
    user: UserDetail
    activeKey: 'problems' | 'contests'
}

const UserPage: React.FC<Props> = ({ user, activeKey, children }) => {
    const { t } = useI18n('user')
    const { auth, setAuth } = Auth.useContainer()
    const { query } = useRouter()
    const { username } = query
    const basePath = join('/users', (username || '') as string)
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
            <Layout>
                <Nav variant="pills" activeKey={activeKey}>
                    <Nav.Item>
                        <Link passHref href={basePath}>
                            <Nav.Link eventKey="problems">{t`problems`}</Nav.Link>
                        </Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Link passHref href={join(basePath, 'contests')}>
                            <Nav.Link eventKey="contests">{t`contests`}</Nav.Link>
                        </Link>
                    </Nav.Item>
                </Nav>
                <hr />
                <div>{children}</div>
            </Layout>
        </>
    )
}

export default UserPage
