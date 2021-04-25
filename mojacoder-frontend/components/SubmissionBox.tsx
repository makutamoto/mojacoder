import React, { useCallback, useState } from 'react'
import { Alert } from 'react-bootstrap'
import { useRouter } from 'next/router'
import join from 'url-join'
import gql from 'graphql-tag'

import { useI18n } from '../lib/i18n'
import Auth from '../lib/auth'
import { invokeMutation } from '../lib/backend'
import { useLocalStorage } from '../lib/localstorage'
import ButtonWithSpinner from './ButtonWithSpinner'
import CodeEditor, { Code } from './CodeEditor'

const Status = {
    Normal: 'Normal',
    Submitting: 'Submitting',
    EmptySubmission: 'EmptySubmission',
} as const
type Status = typeof Status[keyof typeof Status]

const SubmitCode = gql`
    mutation SubmitCode($input: SubmitCodeInput!) {
        submitCode(input: $input) {
            id
        }
    }
`

export interface SubmissionBoxProps {
    id: string
    contestID?: string
    problemID: string
    redirect: string
}

const SubmissionBox: React.FC<SubmissionBoxProps> = ({
    id,
    contestID,
    problemID,
    redirect,
}) => {
    const { t } = useI18n('problem')
    const { auth } = Auth.useContainer()
    const router = useRouter()
    const [status, setStatus] = useState<Status>(Status.Normal)
    const [lang, setLang] = useLocalStorage('code-lang', 'go-1.14')
    const [code, setCode] = useState('')
    const onCodeEditorChange = useCallback(
        (value: Code) => {
            setLang(value.lang)
            setCode(value.code)
        },
        [setLang]
    )
    const onSubmit = useCallback(() => {
        if (code.length === 0) {
            setStatus(Status.EmptySubmission)
            return
        }
        setStatus(Status.Submitting)
        invokeMutation(SubmitCode, {
            input: {
                lang,
                code,
                contestID,
                problemID,
            },
        }).then(() => {
            router.push(join(router.asPath, redirect))
        })
    }, [lang, code, contestID, problemID])
    return auth ? (
        <>
            {status === Status.EmptySubmission && (
                <Alert variant="danger">コードが空です。</Alert>
            )}
            <CodeEditor
                id={id}
                value={{ code, lang }}
                onChange={onCodeEditorChange}
            />
            <ButtonWithSpinner
                loading={status === Status.Submitting}
                onClick={onSubmit}
            >{t`submit`}</ButtonWithSpinner>
        </>
    ) : (
        <Alert variant="danger">{t`signInRequired`}</Alert>
    )
}

export default SubmissionBox
