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
	ID           string `json:"id"`
	Judged       bool   `json:"judged"`
	TestcaseName string `json:"testcaseName"`
	Status       string `json:"status"`
}

func updateSubmissionStatus(id string, judged bool, testcaseName string, status string) error {
	variables := make(map[string]interface{})
	query := `
		mutation UpdateSubmissionStatus($input: UpdateSubmissionStatusInput!) {
			updateSubmissionStatus(input: $input) {
				id
				judged
				testcaseName
				status
			}
		}
	`
	variables["input"] = UpdateSubmissionStatusInput{id, judged, testcaseName, status}
	err := requestGraphql(query, variables)
	return err
}

func judge(definition LanguageDefinition, data JudgeQueueData) error {
	const errorMessage = "Failed to judge a submission: %v"
	var err error
	testcasesPath := filepath.Join(TEMP_DIR, "testcases")
	testcasesZipPath := testcasesPath + ".zip"
	err = downloadFromStorage(testcasesZipPath, TESTCASES_BUCKET_NAME, data.ProblemID)
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
	for _, inTestcase := range inTestcases {
		if inTestcase.IsDir() {
			continue
		}
		log.Printf("Judging %s...", inTestcase.Name())
		inTestcaseFilePath := filepath.Join(inPath, inTestcase.Name())
		inTestcaseFile, err := os.Open(inTestcaseFilePath)
		if err != nil {
			return fmt.Errorf(errorMessage, err)
		}
		outTestcaseFilePath := filepath.Join(outPath, inTestcase.Name())
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
			updateSubmissionStatus(data.ID, false, inTestcase.Name(), "AC")
		} else {
			updateSubmissionStatus(data.ID, false, inTestcase.Name(), "WA")
		}
	}
	return nil
}
