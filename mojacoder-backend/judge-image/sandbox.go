package main

import (
	"fmt"
	"os/exec"
	"strings"
)

const SANDBOX_BINARY = "/usr/local/bin/mojacoder-sandbox"

func sandboxedCommand(command string, args ...string) *exec.Cmd {
	sandboxArgs := make([]string, 0, len(args)+1)
	sandboxArgs = append(sandboxArgs, command)
	sandboxArgs = append(sandboxArgs, args...)
	return exec.Command(SANDBOX_BINARY, sandboxArgs...)
}

func verifySandbox() error {
	output, err := exec.Command(SANDBOX_BINARY, "--self-test").CombinedOutput()
	if err != nil {
		return fmt.Errorf("sandbox self-test failed: %w: %s", err, strings.TrimSpace(string(output)))
	}
	return nil
}
