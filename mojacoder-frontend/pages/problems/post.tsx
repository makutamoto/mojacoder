import React from 'react'
import { Alert } from 'react-bootstrap'

import Auth from '../../lib/auth'
import Layout from '../../components/Layout'
import Top from '../../components/Top'
import ProblemEditor from '../../containers/ProblemEditor'

export const Post: React.FC = () => {
    const { auth } = Auth.useContainer()
    return (
        <>
            <Top>
                <h1 className="text-center">問題を投稿</h1>
            </Top>
            <Layout>
                <>
                    {auth ? (
                        <ProblemEditor />
                    ) : (
                        <Alert variant="danger">
                            問題を投稿するにはサインインが必要です。
                        </Alert>
                    )}
                </>
            </Layout>
        </>
    )
}

export default Post
