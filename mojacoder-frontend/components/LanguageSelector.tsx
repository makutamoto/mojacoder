import React from 'react'
import Select from 'react-select'

export interface LanguageSelectorProps {
    id: string
    value: string
    onChange: (value: string) => void
}

const OPTIONS = [
    { value: 'go-1.14', label: 'Go (1.14)' },
    { value: 'python3.8', label: 'Python3 (CPython 3.8)' },
    { value: 'gcc-9.3.0', label: 'C (GCC 9.3.0)' },
    { value: 'g++-9.3.0', label: 'C++ (GCC 9.3.0)' },
    { value: 'csharp-mono-csc-3.6.0', label: 'C# (Mono-csc 3.6.0)' },
    { value: 'csharp-mono-mcs-6.12.0.107', label: 'C# (Mono-mcs 6.12.0.107)' },
    { value: 'bf-20041219', label: 'Brainfuck (bf 20041219)' },
    { value: 'cat', label: 'Text (cat)' },
    { value: 'rust-1.43.0', label: 'Rust (rustc 1.43.0)' },
    { value: 'pypy3-7.3.1', label: 'Python3 (pypy3 7.3.1)' },
]

const LanguageSelector: React.FC<LanguageSelectorProps> = (props) => {
    return (
        <Select
            id={props.id}
            instanceId={props.id}
            value={OPTIONS.find((value) => value.value === props.value)}
            options={OPTIONS}
            onChange={(value) => props.onChange((value as any).value)}
        />
    )
}

export default LanguageSelector
