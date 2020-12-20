import React, { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Auth as Cognito } from 'aws-amplify'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'

import { useI18n } from '../lib/i18n'
import Title from '../components/Title'
import Layout from '../components/Layout'
import Top from '../components/Top'

const Status = {
    Normal: 'Normal',
    ValidationError: 'ValidationError',
    SigningUp: 'SigningUp',
    UserAlreadyExists: 'UserAlreadyExists',
    Error: 'Error',
} as const
type Status = typeof Status[keyof typeof Status]

const SignUp: React.FC = () => {
    const { t } = useI18n('signUp')
    const router = useRouter()
    const form = useRef(null)
    const passwordInput = useRef(null)
    const [status, setStatus] = useState<Status>(Status.Normal)
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
            <Title>{t`title`}</Title>
            <Top>
                <h1 className="text-center">{t`title`}</h1>
            </Top>
            <Layout>
                <Alert
                    show={status === Status.UserAlreadyExists}
                    variant="danger"
                >
                    {t`userAlreadyExists`}
                </Alert>
                <Alert show={status === Status.Error} variant="danger">
                    {t`error`}
                </Alert>
                <Form
                    noValidate
                    validated={status === Status.ValidationError}
                    ref={form}
                >
                    <Form.Group>
                        <Form.Label>{t`username`}</Form.Label>
                        <Form.Control
                            type="text"
                            required
                            placeholder="Makutamoto..."
                            value={username}
                            onChange={(e) => setUsername(e.currentTarget.value)}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>{t`email`}</Form.Label>
                        <Form.Control
                            type="email"
                            required
                            placeholder="makutamoto@example.com..."
                            value={email}
                            onChange={(e) => setEmail(e.currentTarget.value)}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>{t`password`}</Form.Label>
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
                            {t`passwordConstraintsMessage`}
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                            {t`passwordConstraintsMessage`}
                        </Form.Control.Feedback>
                    </Form.Group>
                </Form>
                <Form.Group>
                    <Form.Label>{t`passwordConfirmation`}</Form.Label>
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
                        {t`passwordNotMatch`}
                    </Form.Control.Feedback>
                </Form.Group>
                <Button
                    onClick={onSubmit}
                    disabled={status === Status.SigningUp}
                >
                    {status === Status.SigningUp && (
                        <Spinner
                            className="mr-2"
                            animation="border"
                            size="sm"
                        />
                    )}
                    {t`signUp`}
                </Button>
            </Layout>
        </>
    )
}

export default SignUp
