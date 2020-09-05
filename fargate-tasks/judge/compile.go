package main

import (
	"io/ioutil"
	"os/exec"
	"path"
)

func compile(definition LanguageDefinition, code string) (bool, string, error) {
	var err error
	codePath := path.Join(TEMP_DIR, definition.Filename)
	if err = ioutil.WriteFile(codePath, []byte(code), 0400); err != nil {
		return false, "", err
	}
	if definition.CompileCommand == "" {
		return true, "", nil
	}
	cmd := exec.Command("bash", "-c", definition.CompileCommand)
	cmd.Dir = TEMP_DIR
	_, err = cmd.Output()
	res, exist := err.(*exec.ExitError)
	if !exist {
		return false, "", err
	}
	stderr := string(res.Stderr)
	if res.ExitCode() == 0 {
		return true, stderr, nil
	}
	return false, stderr, nil
}
