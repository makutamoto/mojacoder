package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

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
var JUDGECODES_BUCKET_NAME = os.Getenv("JUDGECODES_BUCKET_NAME")

const TEMP_DIR = "/tmp/mojacoder-judge/"
const SPECIAL_JUDGE_DIR = "/tmp/mojacoder-judge-special/"
const CHILD_UID, CHILD_GID = 400, 400

const LANGUAGE_DEFINITION_FILE = "./language-definition.json"
const SPECIAL_JUDGE_LANGS_FILE = "./special-judge-langs.json"

func initDirectory() error {
	var err error
	err = os.RemoveAll(TEMP_DIR)
	if err != nil {
		return err
	}
	err = os.RemoveAll(SPECIAL_JUDGE_DIR)
	if err != nil {
		return err
	}

	err = os.MkdirAll(TEMP_DIR, 0755)
	if err != nil {
		return err
	}
	err = os.MkdirAll(SPECIAL_JUDGE_DIR, 0755)
	if err != nil {
		return err
	}
	return nil
}

func processCode(definitions map[string]LanguageDefinition, data JudgeQueueData, spjudgelangs map[string]SpecialJudgeLang) error {
	const errorMessage = "failed to process a code: %v"
	var err error
	err = initDirectory()
	definition, exist := definitions[data.Lang]
	if !exist {
		return fmt.Errorf("language not found: %s", data.Lang)
	}

	switch data.Type {
	case "PLAYGROUND":
		log.Printf("Downloading code for playground: %s", data.SessionID)
		err = downloadFromStorage(filepath.Join(TEMP_DIR, definition.Filename), PLAYGROUND_CODE_BUCKET_NAME, data.SessionID)
	case "SUBMISSION":
		log.Printf("Downloading code for submission: %s", data.SubmissionID)
		err = downloadFromStorage(filepath.Join(TEMP_DIR, definition.Filename), SUBMITTED_CODE_BUCKET_NAME, data.SubmissionID)
	}
	if err != nil {
		return fmt.Errorf(errorMessage, err)
	}

	var compiled bool
	var stderr string
	compiled, stderr, err = compile(definition, TEMP_DIR)

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
		log.Printf("Getting judge type problem ID '%s'...", data.ProblemID)
		judgeType, err := getJudgeType(data.ProblemID, spjudgelangs, definitions)
		if err != nil {
			return fmt.Errorf(errorMessage, err)
		}
		if jt, ok := judgeType.(SpecialJudge); ok {
			log.Printf("Downloading special judge code for submission: %s\n", data.SubmissionID)
			lang := jt.lang
			err = downloadFromStorage(filepath.Join(SPECIAL_JUDGE_DIR, lang.Filename), JUDGECODES_BUCKET_NAME, data.ProblemID)
			if err != nil {
				return fmt.Errorf(errorMessage, err)
			}
			compiled, stderr, err = compile(lang, SPECIAL_JUDGE_DIR)
			if err != nil {
				return fmt.Errorf(errorMessage, err)
			}
			if !compiled {
				err = updateSubmission(data.SubmissionID, data.UserID, "JCE", nil, nil)
				log.Println("Special Judge Compile Error: " + stderr)
				if err != nil {
					return fmt.Errorf(errorMessage, err)
				}
				return nil
			}
		}

		err = updateSubmission(data.SubmissionID, data.UserID, "WJ", &stderr, nil)
		if err != nil {
			return fmt.Errorf(errorMessage, err)
		}
		err = judge(definition, data, judgeType)
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
	spJudgeDefinitons, err := loadSpecialJudgeLangs(SPECIAL_JUDGE_LANGS_FILE)
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
		err = processCode(definitions, message.data, spJudgeDefinitons)
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
