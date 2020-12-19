import React from 'react'

export interface IconWithTextProps {
    icon: JSX.Element
}

const IconWithText: React.FC<IconWithTextProps> = (props) => {
    return (
        <span>
            <span className="mr-1">{props.icon}</span>
            {props.children}
        </span>
    )
}
export default IconWithText
