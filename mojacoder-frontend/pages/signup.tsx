import React, { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Auth as Cognito } from 'aws-amplify'
import { Alert, Form } from 'react-bootstrap'

import { useI18n } from '../lib/i18n'
import Title from '../components/Title'
import Layout from '../components/Layout'
import Top from '../components/Top'
import ButtonWithSpinner from '../components/ButtonWithSpinner'
import PasswordInput from '../components/PasswordInput'
import InputWithLabel from '../components/InputWithLabel'

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
    const [status, setStatus] = useState<Status>(Status.Normal)
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const onSubmit = useCallback(() => {
        if (!form.current.checkValidity()) {
            setStatus(Status.ValidationError)
            return
        }
        setStatus(Status.SigningUp)
        Cognito.signUp({
            username: email,
            password,
            attributes: {
                // eslint-disable-next-line camelcase
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
    }, [form, username, email, password])
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
                    <InputWithLabel
                        label={t`username`}
                        type="text"
                        required
                        placeholder="Makutamoto..."
                        value={username}
                        onChange={(e) => setUsername(e.currentTarget.value)}
                    />
                    <InputWithLabel
                        label={t`email`}
                        type="email"
                        required
                        placeholder="makutamoto@example.com..."
                        value={email}
                        onChange={(e) => setEmail(e.currentTarget.value)}
                    />
                    <PasswordInput
                        required
                        value={password}
                        onChange={(e) => setPassword(e.currentTarget.value)}
                    />
                    <ButtonWithSpinner
                        onClick={onSubmit}
                        loading={status === Status.SigningUp}
                    >
                        {t`signUp`}
                    </ButtonWithSpinner>
                </Form>
            </Layout>
        </>
    )
}

export default SignUp
