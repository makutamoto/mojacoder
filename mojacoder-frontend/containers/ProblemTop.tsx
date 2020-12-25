import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, Nav } from 'react-bootstrap'
import join from 'url-join'
import gql from 'graphql-tag'

import { useI18n } from '../lib/i18n'
import { invokeQuery, invokeMutation } from '../lib/backend'
import { Problem } from '../lib/backend_types'
import Auth from '../lib/auth'
import Top from '../components/Top'
import IconWithText from '../components/IconWithText'
import Username from '../components/Username'
import {
    BeakerIcon,
    ClockIcon,
    HeartIcon,
    HeartFillIcon,
    SmileyIcon,
} from '@primer/octicons-react'

const GetIfLiked = gql`
    query GetIfLiked($authorUsername: String!, $problemID: ID!) {
        user(username: $authorUsername) {
            problem(id: $problemID) {
                likedByMe
            }
        }
    }
`
const LikeProblem = gql`
    mutation LikeProblem($input: LikeProblemInput!) {
        likeProblem(input: $input)
    }
`

export interface ProblemTopProps {
    activeKey?: 'problem' | 'submissions' | 'testcases'
    problem?: Problem
}

const ProblemTop: React.FC<ProblemTopProps> = (props) => {
    const { t } = useI18n('problemTab')
    const { auth } = Auth.useContainer()
    const { query, locale } = useRouter()
    const { activeKey, problem } = props
    const basePath = join(
        '/users',
        (query.username || '') as string,
        'problems',
        (query.problemID || '') as string
    )
    const [likedByMe, setLikedByMe] = useState(false)
    const [likes, setLikes] = useState(0)
    const onLike = useCallback(() => {
        if (auth) {
            invokeMutation(LikeProblem, {
                input: {
                    problemID: query.problemID || '',
                    like: !likedByMe,
                },
            }).then(() => {
                setLikes(likes + (likedByMe ? -1 : 1))
                setLikedByMe(!likedByMe)
            })
        }
    }, [auth, query, likedByMe])
    useEffect(() => {
        if (auth) {
            invokeQuery(GetIfLiked, {
                authorUsername: query.username || '',
                problemID: query.problemID || '',
            }).then((res) => {
                setLikedByMe(res.user?.problem.likedByMe || false)
            })
        }
    }, [auth, query, setLikedByMe])
    useEffect(() => setLikes(problem?.likes || 0), [problem])
    return (
        <Top>
            <div className="text-center">
                <h1>{problem?.title}</h1>
                <div className="my-2">
                    <div>
                        <IconWithText icon={<ClockIcon />}>2 secs</IconWithText>{' '}
                        <IconWithText icon={<BeakerIcon />}>
                            1024 MB
                        </IconWithText>
                    </div>
                    <div>
                        <IconWithText icon={<SmileyIcon />}>
                            <Username>{problem?.user.detail}</Username>
                        </IconWithText>
                    </div>
                    <div className="mt-2">
                        <IconWithText
                            icon={
                                <Button
                                    className="px-1 py-0"
                                    variant="light"
                                    size="sm"
                                    onClick={onLike}
                                >
                                    {likedByMe ? (
                                        <HeartFillIcon />
                                    ) : (
                                        <HeartIcon />
                                    )}
                                </Button>
                            }
                        >
                            <Link href={join(basePath, 'likers')} passHref>
                                <a>{likes}</a>
                            </Link>
                        </IconWithText>{' '}
                        <a
                            href={`https://twitter.com/intent/tweet?hashtags=MojaCoder&url=${encodeURIComponent(
                                join(process.env.ORIGIN, locale, basePath)
                            )}`}
                        >
                            Tweet
                        </a>
                    </div>
                </div>
                <Nav
                    className="mb-3 justify-content-center"
                    variant="pills"
                    activeKey={activeKey}
                >
                    <Nav.Item>
                        <Link passHref href={basePath}>
                            <Nav.Link eventKey="problem">{t`problem`}</Nav.Link>
                        </Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Link passHref href={join(basePath, 'submissions')}>
                            <Nav.Link eventKey="submissions">{t`submissions`}</Nav.Link>
                        </Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Link passHref href={join(basePath, 'testcases')}>
                            <Nav.Link eventKey="testcases">{t`testcases`}</Nav.Link>
                        </Link>
                    </Nav.Item>
                </Nav>
            </div>
        </Top>
    )
}
export default ProblemTop
