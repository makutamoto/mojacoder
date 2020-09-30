import React from 'react'
import { Alert } from 'react-bootstrap'

const Error: React.FC = () => {
    return (
        <Alert variant="danger">存在しないページか、権限がありません。</Alert>
    )
}
export default Error
