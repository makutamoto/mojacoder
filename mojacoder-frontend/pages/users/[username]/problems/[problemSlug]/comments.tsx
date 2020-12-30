import React, { useCallback, useEffect, useState } from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import gql from 'graphql-tag'
import { Alert, Button, Media, Spinner } from 'react-bootstrap'
import { ReplyIcon } from '@primer/octicons-react'
import clsx from 'clsx'

import Auth from '../../../../../lib/auth'
import {
    invokeMutation,
    invokeQueryWithApiKey,
} from '../../../../../lib/backend'
import {
    UserDetail,
    Comment,
    Connection,
} from '../../../../../lib/backend_types'
import Editor from '../../../../../components/Editor'
import Username from '../../../../../components/Username'
import DateTime from '../../../../../components/DateTime'
import Layout from '../../../../../components/Layout'
import ProblemTop from '../../../../../containers/ProblemTop'
import IconWithText from '../../../../../components/IconWithText'
import ButtonWithSpinner from '../../../../../components/ButtonWithSpinner'

import style from './comments.module.css'

const Status = {
    Normal: 'Normal',
    Posting: 'Posting',
} as const
type Status = typeof Status[keyof typeof Status]

const GetComments = gql`
    query GetComments($authorUsername: String!, $problemSlug: String!) {
        user(username: $authorUsername) {
            problem(slug: $problemSlug) {
                comments {
                    items {
                        commentID
                        datetime
                        user {
                            detail {
                                screenName
                            }
                        }
                        content
                        replyCount
                        replies {
                            items {
                                replyID
                                datetime
                                user {
                                    detail {
                                        screenName
                                    }
                                }
                                content
                            }
                        }
                    }
                }
            }
        }
    }
`

const PostComment = gql`
    mutation PostComment($input: PostCommentInput!) {
        postComment(input: $input) {
            commentID
            datetime
            user {
                detail {
                    screenName
                }
            }
            content
            replyCount
            replies {
                items {
                    replyID
                    datetime
                    user {
                        detail {
                            screenName
                        }
                    }
                    content
                }
            }
        }
    }
`

const PostReply = gql`
    mutation PostReply($input: PostReplyInput!) {
        postReply(input: $input) {
            replyID
            datetime
            user {
                detail {
                    screenName
                }
            }
            content
        }
    }
`

interface Props {
    user?: UserDetail
}

const ProblemPage: React.FC<Props> = (props) => {
    const { user } = props
    const { auth } = Auth.useContainer()
    const { query } = useRouter()
    const [status, setStatus] = useState<Status>(Status.Normal)
    const [comments, setComments] = useState<Connection<Comment> | null>(null)
    const [content, setContent] = useState('')
    const [replyTargetID, setReplyTargetID] = useState<string | null>(null)
    const onPostComment = useCallback(() => {
        setStatus(Status.Posting)
        if (replyTargetID) {
            invokeMutation(PostReply, {
                input: {
                    commentID: replyTargetID,
                    content: content,
                },
            }).then((res) => {
                const commentsClone = JSON.parse(
                    JSON.stringify(comments)
                ) as typeof comments
                for (const comment of commentsClone.items) {
                    if (comment.commentID === replyTargetID) {
                        comment.replies.items.push(res.postReply)
                        break
                    }
                }
                setComments(commentsClone)
                setContent('')
                setReplyTargetID(null)
                setStatus(Status.Normal)
            })
        } else {
            invokeMutation(PostComment, {
                input: {
                    problemID: user.problem?.id || '',
                    content: content,
                },
            }).then((res) => {
                const commentsClone = JSON.parse(
                    JSON.stringify(comments)
                ) as typeof comments
                commentsClone.items.push(res.postComment)
                setComments(commentsClone)
                setContent('')
                setStatus(Status.Normal)
            })
        }
    }, [query, content, comments, setComments, setStatus, replyTargetID])
    useEffect(() => {
        invokeQueryWithApiKey(GetComments, {
            authorUsername: query.username || '',
            problemSlug: query.problemSlug || '',
        }).then((res) => {
            const comments = res.user?.problem.comments || null
            setComments(comments)
        })
    }, [query])
    return (
        <>
            <ProblemTop problem={user?.problem} />
            <Layout>
                <h2>コメント一覧</h2>
                <hr />
                {comments ? (
                    comments.items.map((comment) => (
                        <Media
                            key={comment.commentID}
                            className={clsx(
                                'mb-2 p-3 rounded border',
                                replyTargetID === comment.commentID &&
                                    'border-primary'
                            )}
                        >
                            <Media.Body>
                                <Username>{comment.user.detail}</Username>
                                <p className="mb-0 p-2">{comment.content}</p>
                                <div className="d-flex text-secondary">
                                    <span className="flex-grow-1">
                                        <IconWithText icon={<ReplyIcon />}>
                                            {comment.replyCount}
                                        </IconWithText>
                                    </span>
                                    <DateTime>{comment.datetime}</DateTime>
                                </div>
                                <hr className={style.bar} />
                                {comment.replies.items.map((reply) => (
                                    <Media key={reply.replyID}>
                                        <Media.Body>
                                            <Username>
                                                {reply.user.detail}
                                            </Username>
                                            <div className={style.reply}>
                                                <p className="mb-0 p-2">
                                                    {reply.content}
                                                </p>
                                                <div className="text-right text-secondary">
                                                    <DateTime>
                                                        {reply.datetime}
                                                    </DateTime>
                                                </div>
                                            </div>
                                        </Media.Body>
                                    </Media>
                                ))}
                                <Button
                                    variant="outline-secondary"
                                    onClick={() =>
                                        setReplyTargetID(comment.commentID)
                                    }
                                >
                                    返信を追加
                                </Button>
                            </Media.Body>
                        </Media>
                    ))
                ) : (
                    <div className="text-center mb-3">
                        <Spinner animation="border" />
                    </div>
                )}
                <div className={replyTargetID && style['sticky-bottom']}>
                    {auth ? (
                        <div className="bg-white rounded border p-3">
                            {replyTargetID && (
                                <div className="d-flex">
                                    <span className="flex-grow-1">
                                        返信を追加
                                    </span>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => setReplyTargetID(null)}
                                    >
                                        キャンセル
                                    </Button>
                                </div>
                            )}
                            <Username>{auth}</Username>
                            <hr className={style.bar} />
                            <Editor
                                value={content}
                                onChange={setContent}
                                lineNumbers
                            />
                            <ButtonWithSpinner
                                loading={status === Status.Posting}
                                onClick={onPostComment}
                            >
                                投稿
                            </ButtonWithSpinner>
                        </div>
                    ) : (
                        <Alert variant="danger">
                            コメントを投稿するにはサインインして下さい。
                        </Alert>
                    )}
                </div>
            </Layout>
        </>
    )
}
export default ProblemPage

const GetProblem = gql`
    query GetProblem($authorUsername: String!, $problemSlug: String!) {
        user(username: $authorUsername) {
            problem(slug: $problemSlug) {
                id
                title
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
        authorUsername: params.username || '',
        problemSlug: params.problemSlug || '',
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