import React, { useCallback, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import gql from 'graphql-tag'
import ReactMarkdown from 'react-markdown'
import Tex from '@matejmazur/react-katex'
import math from 'remark-math'
import { Alert } from 'react-bootstrap'
import join from 'url-join'

import { useI18n } from '../../../../../lib/i18n'
import Auth from '../../../../../lib/auth'
import {
    invokeQueryWithApiKey,
    invokeMutation,
} from '../../../../../lib/backend'
import { UserDetail } from '../../../../../lib/backend_types'
import Sample from '../../../../../components/Sample'
import CodeEditor, { Code } from '../../../../../components/CodeEditor'
import Layout from '../../../../../components/Layout'
import ButtonWithSpinner from '../../../../../components/ButtonWithSpinner'
import ProblemTop from '../../../../../containers/ProblemTop'

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

interface Props {
    user: UserDetail | null
}

const ProblemPage: React.FC<Props> = (props) => {
    const { user } = props
    const { t } = useI18n('problem')
    const router = useRouter()
    const { auth } = Auth.useContainer()
    const [status, setStatus] = useState<Status>(Status.Normal)
    const [code, setCode] = useState<Code>({ lang: 'go-1.14', code: '' })
    const onSubmit = useCallback(() => {
        if (code.code.length === 0) {
            setStatus(Status.EmptySubmission)
            return
        }
        setStatus(Status.Submitting)
        invokeMutation(SubmitCode, {
            input: {
                lang: code.lang,
                code: code.code,
                problemID: router.query.problemID || '',
            },
        }).then(() => {
            router.push(join(router.asPath, 'submissions'))
        })
    }, [setStatus, user, code])
    return (
        <>
            <Head>
                {user && (
                    <>
                        <meta property="twitter:card" content="summary" />
                        <meta
                            property="og:title"
                            content={`${user.problem.title} | MojaCoder`}
                        />
                    </>
                )}
            </Head>
            <ProblemTop activeKey="problem" problem={user?.problem} />
            <Layout>
                <ReactMarkdown
                    source={user?.problem.statement}
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
                            {status === Status.EmptySubmission && (
                                <Alert variant="danger">コードが空です。</Alert>
                            )}
                            <CodeEditor
                                id="problem-code-editor"
                                value={code}
                                onChange={setCode}
                            />
                            <ButtonWithSpinner
                                loading={status === Status.Submitting}
                                onClick={onSubmit}
                            >{t`submit`}</ButtonWithSpinner>
                        </>
                    ) : (
                        <Alert variant="danger">{t`signInRequired`}</Alert>
                    )}
                </div>
            </Layout>
        </>
    )
}
export default ProblemPage

const GetProblem = gql`
    query GetProblem($username: String!, $id: ID!) {
        user(username: $username) {
            problem(id: $id) {
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
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const res = await invokeQueryWithApiKey(GetProblem, {
        username: params.username || '',
        id: params.problemID || '',
    })
    if (res.user === null || res.user.problem === null) {
        return {
            notFound: true,
        }
    }
    return {
        props: {
            user: res.user,
        },
        revalidate: 1,
    }
}

export const getStaticPaths: GetStaticPaths = async () => ({
    paths: [],
    fallback: true,
})
