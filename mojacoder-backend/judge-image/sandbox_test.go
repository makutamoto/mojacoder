package main

import (
	"fmt"
	"net"
	"os"
	"reflect"
	"strings"
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

func TestRunBlocksNetworkAccess(t *testing.T) {
	if os.Getenv("MOJACODER_SANDBOX_INTEGRATION") != "1" {
		t.Skip("sandbox integration test requires the Linux judge image")
	}

	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	port := listener.Addr().(*net.TCPAddr).Port

	dir, err := os.MkdirTemp("", "mojacoder-sandbox-")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)
	if err := os.Chmod(dir, 0777); err != nil {
		t.Fatal(err)
	}

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
