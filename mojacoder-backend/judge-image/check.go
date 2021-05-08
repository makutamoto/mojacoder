package main

import (
	"bufio"
	"fmt"
	"io"
	"math"
	"strconv"
)

const CHECK_SCANNER_BUFFER_SIZE = 1024 * 1024

func compareValue(answer string, solution string, accuracy float64) bool {
	_, err := strconv.Atoi(solution)
	if err == nil || err.(*strconv.NumError).Err == strconv.ErrRange {
		return answer == solution
	}
	numberC, err := strconv.ParseFloat(solution, 64)
	if err == nil {
		numberA, err := strconv.ParseFloat(answer, 64)
		if err == nil {
			if math.IsInf(numberC, 0) {
				return (math.IsInf(numberA, 1) && math.IsInf(numberC, 1)) || (math.IsInf(numberA, -1) && math.IsInf(numberC, -1))
			} else if math.IsNaN(numberC) {
				return math.IsNaN(numberA)
			} else {
				return math.Abs(numberC-numberA) <= math.Abs(accuracy*numberC)
			}
		} else {
			return false
		}
	}
	return answer == solution
}

func check(answer, solution io.Reader, accuracy float64) (bool, error) {
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
		} else if !compareValue(answerScanner.Text(), solutionScanner.Text(), accuracy) {
			return false, nil
		}
	}
	if answerScan != testScan {
		return false, nil
	}
	return true, nil
}
