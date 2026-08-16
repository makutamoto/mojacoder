package main

import (
	"fmt"
	"os/exec"
	"strings"
)

const SANDBOX_BINARY = "/usr/local/bin/mojacoder-sandbox"

func verifySandbox() error {
	output, err := exec.Command(SANDBOX_BINARY, "--self-test").CombinedOutput()
	if err != nil {
		return fmt.Errorf("sandbox self-test failed: %w: %s", err, strings.TrimSpace(string(output)))
	}
	return nil
}
