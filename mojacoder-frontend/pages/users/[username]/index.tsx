import React, { useCallback } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import Head from 'next/head'
import { Auth as Cognito } from 'aws-amplify'
import { Button, Table } from 'react-bootstrap'
import gql from 'graphql-tag'

import { useI18n } from '../../../lib/i18n'
import Auth from '../../../lib/auth'
import { invokeQueryWithApiKey } from '../../../lib/backend'
import { UserDetail } from '../../../lib/backend_types'
import Layout from '../../../components/Layout'
import Top from '../../../components/Top'
import UserIcon from '../../../components/UserIcon'

interface Props {
    user?: UserDetail
}

const UserPage: React.FC<Props> = (props) => {
    const { t } = useI18n('user')
    const { user } = props
    const { auth, setAuth } = Auth.useContainer()
    const OnClickSignOutCallback = useCallback(() => {
        Cognito.signOut()
            .then(() => setAuth(null))
            .catch((err) => console.error(err))
    }, [])
    return (
        <>
            <Head>
                {user && (
                    <>
                        <meta property="twitter:card" content="summary" />
                        <meta
                            property="og:title"
                            content={`${user.screenName} | MojaCoder`}
                        />
                    </>
                )}
            </Head>
            <Top>
                <div className="text-center">
                    <UserIcon size={256}>{user}</UserIcon>
                    <h2>{user?.screenName}</h2>
                    {auth && auth.userID === user?.userID && (
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
                <h2>{t`problem`}</h2>
                <hr />
                <Table responsive bordered striped hover>
                    <thead>
                        <tr>
                            <th className="text-nowrap">{t`problemName`}</th>
                            <th className="text-nowrap">いいね数</th>
                        </tr>
                    </thead>
                    <tbody>
                        {user?.problems.items.map((item) => (
                            <tr key={item.slug}>
                                <td className="text-nowrap">
                                    <Link
                                        href={`/users/${user?.screenName}/problems/${item.slug}`}
                                    >
                                        <a>{item.title}</a>
                                    </Link>
                                </td>
                                <td className="text-nowrap">
                                    {item.likeCount}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Layout>
        </>
    )
}

export default UserPage

const GetUser = gql`
    query GetUser($username: String!) {
        user(username: $username) {
            userID
            screenName
            icon
            problems {
                items {
                    slug
                    title
                    likeCount
                }
            }
        }
    }
`
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const res = await invokeQueryWithApiKey(GetUser, {
        username: params.username || '',
    })
    if (res.user === null) {
        return {
            notFound: true,
        }
    }
    return {
        props: {
            user: res.user,
        },
        revalidate: 1,
    }
}

export const getStaticPaths: GetStaticPaths = async () => ({
    paths: [],
    fallback: true,
})
