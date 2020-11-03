import React, { useState } from 'react'
import { GetServerSideProps } from 'next'
import gql from 'graphql-tag'
import ReactMarkdown from 'react-markdown'
import { Button } from 'react-bootstrap'

import { useI18n } from '../../../../lib/i18n'
import { invokeQueryWithApiKey } from '../../../../lib/backend'
import { User } from '../../../../lib/backend_types'
import Sample from '../../../../components/Sample'
import CodeEditor, { Code } from '../../../../components/CodeEditor'

interface Props {
    user: User
}

const ProblemPage: React.FC<Props> = (props) => {
    const { t } = useI18n('problem')
    const [code, setCode] = useState<Code>({ lang: 'go-1.14', code: '' })
    return (
        <>
            <h1>{props.user.problem.title}</h1>
            <hr />
            <ReactMarkdown
                source={props.user.problem.statement}
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
                }}
            />
            <div>
                <h2>{t`submit`}</h2>
                <hr />
                <CodeEditor
                    id="problem-code-editor"
                    value={code}
                    onChange={setCode}
                />
                <Button>{t`submit`}</Button>
            </div>
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
            }
        }
    }
`
interface GetProblemResponse {
    user: User | null
}
export const getServerSideProps: GetServerSideProps<Props> = async ({
    query,
}) => {
    const res = (await invokeQueryWithApiKey(GetProblem, {
        username: query.username,
        id: query.id,
    })) as GetProblemResponse
    return {
        props: {
            user: res.user,
        },
    }
}
