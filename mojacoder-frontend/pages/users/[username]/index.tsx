import React, { useCallback, useEffect, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import { Auth as Cognito } from 'aws-amplify'
import { Button, Spinner, Table } from 'react-bootstrap'
import gql from 'graphql-tag'

import { useI18n } from '../../../lib/i18n'
import Auth from '../../../lib/auth'
import { invokeQuery, invokeQueryWithApiKey } from '../../../lib/backend'
import {
    UserDetail,
    ProblemStatus,
    Problem,
    Query,
} from '../../../lib/backend_types'
import Layout from '../../../components/Layout'
import Top from '../../../components/Top'
import UserIcon from '../../../components/UserIcon'
import Heading from '../../../components/Heading'
import Title from '../../../components/Title'

const GetUserProblems = gql`
    query GetUserProblems($userID: ID!) {
        user(userID: $userID) {
            problems {
                items {
                    slug
                    title
                    status
                    likeCount
                }
            }
        }
    }
`

interface Props {
    user: UserDetail
}

const UserPage: React.FC<Props> = ({ user }) => {
    const { t } = useI18n('user')
    const { auth, setAuth } = Auth.useContainer()
    const [problems, setProblems] = useState<Problem[]>(null)
    const OnClickSignOutCallback = useCallback(() => {
        Cognito.signOut()
            .then(() => setAuth(null))
            .catch((err) => console.error(err))
    }, [])
    useEffect(() => {
        const loadProblems = async () => {
            const variables = {
                userID: user.userID,
            }
            let res: Query
            if (auth) {
                res = await invokeQuery(GetUserProblems, variables)
            } else {
                res = await invokeQueryWithApiKey(GetUserProblems, variables)
            }
            setProblems(res.user.problems.items)
        }
        loadProblems()
    }, [auth, user])
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
                <Heading>{t`problem`}</Heading>
                {problems ? (
                    <Table responsive bordered striped hover>
                        <thead>
                            <tr>
                                <th className="text-nowrap">{t`problemName`}</th>
                                <th className="text-nowrap">いいね数</th>
                                {auth && auth.userID === user.userID && (
                                    <th className="text-nowrap">全体公開</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {problems.map((item) => (
                                <tr key={item.slug}>
                                    <td className="text-nowrap">
                                        <Link
                                            href={`/users/${user.screenName}/problems/${item.slug}`}
                                        >
                                            <a>{item.title}</a>
                                        </Link>
                                    </td>
                                    <td className="text-nowrap">
                                        {item.likeCount}
                                    </td>
                                    {auth && auth.userID === user.userID && (
                                        <td className="text-nowrap">
                                            {item.status ===
                                            ProblemStatus.CREATED
                                                ? 'Yes'
                                                : 'No'}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <Spinner animation="border" />
                )}
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
        }
    }
`
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const res = await invokeQueryWithApiKey(GetUser, {
        username: params.username,
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
    fallback: 'blocking',
})
