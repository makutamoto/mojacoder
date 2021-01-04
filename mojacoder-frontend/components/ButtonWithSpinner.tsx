import React from 'react'
import { Button, ButtonProps, Spinner } from 'react-bootstrap'

export interface ButtonWithSpinnerProps extends ButtonProps {
    children?: string
    loading?: boolean
    disabled?: boolean
}

const ButtonWithSpinner: React.FC<ButtonWithSpinnerProps> = (props) => {
    const { children, loading, disabled, ...buttonProps } = props
    return (
        <Button {...buttonProps} disabled={loading || disabled}>
            {loading && (
                <Spinner className="mr-3" size="sm" animation="border" />
            )}
            {children}
        </Button>
    )
}
export default ButtonWithSpinner
