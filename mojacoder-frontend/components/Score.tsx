import React from 'react'

export interface ScoreProps {
    penalty: number
    score: number
    secondsFromStart: number
}

const Score: React.FC<ScoreProps> = ({ penalty, score, secondsFromStart }) => {
    const minutes = Math.floor(secondsFromStart / 60)
    const seconds = secondsFromStart % 60
    return (
        <span>
            <span className="text-success font-weight-bold">{score}</span>{' '}
            {penalty !== 0 && <span className="text-danger">({penalty})</span>}{' '}
            <span className="text-secondary">
                ({score ? `${minutes}:${('0' + seconds).slice(-2)}` : '-'})
            </span>
        </span>
    )
}
export default Score
