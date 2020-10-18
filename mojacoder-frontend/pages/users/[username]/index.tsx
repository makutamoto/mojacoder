import React, { useCallback, useEffect, useState } from 'react'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { Auth as Cognito } from 'aws-amplify'
import { Alert, Button, Image, Jumbotron, Table } from 'react-bootstrap'
import gql from 'graphql-tag'

import Auth from '../../../lib/auth'
import { invokeQueryWithApiKey } from '../../../lib/backend'
import { User } from '../../../lib/backend_types'

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
                    <Table bordered striped hover>
                        <thead>
                            <tr>
                                <th>問題名</th>
                            </tr>
                        </thead>
                        <tbody>
                            {props.user.problems.items.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <Link
                                            href={`/users/${props.user.screenName}/problems/${item.id}`}
                                        >
                                            {item.title}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
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
    user: User | null
}
export const getServerSideProps: GetServerSideProps<Props> = async ({
    query,
}) => {
    const res = (await invokeQueryWithApiKey(GetUser, {
        username: query.username,
    })) as GetUserResponse
    return {
        props: {
            user: res.user,
        },
    }
}
