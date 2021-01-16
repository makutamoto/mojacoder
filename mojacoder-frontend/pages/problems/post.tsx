import React from 'react'
import { Alert } from 'react-bootstrap'

import Auth from '../../lib/auth'
import Layout from '../../components/Layout'
import Top from '../../components/Top'
import ProblemEditor from '../../containers/ProblemEditor'
import Title from '../../components/Title'

export const Post: React.FC = () => {
    const { auth } = Auth.useContainer()
    return (
        <>
            <Title>問題を投稿</Title>
            <Top>
                <h1 className="text-center">問題を投稿</h1>
                <div className="text-center">
                    <a
                        href="https://zenn.dev/makutamoto/books/how-to-post-to-mojacoder"
                        target="_blank"
                        rel="noreferrer"
                    >
                        問題投稿方法
                    </a>
                </div>
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
