import React, { useCallback, useState } from 'react'
import { Alert } from 'react-bootstrap'
import { useRouter } from 'next/router'
import join from 'url-join'
import gql from 'graphql-tag'

import { useI18n } from '../lib/i18n'
import Auth from '../lib/auth'
import { invokeMutation, invokeMutationWithApiKey } from '../lib/backend'
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
    const [lang, setLang] = useLocalStorage('code-lang', 'go-1.21')
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
        const args = {
            input: {
                lang,
                code,
                contestID,
                problemID,
            },
        }
        if (auth) {
            invokeMutation(SubmitCode, args).then(() => {
                router.push(join(router.asPath, redirect))
            })
        } else {
            invokeMutationWithApiKey(SubmitCode, args).then(
                ({ submitCode: { id } }) => {
                    router.push(join(router.asPath, join(redirect, id)))
                }
            )
        }
    }, [auth, lang, code, contestID, problemID])
    return (
        <>
            {!auth && <Alert variant="primary">登録なしで提出できます。</Alert>}
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
    )
}

export default SubmissionBox
