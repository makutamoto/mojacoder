import React from 'react'

import CopyButton from './CopyButton'

interface Props {
    title: string
    value: string
}

const Sample: React.FC<Props> = (props) => {
    return (
        <div className="my-2 p-2 border rounded bg-light">
            <h6 className="d-inline">{props.title}</h6>
            <CopyButton
                className="px-1 py-0"
                variant="light"
                value={props.value}
            />
            <pre
                {...({ readonly: 'true' } as any)}
                className="form-control mt-1 mb-0 h-100"
            >
                {props.value}
            </pre>
        </div>
    )
}
export default Sample
