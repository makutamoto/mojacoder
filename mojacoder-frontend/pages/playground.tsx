import React, { useCallback, useMemo, useState } from 'react'
import { Alert, Button } from 'react-bootstrap'
import gql from 'graphql-tag'

import { AccessTokenData } from '../lib/auth'
import { useSubscription, invokeMutation } from '../lib/backend'
import CodeEditor, { Code } from '../components/CodeEditor'
import Editor from '../components/Editor'

interface Props {
    accessTokenData: AccessTokenData | null
    login: boolean
}

const SUBSCRIPTION_DOCUMENT = gql`
    subscription onResponseCodetest($userID: ID!) {
        onResponseCodetest(userID: $userID) {
            exitCode
            time
            memory
            stderr
            stdout
        }
    }
`

const MUTATION_DOCUMENT = gql`
    mutation runCodetest($input: RunCodetestInput!) {
        runCodetest(input: $input) {
            id
        }
    }
`

interface OnResponseCodetest {
    exitCode: number
    time: number
    memory: number
    stderr: string
    stdout: string
}

interface SubscriptionData {
    onResponseCodetest: OnResponseCodetest
}

const Codetest: React.FC<Props> = (props) => {
    const [code, setCode] = useState<Code>({ lang: 'go-1.14', code: '' })
    const [stdin, setStdin] = useState('')
    const [result, setResult] = useState<OnResponseCodetest>({
        exitCode: 0,
        time: 0,
        memory: 0,
        stdout: '',
        stderr: '',
    })
    const onRun = useCallback(() => {
        invokeMutation(MUTATION_DOCUMENT, {
            input: {
                lang: code.lang,
                code: code.code,
                stdin,
            },
        })
    }, [code, stdin])
    useSubscription(
        SUBSCRIPTION_DOCUMENT,
        useMemo(
            () => ({
                userID:
                    props.accessTokenData === null
                        ? ''
                        : props.accessTokenData.username,
            }),
            [props.accessTokenData]
        ),
        useCallback(({ onResponseCodetest }: SubscriptionData) => {
            setResult({
                exitCode: onResponseCodetest.exitCode,
                time: onResponseCodetest.time,
                memory: onResponseCodetest.memory,
                stdout: onResponseCodetest.stdout,
                stderr: onResponseCodetest.stderr,
            })
        }, [])
    )
    return (
        <>
            <h1>Playground</h1>
            <hr />
            <Alert variant="primary">
                PlaygroundではMojaCoderのジャッジ上でコードの動作を確認することができます。
            </Alert>
            {props.login ? (
                <>
                    <CodeEditor
                        id="codetest-submission"
                        value={code}
                        onChange={setCode}
                    />
                    <h2>標準入力</h2>
                    <hr />
                    <Editor value={stdin} onChange={setStdin} />
                    <Button variant="primary" onClick={onRun}>
                        実行
                    </Button>
                    <h2>標準出力</h2>
                    <hr />
                    <Editor value={result.stdout} readOnly />
                    <h2>標準エラー出力</h2>
                    <hr />
                    <Editor value={result.stderr} readOnly />
                </>
            ) : (
                <Alert variant="danger">
                    Playgroundを実行するにはサインインして下さい。
                </Alert>
            )}
        </>
    )
}

export default Codetest
