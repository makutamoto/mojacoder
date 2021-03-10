import React, { useEffect, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { Alert, Spinner } from 'react-bootstrap'
import gql from 'graphql-tag'
import axios from 'axios'
import JSZip from 'jszip'
import { OrderedMap } from 'immutable'

import Auth from '../../../../../lib/auth'
import {
    invokeQueryWithApiKey,
    invokeMutation,
} from '../../../../../lib/backend'
import { UserDetail } from '../../../../../lib/backend_types'
import Layout from '../../../../../components/Layout'
import ProblemTop from '../../../../../containers/ProblemTop'
import Title from '../../../../../components/Title'
import ProblemEditor, {
    ProblemEditorData,
    Testcase,
} from '../../../../../containers/ProblemEditor'

const IssueProblemDownloadUrl = gql`
    mutation IssueProblemDownloadUrl($input: IssueProblemDownloadUrlInput!) {
        issueProblemDownloadUrl(input: $input)
    }
`

interface Props {
    user: UserDetail
}
const ProblemPage: React.FC<Props> = ({ user }) => {
    const { query } = useRouter()
    const { auth } = Auth.useContainer()
    const [editorData, setEditorData] = useState<ProblemEditorData | null>(null)
    useEffect(() => {
        if (query.problemSlug) {
            const getProblem = async () => {
                const slug = query.problemSlug as string
                const { issueProblemDownloadUrl } = await invokeMutation(
                    IssueProblemDownloadUrl,
                    {
                        input: {
                            problemName: slug,
                        },
                    }
                )
                const { data } = await axios.get(issueProblemDownloadUrl, {
                    responseType: 'blob',
                })
                const jszip = await JSZip.loadAsync(data)
                const statement = await jszip.file('README.md').async('string')
                const editorial =
                    (await jszip.file('EDITORIAL.md')?.async('string')) || ''
                const { title, notListed, difficulty } = JSON.parse(
                    await jszip.file('problem.json').async('string')
                )
                const testcaseArray: [string, Testcase][] = []
                const testcasesDir = jszip.folder('testcases')
                const inTestcases = testcasesDir.folder('in')
                const outTestcases = testcasesDir.folder('out')
                const testcaseNames: [string, JSZip.JSZipObject][] = []
                inTestcases.forEach((path, file) => {
                    if (file.dir) return
                    testcaseNames.push([path, file])
                })
                for (const [path, file] of testcaseNames) {
                    const outTestcaseFile = outTestcases.file(path)
                    if (outTestcaseFile === null || outTestcaseFile.dir) return
                    const input = await file.async('string')
                    const output = await outTestcaseFile.async('string')
                    testcaseArray.push([path, { input, output }])
                }
                const testcases = OrderedMap(testcaseArray)
                setEditorData({
                    zip: data,
                    problem: {
                        slug,
                        title,
                        notListed,
                        statement,
                        editorial,
                        difficulty,
                        testcases,
                    },
                })
            }
            getProblem()
        }
    }, [query])
    return (
        <>
            <Title>{`'${user.problem.title}'を編集`}</Title>
            <ProblemTop activeKey="edit" problem={user.problem} />
            <Layout>
                {auth && auth.userID === user.userID ? (
                    <>
                        {editorData ? (
                            <ProblemEditor data={editorData} />
                        ) : (
                            <Spinner animation="border" />
                        )}
                    </>
                ) : (
                    <Alert variant="danger">権限がありません。</Alert>
                )}
            </Layout>
        </>
    )
}
export default ProblemPage

const GetProblem = gql`
    query GetProblem($username: String!, $problemSlug: String!) {
        user(username: $username) {
            userID
            problem(slug: $problemSlug) {
                id
                title
                hasEditorial
                user {
                    detail {
                        userID
                        icon
                        screenName
                    }
                }
            }
        }
    }
`
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const res = await invokeQueryWithApiKey(GetProblem, {
        username: params.username,
        problemSlug: params.problemSlug,
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
    fallback: 'blocking',
})
