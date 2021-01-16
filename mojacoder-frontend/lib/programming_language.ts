const programmingLanguageIDToName = {
    'go-1.14': 'Go (1.14)',
    'python3.8': 'Python3 (CPython 3.8)',
    'gcc-9.3.0': 'C (GCC 9.3.0)',
    'g++-9.3.0': 'C++ (GCC 9.3.0)',
    'csharp-mono-csc-3.6.0': 'C# (Mono-csc 3.6.0)',
    'csharp-mono-mcs-6.12.0.107': 'C# (Mono-mcs 6.12.0.107)',
    'bf-20041219': 'Brainfuck (bf 20041219)',
    cat: 'Text (cat)',
    'rust-1.43.0': 'Rust (rustc 1.43.0)',
    'pypy3-7.3.1': 'Python3 (pypy3 7.3.1)',
} as const

export function getProgrammingLanguageNameFromID(id: string) {
    return programmingLanguageIDToName[id]
}
