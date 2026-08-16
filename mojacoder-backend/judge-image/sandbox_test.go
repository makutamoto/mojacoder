package main

import (
	"fmt"
	"net"
	"os"
	"reflect"
	"strings"
	"syscall"
	"testing"
	"time"
)

func TestSandboxedCommandWrapsCommand(t *testing.T) {
	cmd := sandboxedCommand("bash", "-c", "echo ok")
	want := []string{SANDBOX_BINARY, "bash", "-c", "echo ok"}

	if !reflect.DeepEqual(cmd.Args, want) {
		t.Fatalf("unexpected sandbox command: got %v, want %v", cmd.Args, want)
	}
}

func sandboxIntegrationDirectory(t *testing.T) string {
	t.Helper()
	if os.Getenv("MOJACODER_SANDBOX_INTEGRATION") != "1" {
		t.Skip("sandbox integration test requires the Linux judge image")
	}
	dir, err := os.MkdirTemp("", "mojacoder-sandbox-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })
	if err := createSandboxDirectory(dir); err != nil {
		t.Fatal(err)
	}
	return dir
}

func assertListenerNotReached(t *testing.T, listener net.Listener) {
	t.Helper()
	tcpListener := listener.(*net.TCPListener)
	if err := tcpListener.SetDeadline(time.Now().Add(100 * time.Millisecond)); err != nil {
		t.Fatal(err)
	}
	connection, err := tcpListener.Accept()
	if err == nil {
		connection.Close()
		t.Fatal("network probe reached the listening socket")
	}
}

func assertSandboxDirectorySealed(t *testing.T, dir string) {
	t.Helper()
	info, err := os.Stat(dir)
	if err != nil {
		t.Fatal(err)
	}
	stat := info.Sys().(*syscall.Stat_t)
	if stat.Uid != 0 || stat.Gid != CHILD_GID {
		t.Fatalf("sealed compile directory owner = %d:%d, want 0:%d", stat.Uid, stat.Gid, CHILD_GID)
	}
	if info.Mode().Perm()&0022 != 0 {
		t.Fatalf("sealed compile directory remains writable: %o", info.Mode().Perm())
	}
}

func TestRunBlocksNetworkAccess(t *testing.T) {
	dir := sandboxIntegrationDirectory(t)

	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	port := listener.Addr().(*net.TCPAddr).Port

	var stdout, stderr strings.Builder
	definition := LanguageDefinition{
		RunCommand: fmt.Sprintf("bash -c 'exec 3<>/dev/tcp/127.0.0.1/%d'", port),
	}
	result, err := run(definition, RunConfig{
		stdout:      &stdout,
		stderr:      &stderr,
		timeLimit:   2,
		memoryLimit: 128 * 1024,
		dir:         dir,
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.status != RunResultStatusRunTimeError {
		t.Fatalf("network probe status = %v, want runtime error", result.status)
	}
	if !strings.Contains(stderr.String(), "Operation not permitted") {
		t.Fatalf("network probe was not rejected by seccomp: %s", stderr.String())
	}

	assertListenerNotReached(t, listener)
}

func TestCompileBlocksNetworkAccess(t *testing.T) {
	dir := sandboxIntegrationDirectory(t)

	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	port := listener.Addr().(*net.TCPAddr).Port

	compiled, stderr, err := compile(LanguageDefinition{
		CompileCommand: fmt.Sprintf("bash -c 'exec 3<>/dev/tcp/127.0.0.1/%d'", port),
	}, dir)
	if err != nil {
		t.Fatal(err)
	}
	if compiled {
		t.Fatal("network probe unexpectedly compiled")
	}
	if !strings.Contains(stderr, "Operation not permitted") {
		t.Fatalf("compile-time network probe was not rejected by seccomp: %s", stderr)
	}
	assertListenerNotReached(t, listener)
}

func TestCompileUsesUnprivilegedCredentialFreeProcess(t *testing.T) {
	dir := sandboxIntegrationDirectory(t)

	for _, name := range []string{"AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"} {
		oldValue, existed := os.LookupEnv(name)
		if err := os.Setenv(name, "must-not-be-inherited"); err != nil {
			t.Fatal(err)
		}
		envName, savedValue, wasSet := name, oldValue, existed
		t.Cleanup(func() {
			if wasSet {
				os.Setenv(envName, savedValue)
			} else {
				os.Unsetenv(envName)
			}
		})
	}

	compiled, stderr, err := compile(LanguageDefinition{
		CompileCommand: `test "$(id -u)" = "400" && test "$(id -g)" = "400" && test -z "${AWS_ACCESS_KEY_ID:-}" && test -z "${AWS_SECRET_ACCESS_KEY:-}" && test ! -r /proc/1/environ`,
	}, dir)
	if err != nil {
		t.Fatal(err)
	}
	if !compiled {
		t.Fatalf("compile sandbox identity check failed: %s", stderr)
	}
	assertSandboxDirectorySealed(t, dir)
}

func TestCompileWithoutCommandSealsDirectory(t *testing.T) {
	dir := sandboxIntegrationDirectory(t)

	compiled, stderr, err := compile(LanguageDefinition{}, dir)
	if err != nil {
		t.Fatal(err)
	}
	if !compiled {
		t.Fatalf("language without compile command failed: %s", stderr)
	}
	assertSandboxDirectorySealed(t, dir)
}
