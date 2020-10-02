import React, { useCallback, useMemo, useState } from 'react'
import { Alert, Button, Spinner, Table } from 'react-bootstrap'
import gql from 'graphql-tag'

import Auth from '../lib/auth'
import { useSubscription, invokeMutation } from '../lib/backend'
import Title from '../components/Title'
import CodeEditor, { Code } from '../components/CodeEditor'
import Editor from '../components/Editor'

import Session from '../lib/session'

enum PlaygroundStatus {
    Normal,
    Waiting,
    Received,
}

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
    const [status, setStatus] = useState(PlaygroundStatus.Normal)
    const onRun = useCallback(() => {
        setStatus(PlaygroundStatus.Waiting)
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
                userID: auth === null ? '' : auth.accessToken.payload.username,
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
            setStatus(PlaygroundStatus.Received)
        }, [])
    )
    return (
        <>
            <Title>Playground</Title>
            <h1>Playground</h1>
            <hr />
            <Alert variant="primary">
                PlaygroundではMojaCoderのジャッジ上でコードの動作を確認することができます。
            </Alert>
            {auth ? (
                <>
                    <div className="mb-2">
                        <CodeEditor
                            id="playground-code-editor"
                            value={code}
                            onChange={setCode}
                        />
                        <h2>標準入力</h2>
                        <hr />
                        <Editor value={stdin} onChange={setStdin} />
                        <Button
                            variant="primary"
                            onClick={onRun}
                            disabled={status === PlaygroundStatus.Waiting}
                        >
                            実行
                        </Button>
                    </div>
                    {status === PlaygroundStatus.Waiting && (
                        <Alert className="my-4" variant="primary">
                            <Spinner
                                className="mr-3"
                                size="sm"
                                animation="border"
                            />
                            コードを実行中です。しばらくお待ち下さい。
                        </Alert>
                    )}
                    {status === PlaygroundStatus.Received && (
                        <Table className="my-4" bordered striped hover>
                            <tbody>
                                <tr>
                                    <td>終了コード</td>
                                    <td>{result.exitCode}</td>
                                </tr>
                                <tr>
                                    <td>実行時間</td>
                                    <td>{result.time} ms</td>
                                </tr>
                                <tr>
                                    <td>使用メモリ</td>
                                    <td>{result.memory} kb</td>
                                </tr>
                            </tbody>
                        </Table>
                    )}
                    <div>
                        <h2>標準出力</h2>
                        <hr />
                        <Editor value={result.stdout} readOnly />
                        <h2>標準エラー出力</h2>
                        <hr />
                        <Editor value={result.stderr} readOnly />
                    </div>
                </>
            ) : (
                <Alert variant="danger">
                    Playgroundを実行するにはサインインして下さい。
                </Alert>
            )}
        </>
    )
}

export default Playground
