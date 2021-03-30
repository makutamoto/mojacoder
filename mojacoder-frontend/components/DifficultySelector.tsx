import React from 'react'

import Selector, { SelectorProps, SelectorOptionsType } from './Selector'

export type DifficultySelectorProps = Omit<SelectorProps, 'options'>

const OPTIONS: SelectorOptionsType = [
    { value: 'none', label: '-' },
    { value: 'gray', label: '灰' },
    { value: 'brown', label: '茶' },
    { value: 'green', label: '緑' },
    { value: 'cyan', label: '水' },
    { value: 'blue', label: '青' },
    { value: 'yellow', label: '黄' },
    { value: 'orange', label: '橙' },
    { value: 'red', label: '赤' },
]

const DifficultySelector: React.FC<DifficultySelectorProps> = (props) => {
    return <Selector {...props} options={OPTIONS} />
}

export default DifficultySelector
