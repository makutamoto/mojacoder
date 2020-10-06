import React, { useCallback, useEffect, useState } from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { Auth as Cognito } from 'aws-amplify'
import { Alert, Button, Image, Jumbotron } from 'react-bootstrap'
import gql from 'graphql-tag'

import Auth from '../../lib/auth'
import { invokeQueryWithApiKey } from '../../lib/backend'

interface Props {
    userID: string | null
}

const UserPage: React.FC<Props> = (props) => {
    const router = useRouter()
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
            {props.userID === null ? (
                <Alert variant="danger">ユーザーが存在しません。</Alert>
            ) : (
                <Jumbotron>
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
                        <h2>{router.query.username}</h2>
                        {auth && auth.userID === props.userID && (
                            <Button
                                variant="danger"
                                onClick={OnClickSignOutCallback}
                            >
                                サインアウト
                            </Button>
                        )}
                    </div>
                </Jumbotron>
            )}
        </>
    )
}

export default UserPage

const GetUserIDFromUsername = gql`
    query GetUserIDFromUsername($username: String!) {
        getUserIDFromUsername(username: $username)
    }
`
interface GetUserIDFromUsernameResponse {
    getUserIDFromUsername: string | null
}
export const getServerSideProps: GetServerSideProps<Props> = async ({
    query,
}) => {
    const res = (await invokeQueryWithApiKey(GetUserIDFromUsername, {
        username: query.username,
    })) as GetUserIDFromUsernameResponse
    return {
        props: {
            userID: res.getUserIDFromUsername,
        },
    }
}
