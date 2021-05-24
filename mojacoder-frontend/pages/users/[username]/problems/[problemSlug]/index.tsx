import React, { useMemo } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import AdSense from 'react-adsense'
import gql from 'graphql-tag'

import { useI18n } from '../../../../../lib/i18n'
import { invokeQueryWithApiKey } from '../../../../../lib/backend'
import { UserDetail } from '../../../../../lib/backend_types'
import { generateProblemOGP } from '../../../../../lib/cloudinary'
import Layout from '../../../../../components/Layout'
import Markdown from '../../../../../components/Markdown'
import Title from '../../../../../components/Title'
import Heading from '../../../../../components/Heading'
import ProblemTop from '../../../../../containers/ProblemTop'
import SubmissionBox from '../../../../../components/SubmissionBox'

interface Props {
    user: UserDetail | null
}

const ProblemPage: React.FC<Props> = (props) => {
    const { t } = useI18n('problem')
    const { user } = props
    const ogpImage = useMemo(() => generateProblemOGP(user.problem), [
        user.problem,
    ])
    return (
        <>
            <Title large image={ogpImage}>
                {user.problem.title}
            </Title>
            <ProblemTop activeKey="problem" problem={user.problem} />
            <Layout>
                <Markdown source={user.problem.statement} />
                <AdSense.Google
                    style={{
                        display: 'block',
                        textAlign: 'center',
                    }}
                    client="ca-pub-1558648672247263"
                    slot="8232681143"
                    format="fluid"
                    layout="in-article"
                />
                <div>
                    <Heading>{t`submit`}</Heading>
                    <SubmissionBox
                        id="problem-code-editor"
                        problemID={user.problem.id}
                        redirect="submissions"
                    />
                </div>
            </Layout>
        </>
    )
}
export default ProblemPage

const GetProblem = gql`
    query GetProblem($username: String!, $problemSlug: String!) {
        user(username: $username) {
            problem(slug: $problemSlug) {
                id
                title
                statement
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
