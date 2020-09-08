package main

import (
	"fmt"
	"os/exec"
	"strings"
	"syscall"
)

type RunResultStatus int

const (
	RunResultStatusSuccess RunResultStatus = iota
	RunResultStatusTimeLimitExceeded
	RunResultStatusMemoryLimitExceeded
	RunResultStatusRunTimeError
)

type RunResult struct {
	status RunResultStatus
	time   int
	memory int
	stdout []byte
}

func run(definition LanguageDefinition, stdin string, timeLimit, memoryLimit int) (RunResult, error) {
	var result RunResult
	var err error
	command := fmt.Sprintf("ulimit -u 10 -t %d -m %d && %s; EXIT_CODE=$?; kill -SIGKILL -1; exit $EXIT_CODE", timeLimit, memoryLimit, definition.RunCommand)
	cmd := exec.Command("bash", "-c", command)
	cmd.Env = []string{}
	cmd.Dir = TEMP_DIR
	cmd.Stdin = strings.NewReader(stdin)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Credential: &syscall.Credential{Uid: CHILD_UID, Gid: CHILD_GID},
	}
	stdout, err := cmd.Output()
	if err != nil {
		if _, ok := err.(*exec.ExitError); !ok {
			return result, err
		}
	}
	result.time = int((cmd.ProcessState.UserTime() + cmd.ProcessState.SystemTime()).Milliseconds())
	result.memory = int(cmd.ProcessState.SysUsage().(*syscall.Rusage).Maxrss)
	result.stdout = stdout
	if !cmd.ProcessState.Success() {
		if result.time > timeLimit {
			result.status = RunResultStatusTimeLimitExceeded
		} else if result.memory > memoryLimit {
			result.status = RunResultStatusMemoryLimitExceeded
		} else {
			result.status = RunResultStatusRunTimeError
		}
	}
	return result, nil
}
