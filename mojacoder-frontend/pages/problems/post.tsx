import React, { useCallback, useState } from 'react'
import Image from 'next/image'
import { Alert } from 'react-bootstrap'
import { useDropzone } from 'react-dropzone'
import gql from 'graphql-tag'
import parse from 'path-parse'
import axios from 'axios'

import Auth from '../../lib/auth'
import { invokeMutation } from '../../lib/backend'
import Layout from '../../components/Layout'
import Top from '../../components/Top'
import AlertWithSpinner from '../../components/AlertWithSpinner'

const Status = {
    Normal: 'Normal',
    Posting: 'Posting',
    Done: 'Done',
    FileTypeError: 'FileTypeError',
} as const
type Status = typeof Status[keyof typeof Status]

const IssueUrl = gql`
    mutation IssueUrl($input: IssueProblemUploadUrlInput!) {
        issueProblemUploadUrl(input: $input)
    }
`

export const Post: React.FC = () => {
    const { auth } = Auth.useContainer()
    const [status, setStatus] = useState<Status>(Status.Normal)
    const onPost = useCallback(async (files: File[]) => {
        setStatus(Status.Posting)
        if (files.length === 0) {
            setStatus(Status.FileTypeError)
            return
        }
        for (const file of files) {
            const { name } = parse(file.name)
            const { issueProblemUploadUrl } = await invokeMutation(IssueUrl, {
                input: {
                    problemName: name,
                },
            })
            await axios.put(issueProblemUploadUrl, file, {
                headers: {
                    'Content-Type': 'application/zip',
                },
            })
        }
        setStatus(Status.Done)
    }, [])
    const { getRootProps, getInputProps } = useDropzone({
        accept: 'application/zip',
        onDrop: onPost,
    })
    return (
        <>
            <Top>
                <h1 className="text-center">問題を投稿</h1>
            </Top>
            <Layout>
                {auth ? (
                    <>
                        <div
                            {...getRootProps({
                                className: 'border p-5 rounded bg-light',
                            })}
                        >
                            <input {...getInputProps()} />
                            <div className="text-center">
                                <Image
                                    width={256}
                                    height={256}
                                    src="/illustrations/undraw_Add_files_re_v09g.svg"
                                />
                                <p className="pt-4">
                                    ここにZipファイルをドロップするか、クリックしてファイルを選択して下さい。
                                </p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <AlertWithSpinner
                                show={status === Status.Posting}
                                variant="primary"
                            >
                                アップロード中です。
                            </AlertWithSpinner>
                            <Alert
                                show={status === Status.Done}
                                variant="success"
                            >
                                完了しました。
                            </Alert>
                            <Alert
                                show={status === Status.FileTypeError}
                                variant="danger"
                            >
                                ファイルタイプが異なります。
                            </Alert>
                        </div>
                    </>
                ) : (
                    <Alert variant="danger">
                        問題を投稿するにはサインインが必要です。
                    </Alert>
                )}
            </Layout>
        </>
    )
}

export default Post
