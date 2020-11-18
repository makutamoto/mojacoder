package main

import (
	"fmt"
	"io"
	"os/exec"
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
}

func run(definition LanguageDefinition, stdin io.Reader, stdout io.Writer, stderr io.Writer, timeLimit, memoryLimit int) (RunResult, error) {
	var result RunResult
	var err error
	command := fmt.Sprintf("ulimit -u 10 -m %d && timeout --preserve-status -sSIGKILL %d %s; EXIT_CODE=$?; kill -SIGKILL -1; exit $EXIT_CODE", memoryLimit, timeLimit, definition.RunCommand)
	cmd := exec.Command("bash", "-c", command)
	cmd.Env = []string{}
	cmd.Dir = TEMP_DIR
	cmd.Stdin = stdin
	cmd.Stdout = stdout
	cmd.Stderr = stderr
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Credential: &syscall.Credential{Uid: CHILD_UID, Gid: CHILD_GID},
	}
	start := time.Now()
	err = cmd.Start()
	cmd.Wait()
	end := time.Now()
	if err != nil {
		return result, err
	}
	result.exitCode = cmd.ProcessState.ExitCode()
	result.time = int((end.Sub(start)).Milliseconds())
	result.memory = int(cmd.ProcessState.SysUsage().(*syscall.Rusage).Maxrss)
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
