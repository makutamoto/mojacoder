import React, { useCallback, useMemo, useState } from 'react'
import { Alert, Button, Spinner, Table } from 'react-bootstrap'
import gql from 'graphql-tag'

import { useI18n } from '../lib/i18n'
import Auth from '../lib/auth'
import { useSubscription, invokeMutation } from '../lib/backend'
import Title from '../components/Title'
import CodeEditor, { Code } from '../components/CodeEditor'
import Editor from '../components/Editor'
import Layout from '../components/Layout'
import Top from '../components/Top'

import Session from '../lib/session'

const Status = {
    Normal: 'Normal',
    Waiting: 'Waiting',
    Received: 'Received',
} as const
type Status = typeof Status[keyof typeof Status]

const SUBSCRIPTION_DOCUMENT = gql`
    subscription onResponsePlayground($sessionID: ID!, $userID: ID!) {
        onResponsePlayground(sessionID: $sessionID, userID: $userID) {
            exitCode
            time
            memory
            stderr
            stdout
        }
    }
`

const MUTATION_DOCUMENT = gql`
    mutation runPlayground($input: RunPlaygroundInput!) {
        runPlayground(input: $input) {
            sessionID
        }
    }
`

interface OnResponsePlayground {
    exitCode: number
    time: number
    memory: number
    stderr: string
    stdout: string
}

interface SubscriptionData {
    onResponsePlayground: OnResponsePlayground
}

const Playground: React.FC = () => {
    const { t } = useI18n('playground')
    const { auth } = Auth.useContainer()
    const { session } = Session.useContainer()
    const [code, setCode] = useState<Code>({ lang: 'go-1.14', code: '' })
    const [stdin, setStdin] = useState('')
    const [result, setResult] = useState<OnResponsePlayground>({
        exitCode: 0,
        time: 0,
        memory: 0,
        stdout: '',
        stderr: '',
    })
    const [status, setStatus] = useState<Status>(Status.Normal)
    const onRun = useCallback(() => {
        setStatus(Status.Waiting)
        invokeMutation(MUTATION_DOCUMENT, {
            input: {
                sessionID: session.id,
                lang: code.lang,
                code: code.code,
                stdin,
            },
        })
    }, [code, stdin, session.id, setStatus])
    useSubscription(
        SUBSCRIPTION_DOCUMENT,
        useMemo(
            () => ({
                sessionID: session.id,
                userID: auth === null ? '' : auth.userID,
            }),
            [session.id, auth]
        ),
        useCallback(({ onResponsePlayground }: SubscriptionData) => {
            setResult({
                exitCode: onResponsePlayground.exitCode,
                time: onResponsePlayground.time,
                memory: onResponsePlayground.memory,
                stdout: onResponsePlayground.stdout,
                stderr: onResponsePlayground.stderr,
            })
            setStatus(Status.Received)
        }, [])
    )
    return (
        <>
            <Title>{t`title`}</Title>
            <Top>
                <h1 className="text-center">{t`title`}</h1>
            </Top>
            <Layout>
                <Alert variant="primary">{t`description`}</Alert>
                {auth ? (
                    <>
                        <div className="mb-2">
                            <CodeEditor
                                id="playground-code-editor"
                                value={code}
                                onChange={setCode}
                            />
                            <h2>{t`stdin`}</h2>
                            <hr />
                            <Editor value={stdin} onChange={setStdin} />
                            <Button
                                variant="primary"
                                onClick={onRun}
                                disabled={status === Status.Waiting}
                            >
                                {t`run`}
                            </Button>
                        </div>
                        <Alert
                            show={status === Status.Waiting}
                            className="my-4"
                            variant="primary"
                        >
                            <Spinner
                                className="mr-3"
                                size="sm"
                                animation="border"
                            />
                            {t`runningCode`}
                        </Alert>
                        {status === Status.Received && (
                            <Table className="my-4" bordered striped hover>
                                <tbody>
                                    <tr>
                                        <td className="text-nowrap">{t`exitCode`}</td>
                                        <td className="text-nowrap">
                                            {result.exitCode}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-nowrap">{t`time`}</td>
                                        <td className="text-nowrap">
                                            {result.time} ms
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-nowrap">{t`memory`}</td>
                                        <td className="text-nowrap">
                                            {result.memory} kb
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                        )}
                        <div>
                            <h2>{t`stdout`}</h2>
                            <hr />
                            <Editor value={result.stdout} readOnly />
                            <h2>{t`stderr`}</h2>
                            <hr />
                            <Editor value={result.stderr} readOnly />
                        </div>
                    </>
                ) : (
                    <Alert variant="danger">{t`signInRequired`}</Alert>
                )}
            </Layout>
        </>
    )
}

export default Playground
