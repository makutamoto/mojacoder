package main

import (
	"io/ioutil"
	"os"
	"os/exec"
	"path"
)

func compile(definition LanguageDefinition, code string) (bool, string, error) {
	var err error
	codePath := path.Join(TEMP_DIR, definition.Filename)
	if err = ioutil.WriteFile(codePath, []byte(code), 0600); err != nil {
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
