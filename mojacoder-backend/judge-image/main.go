package main

import (
	"log"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	v4 "github.com/aws/aws-sdk-go/aws/signer/v4"
	"github.com/aws/aws-sdk-go/service/sqs"
)

var AWS_REGION = os.Getenv("AWS_REGION")
var API_ENDPOINT = os.Getenv("API_ENDPOINT")
var JUDGEQUEUE_URL = os.Getenv("JUDGEQUEUE_URL")

const TEMP_DIR = "/tmp/mojacoder-judge/"
const CHILD_UID, CHILD_GID = 400, 400

const LANGUAGE_DEFINITION_FILE = "./language-definition.json"

func judge(definitions map[string]LanguageDefinition, data JudgeQueueData) error {
	var err error
	definition, exist := definitions[data.Lang]
	if !exist {
		return err
	}
	compiled, stderr, err := compile(definition, data.Code)
	if err != nil {
		return err
	}
	if !compiled {
		err = responsePlayground(data.SessionID, data.UserID, -1, -1, -1, "", stderr)
		return err
	}
	if data.Type == "PLAYGROUND" {
		err = testCode(definition, data)
		if err != nil {
			return err
		}
	}
	return nil
}

func main() {
	session := session.New()
	config := &aws.Config{Region: aws.String(AWS_REGION)}
	judgeQueue = sqs.New(session, config)
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
		err = judge(definitions, message.data)
		if err != nil {
			log.Println(err)
			// IE
		}
		deleteJudgeQueueMessage(message.message)
	}
}
