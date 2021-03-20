package main

import (
	"os"
	"os/exec"
	"path/filepath"
)

func compile(definition LanguageDefinition, bucket, key string) (bool, string, error) {
	var err error
	codePath := filepath.Join(TEMP_DIR, definition.Filename)
	err = downloadFromStorage(codePath, bucket, key)
	if err != nil {
		return false, "", err
	}
	if definition.CompileCommand == "" {
		return true, "", nil
	}
	cmd := exec.Command("bash", "-c", definition.CompileCommand)
	cmd.Env = []string{
		"PATH=" + os.Getenv("PATH"),
		"HOME=" + os.Getenv("HOME"),
	}
	cmd.Dir = TEMP_DIR
	_, err = cmd.Output()
	res, exist := err.(*exec.ExitError)
	if exist {
		stderr := string(res.Stderr)
		return false, stderr, nil
	}
	return true, "", nil
}
