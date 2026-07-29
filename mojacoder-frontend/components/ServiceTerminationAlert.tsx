import React from 'react'
import { Alert } from 'react-bootstrap'

import { useI18n } from '../lib/i18n'

const ServiceTerminationAlert: React.FC = () => {
    const { t } = useI18n('serviceTermination')

    return (
        <Alert variant="danger" className="mb-0 rounded-0 text-center">
            {t`notice`}
        </Alert>
    )
}

export default ServiceTerminationAlert
