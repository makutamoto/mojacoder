const programmingLanguageIDToName = {
    'go-1.14': 'Go (1.14)',
    'python3.8': 'Python 3.8',
    'gcc-9.3.0': 'C (GCC 9.3.0)',
    'g++-9.3.0': 'C++ (GCC 9.3.0)',
    'csharp-mono-csc-3.6.0': 'C# (Mono-csc 3.6.0)',
    'csharp-mono-mcs-6.12.0.107': 'C# (Mono-mcs 6.12.0.107)',
    'bf-20041219': 'Brainfuck (bf 20041219)',
    cat: 'Text (cat)',
} as const

export function getProgrammingLanguageNameFromID(id: string) {
    return programmingLanguageIDToName[id]
}
