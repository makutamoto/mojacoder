package main

import (
	"io"
)

func (s SpecialJudge) runSpecialJudge(lang LanguageDefinition, submissionOut io.Reader, inFilePath, outFilePath string) (RunResult, error) {
	config := RunConfig{
		stdin:          submissionOut,
		stdout:         nil,
		stderr:         nil,
		timeLimit:      3,
		memoryLimit:    1024 * 1024,
		dir:            SPECIAL_JUDGE_DIR,
		runCommandArgs: []string{inFilePath, outFilePath},
	}
	result, err := run(lang, config)
	if err != nil {
		return result, err
	}
	return result, nil
}
