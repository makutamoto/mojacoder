import React from 'react'
import Select, { OptionsType } from 'react-select'

export type SelectorOptionsType = OptionsType<{ value: string; label: string }>
export interface SelectorProps {
    id: string
    value: string
    options: SelectorOptionsType
    onChange: (value: string) => void
}

const Selector: React.FC<SelectorProps> = ({
    id,
    value,
    options,
    onChange,
}) => {
    return (
        <Select
            id={id}
            instanceId={id}
            value={options.find((val) => val.value === value)}
            options={options}
            onChange={(val) => onChange((val as any).value)}
        />
    )
}

export default Selector
