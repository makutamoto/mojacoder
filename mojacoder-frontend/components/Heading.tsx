import React from 'react'

const Heading: React.FC = ({ children }) => {
    return (
        <div>
            <h2>{children}</h2>
            <hr />
        </div>
    )
}
export default Heading
