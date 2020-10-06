import React, { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { Auth as Cognito } from 'aws-amplify'

import Auth, { genAuthSession } from '../lib/auth'
import Title from '../components/Title'

enum Status {
    Normal,
    ValidationError,
    SigningIn,
    Success,
    InvalidEmailOrPassword,
    Error,
}

const SignIn: React.FC = () => {
    const { setAuth } = Auth.useContainer()
    const router = useRouter()
    const [status, setStatus] = useState(Status.Normal)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const onSubmit = useCallback(
        (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
            e.preventDefault()
            const form = e.currentTarget.parentElement
            if (!(form as any).checkValidity()) {
                setStatus(Status.ValidationError)
                return
            }
            setStatus(Status.SigningIn)
            Cognito.signIn(email, password)
                .then(() => {
                    Cognito.currentSession().then((session) => {
                        genAuthSession(session).then((authSession) => {
                            setStatus(Status.Success)
                            setAuth(authSession)
                            const redirect = decodeURIComponent(
                                (router.query.redirect as string) ?? '/'
                            )
                            router.push(redirect)
                        })
                    })
                })
                .catch((err) => {
                    if (
                        err.code === 'NotAuthorizedException' ||
                        err.code === 'UserNotFoundException' ||
                        err.code === 'UserNotConfirmedException'
                    ) {
                        setStatus(Status.InvalidEmailOrPassword)
                    } else {
                        console.error(err)
                        setStatus(Status.Error)
                    }
                })
        },
        [router, email, password]
    )
    return (
        <>
            <Title>サインイン</Title>
            <h1>サインイン</h1>
            <hr />
            <Alert show={!!router.query.signedup} variant="success">
                確認メールを送信しました。メール内のリンクにアクセスすることで登録が完了します。
            </Alert>
            <Alert show={status === Status.Success} variant="success">
                サインインが完了しました。
            </Alert>
            <Alert show={status === Status.Error} variant="danger">
                エラーが発生しました。
            </Alert>
            <Alert
                show={status === Status.InvalidEmailOrPassword}
                variant="danger"
            >
                無効なユーザー名もしくはパスワードです。
            </Alert>
            <Alert variant="primary">
                まだユーザー登録を行っていない方は
                <Link href="/signup">
                    <a>こちら</a>
                </Link>
                から登録して下さい。
            </Alert>
            <Form noValidate validated={status === Status.ValidationError}>
                <Form.Group>
                    <Form.Label>メールアドレス</Form.Label>
                    <Form.Control
                        type="email"
                        required
                        placeholder="makutamoto@example.com..."
                        value={email}
                        onChange={(e) => setEmail(e.currentTarget.value)}
                    />
                    <Form.Control.Feedback type="invalid">
                        メールアドレスを入力して下さい。
                    </Form.Control.Feedback>
                </Form.Group>
                <Form.Group>
                    <Form.Label>パスワード</Form.Label>
                    <Form.Control
                        type="password"
                        required
                        placeholder="password..."
                        value={password}
                        onChange={(e) => setPassword(e.currentTarget.value)}
                    />
                    <Form.Control.Feedback type="invalid">
                        パスワードを入力して下さい。
                    </Form.Control.Feedback>
                </Form.Group>
                <Button
                    type="submit"
                    onClick={onSubmit}
                    disabled={status === Status.SigningIn}
                >
                    {status === Status.SigningIn && (
                        <Spinner
                            className="mr-2"
                            animation="border"
                            size="sm"
                        />
                    )}
                    サインイン
                </Button>
            </Form>
        </>
    )
}

export default SignIn
