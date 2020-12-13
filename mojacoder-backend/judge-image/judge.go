package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
)

type TestcaseInput struct {
	Name   string `json:"name"`
	Status string `json:"status"`
	Time   int    `json:"time"`
	Memory int    `json:"memory"`
}

type UpdateSubmissionStatusInput struct {
	ID        string           `json:"id"`
	UserID    string           `json:"userID"`
	Status    string           `json:"status"`
	Stderr    *string          `json:"stderr"`
	Testcases *[]TestcaseInput `json:"testcases"`
}

func updateSubmission(id string, userID string, status string, stderr *string, testcases *[]TestcaseInput) error {
	variables := make(map[string]interface{})
	query := `
		mutation UpdateSubmission($input: UpdateSubmissionInput!) {
			updateSubmission(input: $input) {
				id
				userID
				status
				stderr
				testcases {
					name
					status
				}
			}
		}
	`
	variables["input"] = UpdateSubmissionStatusInput{id, userID, status, stderr, testcases}
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
	testcases := []TestcaseInput{}
	for _, inTestcase := range inTestcases {
		if inTestcase.IsDir() {
			continue
		}
		testcases = append(testcases, TestcaseInput{inTestcase.Name(), "WJ", -1, -1})
	}
	for i := range testcases {
		log.Printf("Judging %s...", testcases[i].Name)
		inTestcaseFilePath := filepath.Join(inPath, testcases[i].Name)
		inTestcaseFile, err := os.Open(inTestcaseFilePath)
		if err != nil {
			return fmt.Errorf(errorMessage, err)
		}
		outTestcaseFilePath := filepath.Join(outPath, testcases[i].Name)
		outTestcaseFile, err := os.Open(outTestcaseFilePath)
		if err != nil {
			return fmt.Errorf(errorMessage, err)
		}
		stdoutWriter := strings.Builder{}
		result, err := run(definition, inTestcaseFile, &stdoutWriter, nil, 2, 1024)
		if err != nil {
			return fmt.Errorf(errorMessage, err)
		}
		testcases[i].Time = result.time
		testcases[i].Memory = result.memory
		if result.status != RunResultStatusSuccess {
			switch result.status {
			case RunResultStatusTimeLimitExceeded:
				testcases[i].Status = "TLE"
			case RunResultStatusMemoryLimitExceeded:
				testcases[i].Status = "MLE"
			case RunResultStatusRunTimeError:
				testcases[i].Status = "RE"
			}
			updateSubmission(data.SubmissionID, data.UserID, "WJ", nil, &testcases)
			continue
		}
		stdoutReader := strings.NewReader(stdoutWriter.String())
		if check(stdoutReader, outTestcaseFile, 0) {
			log.Println("AC")
			testcases[i].Status = "AC"
			err = updateSubmission(data.SubmissionID, data.UserID, "WJ", nil, &testcases)
			if err != nil {
				return fmt.Errorf(errorMessage, err)
			}
		} else {
			log.Println("WA")
			testcases[i].Status = "WA"
			err = updateSubmission(data.SubmissionID, data.UserID, "WJ", nil, &testcases)
			if err != nil {
				return fmt.Errorf(errorMessage, err)
			}
		}
	}
	err = updateSubmission(data.SubmissionID, data.UserID, "JUDGED", nil, nil)
	if err != nil {
		return fmt.Errorf(errorMessage, err)
	}
	return nil
}
