const programmingLanguageIDToName = {
    'go-1.14': 'Go (1.14)',
    'go-1.21': 'Go (1.21)',
    'python3.8': 'Python3 (CPython 3.8)',
    'python3.11': 'Python3 (CPython 3.11)',
    'gcc-9.3.0': 'C (GCC 9.3.0)',
    'gcc-12.3': 'C (GCC 12.3)',
    'g++-9.3.0': 'C++ (GCC 9.3.0)',
    'g++-12.3': 'C++ (GCC 12.3)',
    'csharp-mono-csc-3.6.0': 'C# (Mono-csc 3.6.0)',
    'csharp-mono-csc-3.9.0': 'C# (Mono-csc 3.9.0)',
    'csharp-mono-mcs-6.12.0.107': 'C# (Mono-mcs 6.12.0.107)',
    'csharp-mono-mcs-6.12.0': 'C# (Mono-mcs 6.12.0)',
    'bf-20041219': 'Brainfuck (bf 20041219)',
    cat: 'Text (cat)',
    'rust-1.43.0': 'Rust (rustc 1.43.0)',
    'rust-1.74.0': 'Rust (rustc 1.74.0)',
    'pypy3-7.3.1': 'Python3 (pypy3 7.3.1)',
    'pypy3-7.3.13': 'Python3 (pypy3 7.3.13)',
    'ruby-2.7': 'Ruby (CRuby 2.7)',
    'ruby-3.2.2': 'Ruby (CRuby 3.2.2)',
    'java-11': 'Java 11 (Open JDK 11)',
    'java-21': 'Java 21 (Open JDK 21)',
    'j-902': 'J (j902)',
    'kotlin-1.4': 'Kotlin (1.4)',
    'kotlin-1.9.21': 'Kotlin (1.9)',
    'commonlisp-2.0': 'Common Lisp (2.0)',
    'commonlisp-2.1.11': 'Common Lisp (2.1)',
    'nim-1.6.16': 'Nim (1.6.16)',
} as const

export function getProgrammingLanguageNameFromID(id: string) {
    return programmingLanguageIDToName[id]
}
