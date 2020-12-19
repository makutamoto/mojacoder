import React, { useCallback, useState } from 'react'
import { useRouter } from 'next/router'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { Auth as Cognito } from 'aws-amplify'

import { useI18n } from '../lib/i18n'
import Auth, { genAuthSession } from '../lib/auth'
import Title from '../components/Title'
import Layout from '../components/Layout'
import Top from '../components/Top'

const Status = {
    Normal: 'Normal',
    ValidationError: 'ValidationError',
    SigningIn: 'SigningIn',
    Success: 'Success',
    InvalidEmailOrPassword: 'InvalidEmailOrPassword',
    Error: 'Error',
} as const
type Status = typeof Status[keyof typeof Status]

const SignIn: React.FC = () => {
    const { t } = useI18n('signIn')
    const { setAuth } = Auth.useContainer()
    const router = useRouter()
    const [status, setStatus] = useState<Status>(Status.Normal)
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
            <Title>{t`title`}</Title>
            <Top>
                <h1 className="text-center">{t`title`}</h1>
            </Top>
            <Layout>
                <Alert show={!!router.query.signedup} variant="success">
                    {t`confirmationMailSent`}
                </Alert>
                <Alert show={status === Status.Success} variant="success">
                    {t`signedIn`}
                </Alert>
                <Alert show={status === Status.Error} variant="danger">
                    {t`error`}
                </Alert>
                <Alert
                    show={status === Status.InvalidEmailOrPassword}
                    variant="danger"
                >
                    {t`invalidUsernameOrPassword`}
                </Alert>
                <Form noValidate validated={status === Status.ValidationError}>
                    <Form.Group>
                        <Form.Label>{t`email`}</Form.Label>
                        <Form.Control
                            type="email"
                            required
                            placeholder="makutamoto@example.com..."
                            value={email}
                            onChange={(e) => setEmail(e.currentTarget.value)}
                        />
                        <Form.Control.Feedback type="invalid">
                            {t`enterEmail`}
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>{t`password`}</Form.Label>
                        <Form.Control
                            type="password"
                            required
                            placeholder="password..."
                            value={password}
                            onChange={(e) => setPassword(e.currentTarget.value)}
                        />
                        <Form.Control.Feedback type="invalid">
                            {t`enterPassword`}
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
                        {t`signIn`}
                    </Button>
                </Form>
            </Layout>
        </>
    )
}

export default SignIn
