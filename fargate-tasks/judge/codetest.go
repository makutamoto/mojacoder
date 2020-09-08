package main

import (
	"github.com/guregu/dynamo"
)

type CodeTestSubmission struct {
	Lang  string `dynamo:"lang"`
	Code  string `dynamo:"code"`
	Stdin string `dynamo:"stdin"`
}

const CODETEST_TIME_LIMIT = 2
const CODETEST_MEMORY_LIMIT = 131072 // 128 MB

var dynamodb *dynamo.DB

func testCode(definitions map[string]LanguageDefinition, submissionID string) error {
	var err error
	table := dynamodb.Table("SubmissionsTable")
	var submission CodeTestSubmission
	err = table.Get("submissionID", submissionID).One(&submission)
	if err != nil {
		return err
	}
	definition, exist := definitions[submission.Lang]
	if !exist {
		return err
	}
	compiled, stderr, err := compile(definition, submission.Code)
	if err != nil {
		return err
	}
	if !compiled {
		table.Update("submissionID", submissionID).Set("stderr", stderr).Run()
		return nil
	}
	result, err := run(definition, submission.Stdin, CODETEST_TIME_LIMIT, CODETEST_MEMORY_LIMIT)
	if err != nil {
		return err
	}
	err = table.Update("submissionID", submissionID).Set("stdout", string(result.stdout)).Run()
	if err != nil {
		return err
	}
	return nil
}
