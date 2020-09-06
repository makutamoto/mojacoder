package main

import (
	"log"
)

const TEMP_DIR = "/tmp/mojacoder-judge/"
const CHILD_UID, CHILD_GID = 400, 400

const LANGUAGE_DEFINITION_FILE = "./language-definition.json"

func judge(username string, submissionID int) error {
	var err error
	definitions, err := loadLanguageDefinition(LANGUAGE_DEFINITION_FILE)
	if err != nil {
		return err
	}
	err = testCode(definitions, username, submissionID)
	if err != nil {
		return err
	}
	return nil
}

func main() {
	err := judge("Makutamoto", 0)
	if err != nil {
		log.Println(err)
		// IE
	}
}
