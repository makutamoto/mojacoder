import React from 'react'
import { Form } from 'react-bootstrap'

export interface InputWithLabelProps
    extends React.ComponentProps<typeof Form.Control> {
    label?: string
    message?: string
    invalidFeedback?: string
}

export default (({ label, message, invalidFeedback, ...formControlProps }) => {
    return (
        <Form.Group className="my-3">
            {label && <Form.Label>{label}</Form.Label>}
            <Form.Control {...formControlProps} />
            {message && <Form.Text className="text-muted">{message}</Form.Text>}
            {invalidFeedback && (
                <Form.Control.Feedback type="invalid">
                    {invalidFeedback}
                </Form.Control.Feedback>
            )}
        </Form.Group>
    )
}) as React.FC<InputWithLabelProps>
