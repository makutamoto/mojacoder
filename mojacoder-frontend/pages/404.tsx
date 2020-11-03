import React from 'react'
import { Alert } from 'react-bootstrap'

import { useI18n } from '../lib/i18n'

const Error: React.FC = () => {
    const { t } = useI18n('notFound')
    return <Alert variant="danger">{t`notFound`}</Alert>
}
export default Error
