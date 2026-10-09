// Keep historical language names in programming_language.ts for past submissions.
export const SUBMISSION_LANGUAGES = [
    { value: 'go-1.21', label: 'Go (1.21)' },
    { value: 'python3.11', label: 'Python3 (CPython 3.11)' },
    { value: 'gcc-12.3', label: 'C (GCC 12.3)' },
    { value: 'g++-12.3', label: 'C++ (GCC 12.3)' },
    { value: 'bf-20041219', label: 'Brainfuck (bf 20041219)' },
    { value: 'cat', label: 'Text (cat)' },
    { value: 'rust-1.74.0', label: 'Rust (rustc 1.74.0)' },
    { value: 'pypy3-7.3.13', label: 'Python3 (pypy3 7.3.13)' },
    { value: 'ruby-3.2.2', label: 'Ruby (CRuby 3.2.2)' },
    { value: 'java-21', label: 'Java 21 (Open JDK 21)' },
]

export function isSupportedSubmissionLanguage(lang: string): boolean {
    return SUBMISSION_LANGUAGES.some((option) => option.value === lang)
}
