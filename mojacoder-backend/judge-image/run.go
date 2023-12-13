package main

import (
	"fmt"
	"io"
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
}

type RunConfig struct {
	stdin          io.Reader
	stdout         io.Writer
	stderr         io.Writer
	timeLimit      int
	memoryLimit    int
	dir            string
	runCommandArgs []string
}

func run(definition LanguageDefinition, config RunConfig) (RunResult, error) {
	var result RunResult
	var err error
	additional_memory := 5 * 1024
	args := strings.Join(config.runCommandArgs, " ")
	command := fmt.Sprintf("ulimit -u 32 -m %d && timeout --preserve-status -sSIGKILL %d %s %s; EXIT_CODE=$?; kill -SIGKILL -1; wait; exit $EXIT_CODE", config.memoryLimit+additional_memory, config.timeLimit, definition.RunCommand, args)
	cmd := exec.Command("bash", "-c", command)
	cmd.Env = []string{}
	cmd.Dir = config.dir
	cmd.Stdin = config.stdin
	cmd.Stdout = config.stdout
	cmd.Stderr = config.stderr
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

	if result.time > config.timeLimit*1000 {
		result.status = RunResultStatusTimeLimitExceeded
	} else if result.memory > config.memoryLimit {
		result.status = RunResultStatusMemoryLimitExceeded
	} else if !cmd.ProcessState.Success() {
		result.status = RunResultStatusRunTimeError
	}
	return result, nil
}
