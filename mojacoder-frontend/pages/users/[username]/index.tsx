import React, { useCallback, useEffect, useState } from 'react'
import { GetServerSideProps } from 'next'
import { Auth as Cognito } from 'aws-amplify'
import { Alert, Button, Image, Jumbotron } from 'react-bootstrap'
import gql from 'graphql-tag'

import Auth from '../../../lib/auth'
import { invokeQueryWithApiKey } from '../../../lib/backend'

interface User {
    userID: string | null
    screenName: string | null
}

interface Props {
    user: User
}

const UserPage: React.FC<Props> = (props) => {
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
                <Alert variant="danger">ユーザーが存在しません。</Alert>
            ) : (
                <>
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
                            <h2>{props.user.screenName}</h2>
                            {auth && auth.userID === props.user.userID && (
                                <Button
                                    variant="danger"
                                    onClick={OnClickSignOutCallback}
                                >
                                    サインアウト
                                </Button>
                            )}
                        </div>
                    </Jumbotron>
                    <h2>問題</h2>
                    <hr />
                    <Button>投稿</Button>
                </>
            )}
        </>
    )
}

export default UserPage

const GetUserIDFromUsername = gql`
    query GetUserIDFromUsername($username: String!) {
        user(username: $username) {
            userID
            screenName
        }
    }
`
interface GetUserIDFromUsernameResponse {
    user: User | null
}
export const getServerSideProps: GetServerSideProps<Props> = async ({
    query,
}) => {
    const res = (await invokeQueryWithApiKey(GetUserIDFromUsername, {
        username: query.username,
    })) as GetUserIDFromUsernameResponse
    return {
        props: {
            user: res.user,
        },
    }
}
