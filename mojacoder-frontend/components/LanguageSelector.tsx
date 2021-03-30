import React from 'react'

import Selector, { SelectorProps, SelectorOptionsType } from './Selector'

export type LanguageSelectorProps = Omit<SelectorProps, 'options'>

const OPTIONS: SelectorOptionsType = [
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
    { value: 'ruby-2.7', label: 'Ruby (CRuby 2.7)' },
    { value: 'java-11', label: 'Java 11 (Open JDK 11)' },
    { value: 'j-902', label: 'J (j902)' },
    { value: 'kotlin-1.4', label: 'Kotlin (1.4)' },
    { value: 'commonlisp-2.0', label: 'Common Lisp (2.0)' },
]

const LanguageSelector: React.FC<LanguageSelectorProps> = (props) => {
    return <Selector {...props} options={OPTIONS} />
}

export default LanguageSelector
