package main

import "testing"

func TestLoadSpecialJudgeLangs(t *testing.T) {
	var err error
	var definitions map[string]SpecialJudgeLang
	definitions, err = loadSpecialJudgeLangs("./special-judge-langs.json")

	if err != nil {
		t.Error(err)
	}

	for _, v := range definitions {
		if v.Id == "" {
			t.Error("id is empty")
		}
	}
}

func TestLoadLanguageDefinition(t *testing.T) {
	var err error
	var definitions map[string]LanguageDefinition
	definitions, err = loadLanguageDefinition("./language-definition.json")

	if err != nil {
		t.Error(err)
	}

	for _, v := range definitions {
		if v.Filename == "" {
			t.Error("filename is empty")
		}
		if v.RunCommand == "" {
			t.Error("runCommand is empty")
		}
	}
}

func TestSpecialJudgeLangsId(t *testing.T) {
	var err error
	var definitions map[string]LanguageDefinition
	definitions, err = loadLanguageDefinition("./language-definition.json")

	if err != nil {
		t.Error(err)
	}

	var spjudgelangs map[string]SpecialJudgeLang
	spjudgelangs, err = loadSpecialJudgeLangs("./special-judge-langs.json")

	if err != nil {
		t.Error(err)
	}

	for _, spjudgelang := range spjudgelangs {
		_, exist := definitions[spjudgelang.Id]
		if !exist {
			t.Error(spjudgelang.Id + " not found")
		}
	}
}
