import React, { useCallback, useState } from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import gql from 'graphql-tag'
import ReactMarkdown from 'react-markdown'
import Tex from '@matejmazur/react-katex'
import math from 'remark-math'
import { Alert, Button, Jumbotron, Spinner } from 'react-bootstrap'
import { join } from 'path'
import {
    BeakerIcon,
    ClockIcon,
    HeartIcon,
    SmileyIcon,
} from '@primer/octicons-react'

import { useI18n } from '../../../../../lib/i18n'
import Auth from '../../../../../lib/auth'
import {
    invokeQueryWithApiKey,
    invokeMutation,
} from '../../../../../lib/backend'
import { UserDetail } from '../../../../../lib/backend_types'
import Sample from '../../../../../components/Sample'
import CodeEditor, { Code } from '../../../../../components/CodeEditor'
import ProblemTab from '../../../../../components/ProblemTab'
import IconWithText from '../../../../../components/IconWithText'
import Username from '../../../../../components/Username'

import 'katex/dist/katex.min.css'

const Status = {
    Normal: 'Normal',
    Submitting: 'Submitting',
} as const
type Status = typeof Status[keyof typeof Status]

const SubmitCode = gql`
    mutation SubmitCode($input: SubmitCodeInput!) {
        submitCode(input: $input) {
            id
        }
    }
`

interface Props {
    user: UserDetail
}

const ProblemPage: React.FC<Props> = (props) => {
    const { user } = props
    const { t } = useI18n('problem')
    const router = useRouter()
    const { auth } = Auth.useContainer()
    const [status, setStatus] = useState<Status>(Status.Normal)
    const [code, setCode] = useState<Code>({ lang: 'go-1.14', code: '' })
    const onSubmit = useCallback(() => {
        setStatus(Status.Submitting)
        invokeMutation(SubmitCode, {
            input: {
                lang: code.lang,
                code: code.code,
                problemID: user.problem.id,
            },
        }).then(() => {
            router.push(join(router.asPath, 'submissions'))
        })
    }, [setStatus, user, code])
    return (
        <>
            <ProblemTab activeKey={'problem'} />
            <Jumbotron className="text-center">
                <h1>{user.problem.title}</h1>
                <div>
                    <IconWithText icon={<ClockIcon />}>2 secs</IconWithText>{' '}
                    <IconWithText icon={<BeakerIcon />}>1024 MB</IconWithText>
                </div>
                <div>
                    <IconWithText icon={<SmileyIcon />}>
                        <Username>{user.problem.user.detail}</Username>
                    </IconWithText>
                </div>
                <div className="mt-2">
                    <IconWithText icon={<HeartIcon />}>0</IconWithText> Tweet
                </div>
                <div></div>
            </Jumbotron>
            <ReactMarkdown
                source={user.problem.statement}
                plugins={[math]}
                renderers={{
                    code: ({ language, value }) => (
                        <Sample title={language} value={value} />
                    ),
                    heading: (props) => {
                        const H = `h${Math.min(
                            6,
                            props.level + 1
                        )}` as React.ElementType
                        return (
                            <div>
                                <H>{props.children}</H>
                                <hr />
                            </div>
                        )
                    },
                    inlineMath: ({ value }) => <Tex math={value} />,
                    math: ({ value }) => <Tex block math={value} />,
                }}
            />
            <div>
                <h2>{t`submit`}</h2>
                <hr />
                {auth ? (
                    <>
                        <CodeEditor
                            id="problem-code-editor"
                            value={code}
                            onChange={setCode}
                        />
                        <Button
                            variant="primary"
                            disabled={status === Status.Submitting}
                            onClick={onSubmit}
                        >
                            {status === Status.Submitting && (
                                <Spinner
                                    className="mr-3"
                                    size="sm"
                                    animation="border"
                                />
                            )}
                            {t`submit`}
                        </Button>
                    </>
                ) : (
                    <Alert variant="danger">{t`signInRequired`}</Alert>
                )}
            </div>
        </>
    )
}
export default ProblemPage

const GetProblem = gql`
    query GetProblem($username: String!, $id: ID!) {
        user(username: $username) {
            problem(id: $id) {
                id
                title
                statement
                user {
                    detail {
                        screenName
                    }
                }
            }
        }
    }
`
interface GetProblemResponse {
    user: UserDetail | null
}
export const getServerSideProps: GetServerSideProps<Props> = async ({
    query,
}) => {
    const res = (await invokeQueryWithApiKey(GetProblem, {
        username: query.username,
        id: query.problemID,
    })) as GetProblemResponse
    return {
        props: {
            user: res.user,
        },
    }
}
