package main

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/guregu/dynamo"
)

type CodeTestSubmission struct {
	Lang  string `dynamo:"lang"`
	Code  string `dynamo:"code"`
	Stdin string `dynamo:"stdin"`
}

const CODETEST_TIMELIMIT = 2000

func testCode(definitions map[string]LanguageDefinition, username string, submissionID int) error {
	var err error
	db := dynamo.New(session.New(), &aws.Config{
		Region: aws.String("ap-northeast-1"),
	})
	table := db.Table("submissions")
	var submission CodeTestSubmission
	err = table.Get("userID", username).Range("submissionID", dynamo.Equal, submissionID).One(&submission)
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
		table.Update("userID", username).Range("submissionID", submissionID).Set("stderr", stderr).Run()
		return nil
	}
	result, err := run(definition, submission.Stdin, CODETEST_TIMELIMIT)
	if err != nil {
		return err
	}
	err = table.Update("userID", username).Range("submissionID", submissionID).Set("stdout", string(result.stdout)).Run()
	if err != nil {
		return err
	}
	return nil
}
