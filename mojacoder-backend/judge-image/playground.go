package main

const PLAYGROUND_TIME_LIMIT = 2
const PLAYGROUND_MEMORY_LIMIT = 131072 // 128 MB

func testCode(definition LanguageDefinition, data JudgeQueueData) error {
	var err error
	result, err := run(definition, data.Stdin, PLAYGROUND_TIME_LIMIT, PLAYGROUND_MEMORY_LIMIT)
	if err != nil {
		return err
	}
	err = responsePlayground(data.SessionID, data.UserID, result.exitCode, result.time, result.memory, string(result.stdout), "")
	if err != nil {
		return err
	}
	return nil
}
