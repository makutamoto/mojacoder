package main

import (
	"encoding/json"
	"io/ioutil"
)

type LanguageDefinition struct {
	Filename       string `json:"filename"`
	CompileCommand string `json:"compileCommand"`
	RunCommand     string `json:"runCommand"`
}

func loadLanguageDefinition(file string) (map[string]LanguageDefinition, error) {
	var err error
	var definitions map[string]LanguageDefinition
	bytes, err := ioutil.ReadFile(file)
	if err != nil {
		return definitions, err
	}
	err = json.Unmarshal(bytes, &definitions)
	if err != nil {
		return definitions, err
	}
	return definitions, nil
}
