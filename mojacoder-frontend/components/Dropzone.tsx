import React from 'react'
import { useDropzone, DropzoneOptions } from 'react-dropzone'

export interface DropzoneProps extends DropzoneOptions {
    message: JSX.Element | string
    description?: JSX.Element | string
}

const Dropzone: React.FC<DropzoneProps> = ({
    message,
    description,
    ...dropzoneOptions
}) => {
    const { getRootProps, getInputProps } = useDropzone(dropzoneOptions)
    return (
        <div
            {...getRootProps({
                className: 'my-3 border rounded p-3 bg-light',
            })}
        >
            <input {...getInputProps()} />
            {message}
            {description && <div className="text-muted">{description}</div>}
        </div>
    )
}
export default Dropzone
