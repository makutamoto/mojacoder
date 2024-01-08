package main

import (
	"bufio"
	"io/fs"
	"math/big"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

func TestCompareValueWithFiles(t *testing.T) {
	err := filepath.Walk("./check_testcases", func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() && strings.HasSuffix(info.Name(), ".txt") {
			testFile(t, path)
		}

		return nil
	})

	if err != nil {
		t.Fatalf("Failed to walk through check_testcases directory: %v", err)
	}
}

func testFile(t *testing.T, filePath string) {
	file, err := os.Open(filePath)
	if err != nil {
		t.Fatalf("Failed to open file: %s, error: %v", filePath, err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.Split(line, " ")
		if len(parts) != 3 {
			t.Fatalf("Invalid test case in file %s: %s", filePath, line)
		}

		answer, solution, expectedStr := parts[0], parts[1], parts[2]
		expected, err := strconv.ParseBool(expectedStr)
		if err != nil {
			t.Fatalf("Invalid expected value in file %s: %s", filePath, expectedStr)
		}

		accuracy, _, _ := big.ParseFloat("0.000001", 10, PRECISION, big.ToNearestEven)
		result := compareValue(answer, solution, accuracy, PRECISION)

		if result != expected {
			t.Errorf("In file %s, compareValue(%s, %s) = %v; expected %v", filePath, answer, solution, result, expected)
		}
	}

	if err := scanner.Err(); err != nil {
		t.Fatalf("Error reading file %s: %v", filePath, err)
	}
}
