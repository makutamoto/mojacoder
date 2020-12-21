import React from 'react'
import { Alert } from 'react-bootstrap'

import { useI18n } from '../lib/i18n'
import Layout from '../components/Layout'

const Error: React.FC = () => {
    const { t } = useI18n('notFound')
    return (
        <>
            <Layout>
                <Alert variant="danger">{t`notFound`}</Alert>
            </Layout>
        </>
    )
}
export default Error
