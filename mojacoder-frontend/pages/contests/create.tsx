import React from 'react'
import { Alert } from 'react-bootstrap'

import Auth from '../../lib/auth'
import Layout from '../../components/Layout'
import Top from '../../components/Top'
import ContestEditor from '../../containers/ContestEditor'
import Title from '../../components/Title'

export const Post: React.FC = () => {
    const { auth } = Auth.useContainer()
    return (
        <>
            <Title>コンテストを作成</Title>
            <Top>
                <h1 className="text-center">コンテストを作成</h1>
            </Top>
            <Layout>
                <>
                    {auth ? (
                        <ContestEditor />
                    ) : (
                        <Alert variant="danger">
                            コンテストを作成するにはサインインが必要です。
                        </Alert>
                    )}
                </>
            </Layout>
        </>
    )
}

export default Post
