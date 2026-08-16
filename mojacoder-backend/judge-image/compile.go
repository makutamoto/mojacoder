package main

import (
	"os/exec"
	"path/filepath"
)

func compile(definition LanguageDefinition, dir string) (compiled bool, stderr string, err error) {
	defer func() {
		if sealErr := sealSandboxDirectory(dir); sealErr != nil && err == nil {
			compiled = false
			err = sealErr
		}
	}()

	if definition.CompileCommand == "" {
		return true, "", nil
	}
	homeDir := filepath.Join(dir, ".home")
	if err := createSandboxDirectory(homeDir); err != nil {
		return false, "", err
	}
	command := definition.CompileCommand + "; EXIT_CODE=$?; kill -SIGKILL -1; wait; exit $EXIT_CODE"
	cmd := sandboxedCommand("bash", "-c", command)
	configureSandboxedCommand(cmd, homeDir)
	cmd.Dir = dir
	output, err := cmd.CombinedOutput()
	if err == nil {
		return true, "", nil
	}
	if _, ok := err.(*exec.ExitError); ok {
		return false, string(output), nil
	}
	return false, "", err
}
