package main

const CODETEST_TIME_LIMIT = 2
const CODETEST_MEMORY_LIMIT = 131072 // 128 MB

func testCode(definition LanguageDefinition, data JudgeQueueData) error {
	var err error
	result, err := run(definition, data.Stdin, CODETEST_TIME_LIMIT, CODETEST_MEMORY_LIMIT)
	if err != nil {
		return err
	}
	err = responseCodetest(data.ID, data.UserID, result.exitCode, result.time, result.memory, string(result.stdout), "")
	if err != nil {
		return err
	}
	return nil
}
