package main

import (
	"fmt"
	"os/exec"
	"strings"
	"syscall"
	"time"
)

type RunResultStatus int

const (
	RunResultStatusSuccess RunResultStatus = iota
	RunResultStatusTimeLimitExceeded
	RunResultStatusMemoryLimitExceeded
	RunResultStatusRunTimeError
)

type RunResult struct {
	status   RunResultStatus
	exitCode int
	time     int
	memory   int
	stdout   []byte
}

func run(definition LanguageDefinition, stdin string, timeLimit, memoryLimit int) (RunResult, error) {
	var result RunResult
	var err error
	command := fmt.Sprintf("ulimit -u 10 -m %d && timeout --preserve-status -sSIGKILL %d %s; EXIT_CODE=$?; kill -SIGKILL -1; exit $EXIT_CODE", memoryLimit, timeLimit, definition.RunCommand)
	cmd := exec.Command("bash", "-c", command)
	cmd.Env = []string{}
	cmd.Dir = TEMP_DIR
	cmd.Stdin = strings.NewReader(stdin)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Credential: &syscall.Credential{Uid: CHILD_UID, Gid: CHILD_GID},
	}
	start := time.Now()
	stdout, err := cmd.Output()
	end := time.Now()
	if err != nil {
		if _, ok := err.(*exec.ExitError); !ok {
			return result, err
		}
	}
	result.exitCode = cmd.ProcessState.ExitCode()
	result.time = int((end.Sub(start)).Milliseconds())
	result.memory = int(cmd.ProcessState.SysUsage().(*syscall.Rusage).Maxrss)
	result.stdout = stdout
	if !cmd.ProcessState.Success() {
		if result.time > timeLimit*1000 {
			result.status = RunResultStatusTimeLimitExceeded
		} else if result.memory > memoryLimit {
			result.status = RunResultStatusMemoryLimitExceeded
		} else {
			result.status = RunResultStatusRunTimeError
		}
	}
	return result, nil
}
