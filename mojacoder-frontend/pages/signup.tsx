import React, { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Auth as Cognito } from 'aws-amplify'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'

import Title from '../components/Title'

const PASSWORD_CONSTRAINTS_MESSAGE =
    'パスワードは半角英文字大文字小文字・数字・記号をそれぞれ一文字以上かつ８文字以上128文字以内である必要があります。'

enum Status {
    Normal,
    ValidationError,
    SigningUp,
    UserAlreadyExists,
    Error,
}

const SignUp: React.FC = () => {
    const router = useRouter()
    const form = useRef(null)
    const passwordInput = useRef(null)
    const [status, setStatus] = useState(Status.Normal)
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmedPassword, setConfirmedPassword] = useState('')
    const onSubmit = useCallback(() => {
        if (!form.current.checkValidity() || password !== confirmedPassword) {
            setStatus(Status.ValidationError)
            return
        }
        setStatus(Status.SigningUp)
        Cognito.signUp({
            username: email,
            password,
            attributes: {
                // eslint-disable-next-line @typescript-eslint/camelcase
                preferred_username: username,
            },
        })
            .then(() => {
                router.push(
                    `/signin?signedup=true${
                        router.query.redirect
                            ? `&redirect=${encodeURIComponent(
                                  router.query.redirect as string
                              )}`
                            : ''
                    }`
                )
            })
            .catch((err) => {
                if (
                    err.code === 'UsernameExistsException' ||
                    err.message ===
                        'PreSignUp failed with error UsernameAlreadyExists.'
                ) {
                    setStatus(Status.UserAlreadyExists)
                } else {
                    console.error(err)
                    setStatus(Status.Error)
                }
            })
    }, [form, username, email, password, confirmedPassword])
    return (
        <>
            <Title>新規登録</Title>
            <h1>新規登録</h1>
            <hr />
            {status === Status.UserAlreadyExists && (
                <Alert variant="danger">ユーザーがすでに存在します。</Alert>
            )}
            {status === Status.Error && (
                <Alert variant="danger">エラーが発生しました。</Alert>
            )}
            <Form
                noValidate
                validated={status === Status.ValidationError}
                ref={form}
            >
                <Form.Group>
                    <Form.Label>ユーザー名</Form.Label>
                    <Form.Control
                        type="text"
                        required
                        placeholder="Makutamoto..."
                        value={username}
                        onChange={(e) => setUsername(e.currentTarget.value)}
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>メールアドレス</Form.Label>
                    <Form.Control
                        type="email"
                        required
                        placeholder="makutamoto@example.com..."
                        value={email}
                        onChange={(e) => setEmail(e.currentTarget.value)}
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>パスワード</Form.Label>
                    <Form.Control
                        ref={passwordInput}
                        type="password"
                        required
                        placeholder="password..."
                        pattern="^(?=.*?[!-\/:-@\[-`{-~])(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])[!-~]{8,128}$"
                        value={password}
                        onChange={(e) => setPassword(e.currentTarget.value)}
                    />
                    <Form.Text className="text-muted">
                        {PASSWORD_CONSTRAINTS_MESSAGE}
                    </Form.Text>
                    <Form.Control.Feedback type="invalid">
                        {PASSWORD_CONSTRAINTS_MESSAGE}
                    </Form.Control.Feedback>
                </Form.Group>
            </Form>
            <Form.Group>
                <Form.Label>パスワードの確認</Form.Label>
                <Form.Control
                    type="password"
                    required
                    placeholder="password..."
                    isValid={
                        status === Status.ValidationError &&
                        confirmedPassword === password
                    }
                    isInvalid={
                        status === Status.ValidationError &&
                        confirmedPassword !== password
                    }
                    value={confirmedPassword}
                    onChange={(e) =>
                        setConfirmedPassword(e.currentTarget.value)
                    }
                />
                <Form.Control.Feedback type="invalid">
                    パスワードが一致しません。
                </Form.Control.Feedback>
            </Form.Group>
            <Button onClick={onSubmit} disabled={status === Status.SigningUp}>
                {status === Status.SigningUp && (
                    <Spinner className="mr-2" animation="border" size="sm" />
                )}
                登録
            </Button>
        </>
    )
}

export default SignUp
