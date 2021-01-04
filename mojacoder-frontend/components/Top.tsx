import React from 'react'
import clsx from 'clsx'

export interface TopProps {
    className?: string
}
const Top: React.FC<TopProps> = (props) => {
    return (
        <div className={clsx('my-4 py-4', props.className)}>
            {props.children}
        </div>
    )
}
export default Top
