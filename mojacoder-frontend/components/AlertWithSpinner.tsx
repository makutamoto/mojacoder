import React from 'react'
import { Alert, AlertProps, Spinner } from 'react-bootstrap'

export interface AlertWithSpinnerProps extends AlertProps {
    children?: string
}

const AlertWithSpinner: React.FC<AlertWithSpinnerProps> = (props) => {
    const { children, ...alertProps } = props
    return (
        <Alert {...alertProps}>
            <Spinner className="mr-3" size="sm" animation="border" />
            {children}
        </Alert>
    )
}
export default AlertWithSpinner
