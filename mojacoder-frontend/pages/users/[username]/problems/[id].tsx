import React from 'react'
import { GetServerSideProps } from 'next'
import gql from 'graphql-tag'
import ReactMarkdown from 'react-markdown'
import { Button } from 'react-bootstrap'

import { invokeQueryWithApiKey } from '../../../../lib/backend'
import { User } from '../../../../lib/backend_types'
import Sample from '../../../../components/Sample'

interface Props {
    user: User
}

const ProblemPage: React.FC<Props> = (props) => {
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
                }}
            />
            <h2>提出</h2>
            <hr />
            {/* <CodeEditor
                id="problem-submision"
                value={{ code: '', lang: 'go-1.14' }}
                // eslint-disable-next-line
                onChange={() => {}}
            /> */}
            <Button>提出</Button>
        </>
    )
}
export default ProblemPage

const GetProblem = gql`
    query GetProblem($username: String!, $id: String!) {
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
