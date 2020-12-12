const programmingLanguageIDToName = {
    'go-1.14': 'Go (1.14)',
    'python3.8': 'Python 3.8',
} as const

export function getProgrammingLanguageNameFromID(id: string) {
    return programmingLanguageIDToName[id]
}
