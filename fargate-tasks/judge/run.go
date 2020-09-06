package main

import (
	"bufio"
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"syscall"
	"time"
)

// #include<unistd.h>
// long getClock(void) {
//	 return sysconf(_SC_CLK_TCK);
// }
import "C"

type RunResultStatus int

const (
	RunResultStatusSuccess RunResultStatus = iota
	RunResultStatusTimeLimitExceeded
	RunResultStatusRunTimeError
)

type RunResult struct {
	status RunResultStatus
	time   int
	memory int
	stdout []byte
}

var clockTck = int(C.getClock())

func getProcessTime(process *os.Process) (int, bool, error) {
	var err error
	var state byte
	fd, err := os.Open(fmt.Sprintf("/proc/%d/stat", process.Pid))
	if err != nil {
		return 0, false, err
	}
	defer fd.Close()
	scanner := bufio.NewScanner(fd)
	scanner.Split(bufio.ScanWords)
	for i := 0; i < 13; i++ {
		scanner.Scan()
		if i == 2 {
			state = scanner.Text()[0]
		}
	}
	scanner.Scan()
	user, err := strconv.Atoi(scanner.Text())
	if err != nil {
		return 0, false, err
	}
	scanner.Scan()
	sys, err := strconv.Atoi(scanner.Text())
	if err != nil {
		return 0, false, err
	}
	processTime := 1000 * (user + sys) / clockTck
	if state == 'Z' {
		return processTime, true, nil
	}
	return processTime, false, nil
}

func run(definition LanguageDefinition, stdin string, timeLimit int) (RunResult, error) {
	var result RunResult
	var err error
	var execTime int
	var stdout bytes.Buffer
	cmd := exec.Command("bash", "-c", definition.RunCommand)
	cmd.Env = []string{}
	cmd.Dir = TEMP_DIR
	cmd.Stdin = strings.NewReader(stdin)
	cmd.Stdout = &stdout
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Credential: &syscall.Credential{Uid: CHILD_UID, Gid: CHILD_GID},
	}
	if err = cmd.Start(); err != nil {
		return result, err
	}
	for {
		var exited bool
		execTime, exited, err = getProcessTime(cmd.Process)
		if exited {
			break
		}
		if err != nil {
			return result, err
		}
		if execTime > timeLimit {
			cmd.Process.Kill()
			result.status = RunResultStatusTimeLimitExceeded
			break
		}
		time.Sleep(100 * time.Millisecond)
	}
	cmd.Wait()
	if result.status == RunResultStatusSuccess && !cmd.ProcessState.Success() {
		result.status = RunResultStatusRunTimeError
	}
	result.time = execTime
	result.memory = int(cmd.ProcessState.SysUsage().(*syscall.Rusage).Maxrss)
	result.stdout = stdout.Bytes()
	return result, nil
}
