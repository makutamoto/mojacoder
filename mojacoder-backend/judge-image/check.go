package main

import (
	"bufio"
	"io"
	"math"
	"strconv"
)

func compareValue(answer string, solution string, accuracy float64) bool {
	integerC, err := strconv.Atoi(solution)
	if err == nil {
		integerA, err := strconv.Atoi(answer)
		return err == nil && integerC == integerA
	}
	numberC, err := strconv.ParseFloat(solution, 64)
	if err == nil {
		numberA, err := strconv.ParseFloat(solution, 64)
		return err == nil && math.Abs((numberC-numberA)/numberC) <= accuracy
	}
	return answer == solution
}

func check(answer, solution io.Reader, accuracy float64) bool {
	var testScan, answerScan bool
	answerScanner := bufio.NewScanner(answer)
	answerScanner.Split(bufio.ScanWords)
	solutionScanner := bufio.NewScanner(solution)
	solutionScanner.Split(bufio.ScanWords)
	for {
		answerScan = answerScanner.Scan()
		testScan = solutionScanner.Scan()
		if !answerScan || !testScan {
			break
		} else if !compareValue(solutionScanner.Text(), answerScanner.Text(), accuracy) {
			return false
		}
	}
	if answerScan != testScan {
		return false
	}
	return true
}
