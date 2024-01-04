package main

import (
	"fmt"
	"io/fs"
	"log"
	"math/big"
	"os"
	"path/filepath"
	"strings"
)

const PRECISION = 128

type TestcaseResultInput struct {
	Name   string `json:"name"`
	Status string `json:"status"`
	Time   int    `json:"time"`
	Memory int    `json:"memory"`
}

type UpdateSubmissionStatusInput struct {
	ID        string                 `json:"id"`
	UserID    string                 `json:"userID"`
	Status    string                 `json:"status"`
	Stderr    *string                `json:"stderr"`
	Testcases *[]TestcaseResultInput `json:"testcases"`
}

type JudgeType interface {
	isJudgeType()
}

type SpecialJudge struct {
	lang LanguageDefinition
}

func (s SpecialJudge) isJudgeType() {}

type ProblemResponse struct {
	Problem struct {
		JudgeType string `json:"judgeType"`
		JudgeLang string `json:"judgeLang"`
	} `json:"problem"`
}

func getJudgeType(problemID string, spjudgelangs map[string]SpecialJudgeLang, definitions map[string]LanguageDefinition) (JudgeType, error) {
	query := `
		query GetJudgeType($problemID: ID!) {
			problem(id: $problemID) {
				judgeType
				judgeLang
			}
		}
	`
	var responseData ProblemResponse
	variables := make(map[string]interface{})
	variables["problemID"] = problemID
	err := requestGraphql(query, variables, &responseData)
	log.Println("responsData: &s", responseData)
	if err != nil {
		return nil, err
	}
	switch responseData.Problem.JudgeType {
	case "NORMAL":
		return NormalJudge{}, nil
	case "SPECIAL":
		lang, exist := spjudgelangs[responseData.Problem.JudgeLang]
		if !exist {
			return nil, fmt.Errorf("special judge lang not found: %s", responseData.Problem.JudgeLang)
		}
		definition, exist := definitions[lang.Id]
		if !exist {
			return nil, fmt.Errorf("special judge language not found: %s", lang.Id)
		}
		return SpecialJudge{definition}, nil
	default:
		return nil, fmt.Errorf("unknown judgeType '%s'", responseData.Problem.JudgeType)
	}
}

func updateSubmission(id string, userID string, status string, stderr *string, testcases *[]TestcaseResultInput) error {
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
	err := requestGraphql(query, variables, nil)
	return err
}

func setTestcasePermisson(testcasesPath string) error {
	inPath := filepath.Join(testcasesPath, "in")
	outPath := filepath.Join(testcasesPath, "out")

	if err := setFilesPermissionInDir(inPath, 0744); err != nil {
		return err
	}
	if err := setFilesPermissionInDir(outPath, 0744); err != nil {
		return err
	}

	return nil
}

func setFilesPermissionInDir(path string, perm fs.FileMode) error {
	entries, err := os.ReadDir(path)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if err := os.Chmod(filepath.Join(path, entry.Name()), perm); err != nil {
			return err
		}
	}
	return nil
}

func allowAccessTestcases(testcasesPath string) error {
	if err := os.Chmod(testcasesPath, 0775); err != nil {
		return err
	}
	return nil
}

func disallowAccessTestcases(testcasesPath string) error {
	if err := os.Chmod(testcasesPath, 0770); err != nil {
		return err
	}
	return nil
}

func judge(definition LanguageDefinition, data JudgeQueueData, jType JudgeType) error {
	const errorMessage = "failed to judge a submission: %v"
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
	os.MkdirAll(inPath, 0775)
	os.Chmod(inPath, 0775)
	os.Chmod(outPath, 0775)
	inTestcases, err := os.ReadDir(inPath)
	if err != nil {
		return fmt.Errorf(errorMessage, err)
	}
	testcases := []TestcaseResultInput{}
	for _, inTestcase := range inTestcases {
		if inTestcase.IsDir() {
			continue
		}
		testcases = append(testcases, TestcaseResultInput{inTestcase.Name(), "WJ", -1, -1})
	}

	setTestcasePermisson(testcasesPath)
testCasesLoop:
	for i := range testcases {
		log.Printf("Judging %s...", testcases[i].Name)
		inTestcaseFilePath := filepath.Join(inPath, testcases[i].Name)
		inTestcaseFile, err := os.Open(inTestcaseFilePath)
		if err != nil {
			return fmt.Errorf(errorMessage, err)
		}
		disallowAccessTestcases(testcasesPath)
		outTestcaseFilePath := filepath.Join(outPath, testcases[i].Name)
		stdoutWriter := strings.Builder{}
		config := RunConfig{
			stdin:          inTestcaseFile,
			stdout:         &stdoutWriter,
			stderr:         nil,
			timeLimit:      2,
			memoryLimit:    1024 * 1024,
			dir:            TEMP_DIR,
			runCommandArgs: []string{},
		}
		result, err := run(definition, config)
		inTestcaseFile.Close()
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
			log.Println(testcases[i].Status)
			err = updateSubmission(data.SubmissionID, data.UserID, "WJ", nil, &testcases)
			if err != nil {
				return fmt.Errorf(errorMessage, err)
			}
			if result.status == RunResultStatusTimeLimitExceeded {
				break
			}
			continue
		}
		stdoutReader := strings.NewReader(stdoutWriter.String())

		switch jt := jType.(type) {
		case SpecialJudge:
			log.Printf("run special judge for testcase: %s", testcases[i].Name)
			allowAccessTestcases(testcasesPath)
			result, err := jt.runSpecialJudge(jt.lang, stdoutReader, inTestcaseFilePath, outTestcaseFilePath)
			if err != nil {
				return fmt.Errorf(errorMessage, err)
			}
			switch result.status {
			case RunResultStatusSuccess:
				testcases[i].Status = "AC"
			case RunResultStatusTimeLimitExceeded:
				testcases[i].Status = "JTLE"
			case RunResultStatusMemoryLimitExceeded:
				testcases[i].Status = "JMLE"
			case RunResultStatusRunTimeError:
				testcases[i].Status = "WA" // ジャッジプログラムの実行エラーはWAとする
			}

			log.Println(testcases[i].Status)
			err = updateSubmission(data.SubmissionID, data.UserID, "WJ", nil, &testcases)
			if err != nil {
				return fmt.Errorf(errorMessage, err)
			}
			if result.status == RunResultStatusTimeLimitExceeded {
				break testCasesLoop
			}
		case NormalJudge:
			log.Println("run normal judge")
			outTestcaseFile, err := os.Open(outTestcaseFilePath)
			if err != nil {
				return fmt.Errorf(errorMessage, err)
			}
			accuracy, _, _ := big.ParseFloat("0.000001", 10, PRECISION, big.ToNearestEven)
			checkResult, err := jt.check(stdoutReader, outTestcaseFile, accuracy, PRECISION)
			if err != nil {
				return fmt.Errorf(errorMessage, err)
			}
			if checkResult {
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
		default:
			return fmt.Errorf("unknown judgeType")
		}

	}
	err = updateSubmission(data.SubmissionID, data.UserID, "JUDGED", nil, nil)
	if err != nil {
		return fmt.Errorf(errorMessage, err)
	}
	return nil
}
