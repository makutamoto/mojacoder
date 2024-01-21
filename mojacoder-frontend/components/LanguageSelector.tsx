import React from 'react'

import Selector, { SelectorProps, SelectorOptionsType } from './Selector'

export type LanguageSelectorProps = Omit<SelectorProps, 'options'>

const OPTIONS: SelectorOptionsType = [
    { value: 'go-1.21', label: 'Go (1.21)' },
    { value: 'python3.11', label: 'Python3 (CPython 3.11)' },
    { value: 'gcc-12.3', label: 'C (GCC 12.3)' },
    { value: 'g++-12.3', label: 'C++ (GCC 12.3)' },
    { value: 'csharp-mono-csc-3.9.0', label: 'C# (Mono-csc 3.9.0)' },
    { value: 'csharp-mono-mcs-6.12.0', label: 'C# (Mono-mcs 6.12.0)' },
    { value: 'bf-20041219', label: 'Brainfuck (bf 20041219)' },
    { value: 'cat', label: 'Text (cat)' },
    { value: 'rust-1.74.0', label: 'Rust (rustc 1.74.0)' },
    { value: 'pypy3-7.3.13', label: 'Python3 (pypy3 7.3.13)' },
    { value: 'ruby-3.2.2', label: 'Ruby (CRuby 3.2.2)' },
    { value: 'java-21', label: 'Java 21 (Open JDK 21)' },
    { value: 'kotlin-1.9.21', label: 'Kotlin (1.9)' },
    { value: 'commonlisp-2.1.11', label: 'Common Lisp (2.1)' },
    { value: 'nim-1.6.16', label: 'Nim (1.6.16)' },
]

const LanguageSelector: React.FC<LanguageSelectorProps> = (props) => {
    return <Selector {...props} options={OPTIONS} />
}

export default LanguageSelector
