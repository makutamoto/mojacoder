package main

import (
	"log"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/guregu/dynamo"
)

const TEMP_DIR = "/tmp/mojacoder-judge/"
const CHILD_UID, CHILD_GID = 400, 400

const LANGUAGE_DEFINITION_FILE = "./language-definition.json"

func judge(submissionType string, submissionID string) error {
	var err error
	definitions, err := loadLanguageDefinition(LANGUAGE_DEFINITION_FILE)
	if err != nil {
		return err
	}
	err = testCode(definitions, submissionID)
	if err != nil {
		return err
	}
	return nil
}

func main() {
	session := session.New()
	config := &aws.Config{Region: aws.String("ap-northeast-1")}
	judgeQueue = sqs.New(session, config)
	dynamodb = dynamo.New(session, config)
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
		log.Println(message.data.Type, message.data.SubmissionID)
		err = judge(message.data.Type, message.data.SubmissionID)
		if err != nil {
			log.Println(err)
			// IE
		}
		deleteJudgeQueueMessage(message.message)
	}
}
