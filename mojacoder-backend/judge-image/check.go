package main

import (
	"bufio"
	"fmt"
	"io"
	"math/big"
	"regexp"
	"strconv"
)

const CHECK_SCANNER_BUFFER_SIZE = 1024 * 1024

type NormalJudge struct{}

func (n NormalJudge) isJudgeType() {}

func isValidDecimal(s string) bool {
	re := regexp.MustCompile(`^-?\d+(\.\d+)?$`)
	return re.MatchString(s)
}

func compareValue(answer string, solution string, accuracy *big.Float, precision uint) bool {
	_, err := strconv.Atoi(solution)
	if err == nil || err.(*strconv.NumError).Err == strconv.ErrRange {
		return answer == solution
	}

	if !isValidDecimal(solution) {
		return answer == solution
	}

	if !isValidDecimal(answer) {
		return false
	}

	numberS, _, _ := big.ParseFloat(solution, 10, precision, big.ToNearestEven)
	numberA, _, _ := big.ParseFloat(answer, 10, precision, big.ToNearestEven)

	diff := new(big.Float).Sub(numberS, numberA)
	absDiff := new(big.Float).Abs(diff)

	accuracyTimesS := new(big.Float).Mul(accuracy, numberS)
	absAccuracyTimesS := new(big.Float).Abs(accuracyTimesS)

	isOkAbsolute := absDiff.Cmp(accuracy) <= 0
	isOkRelative := absDiff.Cmp(absAccuracyTimesS) <= 0

	return isOkAbsolute || isOkRelative
}

func (n NormalJudge) check(answer, solution io.Reader, accuracy *big.Float, precision uint) (bool, error) {
	const errorMessage = "Failed to check an answer: %v"
	var err error
	var testScan, answerScan bool
	answerScanner := bufio.NewScanner(answer)
	answerScanner.Buffer(make([]byte, CHECK_SCANNER_BUFFER_SIZE), CHECK_SCANNER_BUFFER_SIZE)
	answerScanner.Split(bufio.ScanWords)
	solutionScanner := bufio.NewScanner(solution)
	solutionScanner.Buffer(make([]byte, CHECK_SCANNER_BUFFER_SIZE), CHECK_SCANNER_BUFFER_SIZE)
	solutionScanner.Split(bufio.ScanWords)
	for {
		answerScan = answerScanner.Scan()
		testScan = solutionScanner.Scan()
		if !answerScan || !testScan {
			if err = answerScanner.Err(); err != nil {
				return false, fmt.Errorf(errorMessage, err)
			}
			if err = solutionScanner.Err(); err != nil {
				return false, fmt.Errorf(errorMessage, err)
			}
			break
		} else if !compareValue(answerScanner.Text(), solutionScanner.Text(), accuracy, precision) {
			return false, nil
		}
	}
	if answerScan != testScan {
		return false, nil
	}
	return true, nil
}
