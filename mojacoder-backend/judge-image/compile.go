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
	_, err = cmd.Output()
	if err == nil {
		return true, "", nil
	}
	if res, ok := err.(*exec.ExitError); ok {
		stderr := string(res.Stderr)
		return false, stderr, nil
	}
	return false, "", err
}
