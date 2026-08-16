package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
)

const SANDBOX_BINARY = "/usr/local/bin/mojacoder-sandbox"

func sandboxedCommand(command string, args ...string) *exec.Cmd {
	sandboxArgs := make([]string, 0, len(args)+1)
	sandboxArgs = append(sandboxArgs, command)
	sandboxArgs = append(sandboxArgs, args...)
	return exec.Command(SANDBOX_BINARY, sandboxArgs...)
}

func configureSandboxedCommand(cmd *exec.Cmd, homeDir string) {
	environment := []string{"PATH=" + os.Getenv("PATH")}
	if homeDir != "" {
		cacheDir := filepath.Join(homeDir, ".cache")
		environment = append(environment,
			"HOME="+homeDir,
			"GOCACHE="+filepath.Join(cacheDir, "go-build"),
			"XDG_CACHE_HOME="+cacheDir,
		)
		for _, name := range []string{"CARGO_HOME", "JAVA_HOME", "NIMBLE_DIR", "RUSTUP_HOME"} {
			if value := os.Getenv(name); value != "" {
				environment = append(environment, name+"="+value)
			}
		}
	}
	cmd.Env = environment
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Credential: &syscall.Credential{Uid: CHILD_UID, Gid: CHILD_GID},
	}
}

func createSandboxDirectory(path string) error {
	if err := os.MkdirAll(path, 0770); err != nil {
		return err
	}
	if err := os.Chown(path, 0, CHILD_GID); err != nil {
		return err
	}
	return os.Chmod(path, 0770)
}

func resetSandboxDirectory(path string) error {
	if err := os.RemoveAll(path); err != nil {
		return err
	}
	return createSandboxDirectory(path)
}

func sealSandboxDirectory(path string) error {
	return filepath.WalkDir(path, func(currentPath string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if err := os.Lchown(currentPath, 0, CHILD_GID); err != nil {
			return err
		}
		if entry.Type()&os.ModeSymlink != 0 {
			return nil
		}
		info, err := entry.Info()
		if err != nil {
			return err
		}
		return os.Chmod(currentPath, info.Mode().Perm()&^0022)
	})
}

func verifySandbox() error {
	output, err := exec.Command(SANDBOX_BINARY, "--self-test").CombinedOutput()
	if err != nil {
		return fmt.Errorf("sandbox self-test failed: %w: %s", err, strings.TrimSpace(string(output)))
	}
	return nil
}
