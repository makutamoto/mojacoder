package main

import (
	"log"
)

type LanguageDefinition struct {
	Name           string `json:"name"`
	Filename       string `json:"filename"`
	CompileCommand string `json:"compileCommand"`
	RunCommand     string `json:"runCommand"`
}

const TEMP_DIR = "/tmp/mojacoder-judge/"
const CHILD_UID, CHILD_GID = 400, 400

const LANGUAGE_DEFINITION_FILE = "./language-definition.json"

func judge(lang string, code string) error {
	var err error
	definitions, err := loadLanguageDefinition(LANGUAGE_DEFINITION_FILE)
	if err != nil {
		return err
	}
	definition, exist := definitions[lang]
	if !exist {
		return err
	}
	_ /*res*/, _ /*compileError*/, err = compile(definition, code)
	if err != nil {
		return err
	}

	return nil
}

func main() {
	code := `
	package main

	import "fmt"

	func main() {
		fmt.Println("Hello world")
	}
	`
	lang := "go-1.14"
	err := judge(lang, code)
	if err != nil {
		log.Fatalln(err)
	}
}
