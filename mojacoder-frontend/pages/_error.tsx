import React from 'react'
import { GetServerSideProps } from 'next'
import { Alert } from 'react-bootstrap'

interface Props {
    statusCode: number
}
const Error: React.FC<Props> = (props) => {
    return (
        <>
            {props.statusCode === 404 ? (
                <Alert variant="danger">ページがみつかりませんでした。</Alert>
            ) : (
                <Alert variant="danger">エラーが発生しました。</Alert>
            )}
        </>
    )
}
export default Error

export const getServerSideProps: GetServerSideProps = async (props) => {
    return {
        props: {
            statusCode: props.res.statusCode,
        },
    }
}
