import React, { useCallback, useEffect, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import { Auth as Cognito } from 'aws-amplify'
import { Alert, Button, Image, Table } from 'react-bootstrap'
import gql from 'graphql-tag'

import { useI18n } from '../../../lib/i18n'
import Auth from '../../../lib/auth'
import { invokeQueryWithApiKey } from '../../../lib/backend'
import { UserDetail } from '../../../lib/backend_types'
import Layout from '../../../components/Layout'
import Top from '../../../components/Top'

interface Props {
    user: UserDetail
}

const UserPage: React.FC<Props> = (props) => {
    const { t } = useI18n('user')
    const { auth, setAuth } = Auth.useContainer()
    const [browser, setBroser] = useState(false)
    const [iconNotFound, setIconNotFound] = useState(false)
    const OnClickSignOutCallback = useCallback(() => {
        Cognito.signOut()
            .then(() => setAuth(null))
            .catch((err) => console.error(err))
    }, [])
    useEffect(() => setBroser(true), [])
    return (
        <>
            {props.user === null ? (
                <Alert variant="danger">{t`userNotFound`}</Alert>
            ) : (
                <>
                    <Top>
                        <div className="text-center">
                            {browser && (
                                <Image
                                    roundedCircle
                                    height={256}
                                    src={
                                        iconNotFound
                                            ? '/images/avatar.png'
                                            : '/images/avatar.png'
                                    }
                                    onError={() =>
                                        iconNotFound || setIconNotFound(true)
                                    }
                                />
                            )}
                            <h2>{props.user.screenName}</h2>
                            {auth && auth.userID === props.user.userID && (
                                <Button
                                    variant="danger"
                                    onClick={OnClickSignOutCallback}
                                >
                                    {t`signOut`}
                                </Button>
                            )}
                        </div>
                    </Top>
                    <Layout>
                        <h2>{t`problem`}</h2>
                        <hr />
                        <Table bordered striped hover>
                            <thead>
                                <tr>
                                    <th>{t`problemName`}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {props.user.problems.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <Link
                                                href={`/users/${props.user.screenName}/problems/${item.id}`}
                                            >
                                                <a>{item.title}</a>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Layout>
                </>
            )}
        </>
    )
}

export default UserPage

const GetUser = gql`
    query GetUser($username: String!) {
        user(username: $username) {
            userID
            screenName
            problems {
                items {
                    id
                    title
                }
            }
        }
    }
`
interface GetUserResponse {
    user: UserDetail | null
}
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const res = (await invokeQueryWithApiKey(GetUser, {
        username: params.username || '',
    })) as GetUserResponse
    return {
        props: {
            user: res.user,
        },
    }
}

export const getStaticPaths: GetStaticPaths = async () => ({
    paths: [],
    fallback: true,
})
