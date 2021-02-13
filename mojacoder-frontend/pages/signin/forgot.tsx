import React, { useCallback, useState } from 'react'
import { Alert, Form } from 'react-bootstrap'
import { Auth as Cognito } from 'aws-amplify'

import { useI18n } from '../../lib/i18n'
import Title from '../../components/Title'
import Layout from '../../components/Layout'
import Top from '../../components/Top'
import ButtonWithSpinner from '../../components/ButtonWithSpinner'
import InputWithLabel from '../../components/InputWithLabel'
import PasswordInput from '../../components/PasswordInput'

const Status = {
    Normal: 'Normal',
    RequestValidationError: 'RequestValidationError',
    Requesting: 'Requesting',
    RequestSucceeded: 'RequestSucceeded',
    UserNotExist: 'UserNotExist',
    RequestError: 'RequestError',
    ResetValidationError: 'ResetValidationError',
    Resetting: 'Resetting',
    InvalidCode: 'InvalidCode',
    ResetError: 'ResetError',
    ResetAttemptLimitExceeded: 'ResetAttemptLimitExceeded',
    ResetSucceeded: 'ResetSucceeded',
} as const
type Status = typeof Status[keyof typeof Status]

const SignIn: React.FC = () => {
    const { t } = useI18n('forgot')
    const [status, setStatus] = useState<Status>(Status.Normal)
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [password, setPassword] = useState('')
    const onSendCode = useCallback(
        (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
            e.preventDefault()
            const form = e.currentTarget.parentElement
            if (!(form as any).checkValidity()) {
                setStatus(Status.RequestValidationError)
                return
            }
            setStatus(Status.Requesting)
            Cognito.forgotPassword(email)
                .then(() => {
                    setStatus(Status.RequestSucceeded)
                })
                .catch((err) => {
                    if (
                        err.code === 'UserNotFoundException' ||
                        err.code === 'UserNotConfirmedException'
                    ) {
                        setStatus(Status.UserNotExist)
                    } else {
                        console.error(err)
                        setStatus(Status.RequestError)
                    }
                })
        },
        [email]
    )
    const onReset = useCallback(
        (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
            e.preventDefault()
            const form = e.currentTarget.parentElement
            if (!(form as any).checkValidity()) {
                setStatus(Status.ResetValidationError)
                return
            }
            setStatus(Status.Resetting)
            Cognito.forgotPasswordSubmit(email, code, password)
                .then(() => {
                    setStatus(Status.ResetSucceeded)
                })
                .catch((err) => {
                    if (
                        err.code === 'UserNotFoundException' ||
                        err.code === 'CodeMismatchException' ||
                        err.code === 'ExpiredCodeException'
                    ) {
                        setStatus(Status.InvalidCode)
                    } else if (err.code === 'LimitExceededException') {
                        setStatus(Status.ResetAttemptLimitExceeded)
                    } else {
                        console.error(err)
                        setStatus(Status.ResetError)
                    }
                })
        },
        [email, code, password]
    )
    return (
        <>
            <Title>{t`title`}</Title>
            <Top>
                <h1 className="text-center">{t`title`}</h1>
            </Top>
            <Layout>
                <Alert
                    show={status === Status.RequestSucceeded}
                    variant="success"
                >
                    {t`codeSentToYourEmail`}
                </Alert>
                <Alert show={status === Status.UserNotExist} variant="danger">
                    {t`userNotExist`}
                </Alert>
                <Alert show={status === Status.RequestError} variant="danger">
                    {t`error`}
                </Alert>
                <Alert
                    show={status === Status.ResetSucceeded}
                    variant="success"
                >
                    {t`resetSucceeded`}
                </Alert>
                <Alert show={status === Status.InvalidCode} variant="danger">
                    {t`invalidCode`}
                </Alert>
                <Alert
                    show={status === Status.ResetAttemptLimitExceeded}
                    variant="danger"
                >
                    {t`resetAttemptLimitExceeded`}
                </Alert>
                <Alert show={status === Status.ResetError} variant="danger">
                    {t`error`}
                </Alert>
                <Form
                    noValidate
                    validated={status === Status.RequestValidationError}
                >
                    <InputWithLabel
                        label={t`email`}
                        type="email"
                        required
                        placeholder="makutamoto@example.com..."
                        value={email}
                        onChange={(e) => setEmail(e.currentTarget.value)}
                        invalidFeedback={t`enterEmail`}
                    />
                    <ButtonWithSpinner
                        type="submit"
                        onClick={onSendCode}
                        loading={status === Status.Requesting}
                    >
                        {t`sendCode`}
                    </ButtonWithSpinner>
                </Form>
                <Form
                    noValidate
                    validated={status === Status.ResetValidationError}
                >
                    <InputWithLabel
                        label={t`code`}
                        type="number"
                        required
                        placeholder="123456..."
                        value={code}
                        onChange={(e) => setCode(e.currentTarget.value)}
                        invalidFeedback={t`enterCode`}
                    />
                    <PasswordInput
                        required
                        value={password}
                        onChange={(e) => setPassword(e.currentTarget.value)}
                    />
                    <ButtonWithSpinner
                        type="submit"
                        onClick={onReset}
                        loading={status === Status.Resetting}
                    >
                        {t`reset`}
                    </ButtonWithSpinner>
                </Form>
            </Layout>
        </>
    )
}

export default SignIn
