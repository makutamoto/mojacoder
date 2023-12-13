package main

import (
	"os"
	"os/exec"
)

func compile(definition LanguageDefinition, dir string) (bool, string, error) {
	var err error
	if definition.CompileCommand == "" {
		return true, "", nil
	}
	cmd := exec.Command("bash", "-c", definition.CompileCommand)
	cmd.Env = []string{
		"PATH=" + os.Getenv("PATH"),
		"HOME=" + os.Getenv("HOME"),
	}
	cmd.Dir = dir
	_, err = cmd.Output()
	res, exist := err.(*exec.ExitError)
	if exist {
		stderr := string(res.Stderr)
		return false, stderr, nil
	}
	return true, "", nil
}
