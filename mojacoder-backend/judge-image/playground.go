package main

import "strings"

const PLAYGROUND_TIME_LIMIT = 2
const PLAYGROUND_MEMORY_LIMIT = 131072 // 128 MB

func testCode(definition LanguageDefinition, data JudgeQueueData) error {
	var err error
	var stdout, stderr strings.Builder
	config := RunConfig{
		stdin:          strings.NewReader(data.Stdin),
		stdout:         &stdout,
		stderr:         &stderr,
		timeLimit:      PLAYGROUND_TIME_LIMIT,
		memoryLimit:    PLAYGROUND_MEMORY_LIMIT,
		dir:            TEMP_DIR,
		runCommandArgs: []string{},
	}
	result, err := run(definition, config)
	if err != nil {
		return err
	}
	err = responsePlayground(data.SessionID, data.UserID, result.exitCode, result.time, result.memory, stdout.String(), stderr.String())
	if err != nil {
		return err
	}
	return nil
}
