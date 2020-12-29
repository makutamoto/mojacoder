import React from 'react'
import { Button, Spinner } from 'react-bootstrap'

export interface ButtonWithSpinnerProps {
    children?: string
    loading?: boolean
    onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void
    type?: string
    variant?: string
}

const ButtonWithSpinner: React.FC<ButtonWithSpinnerProps> = (props) => {
    const { children, loading, onClick, type, variant } = props
    return (
        <Button
            type={type}
            variant={variant}
            disabled={loading}
            onClick={onClick}
        >
            {loading && (
                <Spinner className="mr-3" size="sm" animation="border" />
            )}
            {children}
        </Button>
    )
}
export default ButtonWithSpinner
