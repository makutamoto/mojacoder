package main

// import (
// 	"bufio"
// 	"bytes"
// 	"math"
// 	"strconv"
// 	"strings"
// )

// func compareValue(test string, answer string, accuracy float64) bool {
// 	integerC, err := strconv.Atoi(test)
// 	if err == nil {
// 		integerA, err := strconv.Atoi(answer)
// 		return err == nil && integerC == integerA
// 	}
// 	numberC, err := strconv.ParseFloat(test, 64)
// 	if err == nil {
// 		numberA, err := strconv.ParseFloat(test, 64)
// 		return err == nil && math.Abs((numberC-numberA)/numberC) <= accuracy
// 	}
// 	return test == answer
// }

// func check() {
// 	var testScan, answerScan bool
// 	if result == resultTimeLimitExceeded {
// 		return result, execTime, memory
// 	}
// 	scannerOut := bufio.NewScanner(bytes.NewReader(stdout.Bytes()))
// 	scannerOut.Split(bufio.ScanWords)
// 	scannerTest := bufio.NewScanner(strings.NewReader(testOut))
// 	scannerTest.Split(bufio.ScanWords)
// 	for {
// 		answerScan = scannerOut.Scan()
// 		testScan = scannerTest.Scan()
// 		if !answerScan || !testScan {
// 			break
// 		} else if !compareValue(scannerTest.Text(), scannerOut.Text(), accuracy) {
// 			result.update(resultWrongAnswer)
// 			break
// 		}
// 	}
// 	if answerScan != testScan {
// 		result.update(resultWrongAnswer)
// 	}
// }
