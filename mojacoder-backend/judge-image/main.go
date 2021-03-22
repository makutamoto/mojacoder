package main

import (
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	v4 "github.com/aws/aws-sdk-go/aws/signer/v4"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/aws/aws-sdk-go/service/sqs"
)

var AWS_REGION = os.Getenv("AWS_REGION")
var API_ENDPOINT = os.Getenv("API_ENDPOINT")
var JUDGEQUEUE_URL = os.Getenv("JUDGEQUEUE_URL")
var PLAYGROUND_CODE_BUCKET_NAME = os.Getenv("PLAYGROUND_CODE_BUCKET_NAME")
var SUBMITTED_CODE_BUCKET_NAME = os.Getenv("SUBMITTED_CODE_BUCKET_NAME")
var TESTCASES_BUCKET_NAME = os.Getenv("TESTCASES_BUCKET_NAME")

const TEMP_DIR = "/tmp/mojacoder-judge/"
const CHILD_UID, CHILD_GID = 400, 400

const LANGUAGE_DEFINITION_FILE = "./language-definition.json"

func processCode(definitions map[string]LanguageDefinition, data JudgeQueueData) error {
	const errorMessage = "Failed to process a code: %v"
	var err error
	err = os.RemoveAll(TEMP_DIR)
	if err != nil {
		return fmt.Errorf(errorMessage, err)
	}
	err = os.MkdirAll(TEMP_DIR, 0755)
	if err != nil {
		return fmt.Errorf(errorMessage, err)
	}
	definition, exist := definitions[data.Lang]
	if !exist {
		return fmt.Errorf("Language not found: %s", data.Lang)
	}
	var compiled bool
	var stderr string
	switch data.Type {
	case "PLAYGROUND":
		log.Println("Compiling for Playground...")
		compiled, stderr, err = compile(definition, PLAYGROUND_CODE_BUCKET_NAME, data.SessionID)
	case "SUBMISSION":
		log.Println("Compiling for Submission...")
		compiled, stderr, err = compile(definition, SUBMITTED_CODE_BUCKET_NAME, data.SubmissionID)
	}
	if err != nil {
		return fmt.Errorf(errorMessage, err)
	}
	if !compiled {
		log.Printf("Compile Error: %s", stderr)
		switch data.Type {
		case "PLAYGROUND":
			err = responsePlayground(data.SessionID, data.UserID, -1, -1, -1, "", stderr)
		case "SUBMISSION":
			err = updateSubmission(data.SubmissionID, data.UserID, "CE", &stderr, nil)
		}
		if err != nil {
			return fmt.Errorf(errorMessage, err)
		}
		return nil
	}
	if data.Type == "PLAYGROUND" {
		err = testCode(definition, data)
		if err != nil {
			return fmt.Errorf(errorMessage, err)
		}
	} else if data.Type == "SUBMISSION" {
		err = updateSubmission(data.SubmissionID, data.UserID, "WJ", &stderr, nil)
		if err != nil {
			return fmt.Errorf(errorMessage, err)
		}
		err = judge(definition, data)
		if err != nil {
			return fmt.Errorf(errorMessage, err)
		}
	}
	return nil
}

func main() {
	health()
	session := session.New()
	config := &aws.Config{Region: aws.String(AWS_REGION)}
	judgeQueue = sqs.New(session, config)
	storage = s3.New(session, config)
	storageDownloader = s3manager.NewDownloader(session)
	signer = v4.NewSigner(session.Config.Credentials)
	definitions, err := loadLanguageDefinition(LANGUAGE_DEFINITION_FILE)
	if err != nil {
		log.Fatalln(err)
	}

	log.Println("Ready.")
	for true {
		var err error
		message, exist, err := receiveJudgeQueueMessage()
		if err != nil {
			if message.message != nil {
				deleteJudgeQueueMessage(message.message)
				log.Println(err)
			} else {
				log.Fatalln(err)
			}
		}
		if !exist {
			continue
		}
		log.Println(message.data)
		err = processCode(definitions, message.data)
		if err != nil {
			log.Println(err)
			if message.data.Type == "SUBMISSION" {
				err = updateSubmission(message.data.SubmissionID, message.data.UserID, "IE", nil, nil)
				if err != nil {
					log.Println(err)
				}
			}
			continue
		}
		log.Println("Done!")
		if message.data.Type == "PLAYGROUND" {
			err = deleteFromStorage(PLAYGROUND_CODE_BUCKET_NAME, message.data.SessionID)
			if err != nil {
				log.Println(err)
			}
		}
		deleteJudgeQueueMessage(message.message)
	}
}
