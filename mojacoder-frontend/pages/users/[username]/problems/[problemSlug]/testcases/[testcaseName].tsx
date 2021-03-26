import React, { useEffect, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import gql from 'graphql-tag'
import axios from 'axios'
import { ProgressBar } from 'react-bootstrap'

import { invokeQueryWithApiKey } from '../../../../../../lib/backend'
import { Problem } from '../../../../../../lib/backend_types'
import Editor from '../../../../../../components/Editor'
import Layout from '../../../../../../components/Layout'
import ProblemTop from '../../../../../../containers/ProblemTop'
import Heading from '../../../../../../components/Heading'
import Title from '../../../../../../components/Title'

const GetTestcase = gql`
    query GetTestcase(
        $authorUsername: String!
        $problemSlug: String!
        $testcaseName: String!
    ) {
        user(username: $authorUsername) {
            problem(slug: $problemSlug) {
                id
                testcase(name: $testcaseName) {
                    inUrl
                    outUrl
                }
            }
        }
    }
`

interface Props {
    problem: Problem
}
const Submissions: React.FC<Props> = ({ problem }) => {
    const { query } = useRouter()
    const { username, problemSlug, testcaseName } = query
    const [inTestcase, setInTestcase] = useState<string | null>(null)
    const [outTestcase, setOutTestcase] = useState<string | null>(null)
    useEffect(() => {
        invokeQueryWithApiKey(GetTestcase, {
            authorUsername: username,
            problemSlug: problemSlug,
            testcaseName: testcaseName,
        }).then(({ user }) => {
            axios
                .get(user.problem.testcase.inUrl, {
                    transformResponse: (value) => value,
                })
                .then(({ data }) => {
                    setInTestcase(String(data))
                })
            axios
                .get(user.problem.testcase.outUrl, {
                    transformResponse: (value) => value,
                })
                .then(({ data }) => {
                    setOutTestcase(String(data))
                })
        })
    }, [query, setInTestcase, setOutTestcase])
    return (
        <>
            <Title>{`'${problem.title}'のテストケース`}</Title>
            <ProblemTop activeKey="testcases" problem={problem} />
            <Layout>
                <Heading>{testcaseName}</Heading>
                <h3>入力</h3>
                {!inTestcase && <ProgressBar animated now={100} />}
                <Editor value={inTestcase || ''} readOnly />
                <h3>出力</h3>
                {!outTestcase && <ProgressBar animated now={100} />}
                <Editor value={outTestcase || ''} readOnly />
            </Layout>
        </>
    )
}
export default Submissions

const GetProblemOverview = gql`
    query GetProblemOverview($authorUsername: String!, $problemSlug: String!) {
        user(username: $authorUsername) {
            problem(slug: $problemSlug) {
                title
                id
                hasEditorial
                user {
                    detail {
                        userID
                        icon
                        screenName
                    }
                }
                testcaseNames
            }
        }
    }
`
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const resIn = await invokeQueryWithApiKey(GetProblemOverview, {
        authorUsername: params.username,
        problemSlug: params.problemSlug,
    })
    if (
        resIn.user === null ||
        resIn.user.problem === null ||
        !resIn.user.problem.testcaseNames.includes(
            params.testcaseName as string
        )
    ) {
        return {
            notFound: true,
        }
    }
    return {
        props: {
            problem: resIn.user.problem,
        },
        revalidate: 1,
    }
}

export const getStaticPaths: GetStaticPaths = async () => ({
    paths: [],
    fallback: 'blocking',
})
