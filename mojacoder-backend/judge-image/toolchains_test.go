package main

import (
	"debug/elf"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"testing"
)

// Run sequentially in the judge image: compile/run clean up all UID 400 processes.
// MOJACODER_SANDBOX_INTEGRATION=1 go test ./...
func TestARM64ToolchainBinaries(t *testing.T) {
	if os.Getenv("MOJACODER_SANDBOX_INTEGRATION") != "1" {
		t.Skip("requires the Linux ARM64 judge image")
	}
	if runtime.GOOS != "linux" || runtime.GOARCH != "arm64" {
		t.Fatalf("judge tests are running on %s/%s", runtime.GOOS, runtime.GOARCH)
	}
	for _, name := range []string{"./judge", SANDBOX_BINARY, "go", "gcc-12", "g++-12", "python3.11", "pypy3", "java", "nim", "rustc", "ruby", "sbcl", "mono"} {
		t.Run(name, func(t *testing.T) {
			path, err := exec.LookPath(name)
			if err != nil {
				t.Fatal(err)
			}
			binary, err := elf.Open(path)
			if err != nil {
				t.Fatal(err)
			}
			defer binary.Close()
			if binary.Machine != elf.EM_AARCH64 {
				t.Fatalf("%s has machine %s, want AArch64", path, binary.Machine)
			}
		})
	}
}

func compileFixture(t *testing.T, definition LanguageDefinition, dir, fixture string) {
	t.Helper()
	source, err := os.ReadFile(filepath.Join("testdata", fixture))
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, definition.Filename), source, 0644); err != nil {
		t.Fatal(err)
	}
	compiled, diagnostics, err := compile(definition, dir)
	if err != nil {
		t.Fatal(err)
	}
	if !compiled {
		t.Fatalf("compilation failed: %s", diagnostics)
	}
}

func TestAllLanguageToolchains(t *testing.T) {
	if os.Getenv("MOJACODER_SANDBOX_INTEGRATION") != "1" {
		t.Skip("requires the Linux judge image")
	}
	definitions, err := loadLanguageDefinition(LANGUAGE_DEFINITION_FILE)
	if err != nil {
		t.Fatal(err)
	}
	fixtures := map[string]string{
		"go-1.21":                "main.go",
		"python3.11":             "main.py",
		"gcc-12.3":               "main.c",
		"g++-12.3":               "main.cpp",
		"csharp-mono-csc-3.9.0":  "main.cs",
		"csharp-mono-mcs-6.12.0": "main.cs",
		"bf-20041219":            "main.bf",
		"cat":                    "main.txt",
		"rust-1.74.0":            "main.rs",
		"pypy3-7.3.13":           "main.py",
		"ruby-3.2.2":             "main.rb",
		"java-21":                "Main.java",
		"kotlin-1.9.21":          "main.kt",
		"commonlisp-2.1.11":      "main.lisp",
		"nim-1.6.16":             "Main.nim",
	}
	if len(definitions) != len(fixtures) {
		t.Fatalf("language definitions = %d, fixtures = %d", len(definitions), len(fixtures))
	}
	ids := make([]string, 0, len(definitions))
	for id := range definitions {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	for _, id := range ids {
		t.Run(id, func(t *testing.T) {
			fixture, exists := fixtures[id]
			if !exists {
				t.Fatalf("missing fixture for %s", id)
			}
			dir := sandboxIntegrationDirectory(t)
			definition := definitions[id]
			compileFixture(t, definition, dir, filepath.Join("languages", fixture))
			var stdout, stderr strings.Builder
			result, err := run(definition, RunConfig{
				stdin: strings.NewReader("42\n"), stdout: &stdout, stderr: &stderr,
				timeLimit: 30, memoryLimit: 1024 * 1024, dir: dir,
			})
			if err != nil {
				t.Fatal(err)
			}
			if result.status != RunResultStatusSuccess || stdout.String() != "42\n" {
				t.Fatalf("status=%v exit=%d stdout=%q stderr=%s", result.status, result.exitCode, stdout.String(), stderr.String())
			}
		})
	}
}

func TestSpecialJudgeToolchains(t *testing.T) {
	dir := sandboxIntegrationDirectory(t)
	definitions, err := loadLanguageDefinition(LANGUAGE_DEFINITION_FILE)
	if err != nil {
		t.Fatal(err)
	}
	languages, err := loadSpecialJudgeLangs(SPECIAL_JUDGE_LANGS_FILE)
	if err != nil {
		t.Fatal(err)
	}
	inPath, outPath := filepath.Join(dir, "input.txt"), filepath.Join(dir, "output.txt")
	for path, content := range map[string]string{inPath: "20\n", outPath: "42\n"} {
		if err := os.WriteFile(path, []byte(content), 0644); err != nil {
			t.Fatal(err)
		}
	}
	for name, language := range languages {
		t.Run(name, func(t *testing.T) {
			if err := resetSandboxDirectory(SPECIAL_JUDGE_DIR); err != nil {
				t.Fatal(err)
			}
			t.Cleanup(func() { os.RemoveAll(SPECIAL_JUDGE_DIR) })
			definition, exists := definitions[language.Id]
			if !exists {
				t.Fatalf("missing language %s", language.Id)
			}
			compileFixture(t, definition, SPECIAL_JUDGE_DIR, filepath.Join("special-judge", definition.Filename))
			for _, submission := range []string{"42\n", "41\n"} {
				result, err := (SpecialJudge{}).runSpecialJudge(definition, strings.NewReader(submission), inPath, outPath)
				if err != nil {
					t.Fatal(err)
				}
				wantExit := 0
				if submission == "41\n" {
					wantExit = 1
				}
				if result.exitCode != wantExit || result.status == RunResultStatusTimeLimitExceeded || result.status == RunResultStatusMemoryLimitExceeded {
					t.Fatalf("submission=%q status=%v exit=%d, want exit=%d", submission, result.status, result.exitCode, wantExit)
				}
			}
		})
	}
}
