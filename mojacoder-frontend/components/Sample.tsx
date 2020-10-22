import React from 'react'

interface Props {
    title: string
    value: string
}

const Sample: React.FC<Props> = (props) => {
    return (
        <div>
            <h2>{props.title}</h2>
            <p>{props.value}</p>
        </div>
    )
}
export default Sample
