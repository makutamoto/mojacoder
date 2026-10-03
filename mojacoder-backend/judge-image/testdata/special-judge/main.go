package main

import (
	"fmt"
	"os"
)

func main() {
	in, err := os.Open(os.Args[1])
	if err != nil {
		panic(err)
	}
	defer in.Close()
	out, err := os.Open(os.Args[2])
	if err != nil {
		panic(err)
	}
	defer out.Close()
	var input, expected, actual int
	if _, err := fmt.Fscan(in, &input); err != nil {
		panic(err)
	}
	if _, err := fmt.Fscan(out, &expected); err != nil {
		panic(err)
	}
	if _, err := fmt.Scan(&actual); err != nil {
		panic(err)
	}
	if input+22 != expected || actual != expected {
		os.Exit(1)
	}
}
