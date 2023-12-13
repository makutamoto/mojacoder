import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, Nav } from 'react-bootstrap'
import join from 'url-join'
import gql from 'graphql-tag'

import { useI18n } from '../lib/i18n'
import {
    invokeQuery,
    invokeQueryWithApiKey,
    invokeMutation,
} from '../lib/backend'
import { ProblemDetail } from '../lib/backend_types'
import Auth from '../lib/auth'
import Top from '../components/Top'
import IconWithText from '../components/IconWithText'
import Username from '../components/Username'
import {
    BeakerIcon,
    ClockIcon,
    CommentDiscussionIcon,
    HeartIcon,
    HeartFillIcon,
} from '@primer/octicons-react'

const GetIfLiked = gql`
    query GetIfLiked($authorUsername: String!, $problemSlug: String!) {
        user(username: $authorUsername) {
            problem(slug: $problemSlug) {
                id
                likedByMe
                likeCount
                commentCount
            }
        }
    }
`
const GetLikeCount = gql`
    query GetLikeCount($authorUsername: String!, $problemSlug: String!) {
        user(username: $authorUsername) {
            problem(slug: $problemSlug) {
                id
                likeCount
                commentCount
            }
        }
    }
`
const LikeProblem = gql`
    mutation LikeProblem($input: LikeProblemInput!) {
        likeProblem(input: $input)
    }
`

const circleButtonStyles: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    border: 'solid lightgray 1px',
    background: 'white',
}

export interface ProblemTopProps {
    activeKey?:
        | 'problem'
        | 'submissions'
        | 'testcases'
        | 'editorial'
        | 'edit'
        | 'judgecode'
    problem?: ProblemDetail
}

const ProblemTop: React.FC<ProblemTopProps> = (props) => {
    const { t } = useI18n('problemTab')
    const { auth } = Auth.useContainer()
    const { query, defaultLocale, locale } = useRouter()
    const { activeKey, problem } = props
    const basePath = join(
        '/users',
        (query.username || '') as string,
        'problems',
        (query.problemSlug || '') as string
    )
    const [likedByMe, setLikedByMe] = useState(false)
    const [likeCount, setLikeCount] = useState<number | null>(null)
    const [commentCount, setCommentCount] = useState<number | null>(null)
    const onLike = useCallback(() => {
        if (auth) {
            invokeMutation(LikeProblem, {
                input: {
                    problemID: problem?.id || '',
                    like: !likedByMe,
                },
            }).then(() => {
                setLikeCount(likeCount + (likedByMe ? -1 : 1))
                setLikedByMe(!likedByMe)
            })
        }
    }, [auth, query, likedByMe, likeCount, problem])
    useEffect(() => {
        if (auth) {
            invokeQuery(GetIfLiked, {
                authorUsername: query.username || '',
                problemSlug: query.problemSlug || '',
            }).then((res) => {
                setLikeCount(res.user?.problem.likeCount || 0)
                setLikedByMe(res.user?.problem.likedByMe || false)
                setCommentCount(res.user?.problem.commentCount || 0)
            })
        } else {
            invokeQueryWithApiKey(GetLikeCount, {
                authorUsername: query.username || '',
                problemSlug: query.problemSlug || '',
            }).then((res) => {
                setLikeCount(res.user?.problem.likeCount || 0)
                setLikedByMe(false)
                setCommentCount(res.user?.problem.commentCount || 0)
            })
        }
    }, [auth, query])
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
                        <Username>{problem?.user.detail}</Username>
                    </div>
                    <div className="my-2">
                        {likeCount !== null && (
                            <>
                                <IconWithText
                                    icon={
                                        <Button
                                            variant="light"
                                            size="sm"
                                            onClick={onLike}
                                            style={circleButtonStyles}
                                        >
                                            {likedByMe ? (
                                                <HeartFillIcon className="text-danger" />
                                            ) : (
                                                <HeartIcon />
                                            )}
                                        </Button>
                                    }
                                >
                                    <Link href={join(basePath, 'likers')}>
                                        {likeCount}
                                    </Link>
                                </IconWithText>{' '}
                            </>
                        )}
                        {commentCount !== null && (
                            <>
                                <IconWithText
                                    icon={
                                        <Link href={join(basePath, 'comments')}>
                                            <Button
                                                variant="light"
                                                size="sm"
                                                style={circleButtonStyles}
                                            >
                                                <CommentDiscussionIcon />
                                            </Button>
                                        </Link>
                                    }
                                >
                                    {commentCount}
                                </IconWithText>{' '}
                            </>
                        )}
                        <a
                            href={`https://twitter.com/intent/tweet?hashtags=MojaCoder&url=${encodeURIComponent(
                                join(
                                    process.env.ORIGIN,
                                    locale === defaultLocale ? '' : locale,
                                    basePath
                                )
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
                        <Link legacyBehavior passHref href={basePath}>
                            <Nav.Link eventKey="problem">{t`problem`}</Nav.Link>
                        </Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Link
                            legacyBehavior
                            passHref
                            href={join(basePath, 'submissions')}
                        >
                            <Nav.Link eventKey="submissions">{t`submissions`}</Nav.Link>
                        </Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Link
                            legacyBehavior
                            passHref
                            href={join(basePath, 'testcases')}
                        >
                            <Nav.Link eventKey="testcases">{t`testcases`}</Nav.Link>
                        </Link>
                    </Nav.Item>
                    {problem?.hasEditorial && (
                        <Nav.Item>
                            <Link
                                legacyBehavior
                                passHref
                                href={join(basePath, 'editorial')}
                            >
                                <Nav.Link eventKey="editorial">{t`editorial`}</Nav.Link>
                            </Link>
                        </Nav.Item>
                    )}
                    {problem.judgeType === 'SPECIAL' && (
                        <Nav.Item>
                            <Link
                                legacyBehavior
                                passHref
                                href={join(basePath, 'judgecode')}
                            >
                                <Nav.Link eventKey="judgecode">
                                    ジャッジコード
                                </Nav.Link>
                            </Link>
                        </Nav.Item>
                    )}
                    {auth && auth.userID === problem?.user.detail.userID && (
                        <Nav.Item>
                            <Link
                                legacyBehavior
                                passHref
                                href={join(basePath, 'edit')}
                            >
                                <Nav.Link eventKey="edit">{t`edit`}</Nav.Link>
                            </Link>
                        </Nav.Item>
                    )}
                </Nav>
            </div>
        </Top>
    )
}
export default ProblemTop
