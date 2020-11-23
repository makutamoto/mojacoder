package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
)

type UpdateSubmissionStatusInput struct {
	ID        string             `json:"id"`
	Status    string             `json:"status"`
	Stderr    *string            `json:"stderr"`
	Testcases *map[string]string `json:"testcases"`
}

func updateSubmission(id string, status string, stderr *string, testcases *map[string]string) error {
	variables := make(map[string]interface{})
	query := `
		mutation UpdateSubmissionStatus($input: UpdateSubmissionStatusInput!) {
			updateSubmissionStatus(input: $input) {
				id
				status
				stderr
				testcases {
					name
					status
				}
			}
		}
	`
	variables["input"] = UpdateSubmissionStatusInput{id, status, stderr, testcases}
	err := requestGraphql(query, variables)
	return err
}

func judge(definition LanguageDefinition, data JudgeQueueData) error {
	const errorMessage = "Failed to judge a submission: %v"
	var err error
	testcasesPath := filepath.Join(TEMP_DIR, "testcases")
	testcasesZipPath := testcasesPath + ".zip"
	err = downloadFromStorage(testcasesZipPath, TESTCASES_BUCKET_NAME, data.ProblemID+".zip")
	if err != nil {
		return fmt.Errorf(errorMessage, err)
	}
	err = unzip(testcasesZipPath, testcasesPath)
	if err != nil {
		return fmt.Errorf(errorMessage, err)
	}
	inPath := filepath.Join(testcasesPath, "in")
	outPath := filepath.Join(testcasesPath, "out")
	inTestcases, err := ioutil.ReadDir(inPath)
	if err != nil {
		return fmt.Errorf(errorMessage, err)
	}
	testcases := make(map[string]string)
	for _, inTestcase := range inTestcases {
		if inTestcase.IsDir() {
			continue
		}
		testcases[inTestcase.Name()] = "WJ"
	}
	for _, testcase := range testcases {
		log.Printf("Judging %s...", testcase)
		inTestcaseFilePath := filepath.Join(inPath, testcase)
		inTestcaseFile, err := os.Open(inTestcaseFilePath)
		if err != nil {
			return fmt.Errorf(errorMessage, err)
		}
		outTestcaseFilePath := filepath.Join(outPath, testcase)
		outTestcaseFile, err := os.Open(outTestcaseFilePath)
		if err != nil {
			return fmt.Errorf(errorMessage, err)
		}
		stdoutWriter := strings.Builder{}
		_, err = run(definition, inTestcaseFile, &stdoutWriter, nil, 2, 1024)
		if err != nil {
			return fmt.Errorf(errorMessage, err)
		}
		stdoutReader := strings.NewReader(stdoutWriter.String())
		if check(stdoutReader, outTestcaseFile, 0) {
			log.Println("AC")
			testcases[testcase] = "AC"
			err = updateSubmission(data.SubmissionID, "WJ", nil, &testcases)
			if err != nil {
				return fmt.Errorf(errorMessage, err)
			}
		} else {
			log.Println("WA")
			testcases[testcase] = "WA"
			err = updateSubmission(data.SubmissionID, "WJ", nil, &testcases)
			if err != nil {
				return fmt.Errorf(errorMessage, err)
			}
		}
	}
	err = updateSubmission(data.SubmissionID, "JUDGED", nil, nil)
	if err != nil {
		return fmt.Errorf(errorMessage, err)
	}
	return nil
}
