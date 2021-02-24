import React from 'react'

export interface DifficultyProps {
    children?: string
}

const Difficulty: React.FC<DifficultyProps> = (props) => {
    return <span style={{ color: props.children }}>&#9679;</span>
}
export default Difficulty
