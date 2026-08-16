#include <errno.h>
#include <seccomp.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/prctl.h>
#include <sys/socket.h>
#include <unistd.h>

#define SANDBOX_SETUP_FAILURE 125

static int deny_syscall(scmp_filter_ctx filter, const char *name) {
    int syscall_number = seccomp_syscall_resolve_name(name);
    int result;

    if (syscall_number == __NR_SCMP_ERROR) {
        return 0;
    }

    result = seccomp_rule_add(filter, SCMP_ACT_ERRNO(EPERM), syscall_number, 0);
    if (result < 0) {
        errno = -result;
        perror(name);
        return -1;
    }
    return 0;
}

static int install_filter(void) {
    static const char *const denied_syscalls[] = {
        "bpf",
        "io_uring_enter",
        "io_uring_register",
        "io_uring_setup",
        "kcmp",
        "pidfd_getfd",
        "process_vm_readv",
        "process_vm_writev",
        "ptrace",
        "setns",
        "unshare",
    };
    scmp_filter_ctx filter;
    size_t i;
    int result;

    if (prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) != 0) {
        perror("prctl(PR_SET_NO_NEW_PRIVS)");
        return -1;
    }

    filter = seccomp_init(SCMP_ACT_ALLOW);
    if (filter == NULL) {
        perror("seccomp_init");
        return -1;
    }

    result = seccomp_rule_add(
        filter,
        SCMP_ACT_ERRNO(EPERM),
        SCMP_SYS(socket),
        1,
        SCMP_A0(SCMP_CMP_NE, AF_UNIX));
    if (result < 0) {
        errno = -result;
        perror("seccomp_rule_add(socket)");
        seccomp_release(filter);
        return -1;
    }

    result = seccomp_rule_add(
        filter,
        SCMP_ACT_ERRNO(EPERM),
        SCMP_SYS(socketpair),
        1,
        SCMP_A0(SCMP_CMP_NE, AF_UNIX));
    if (result < 0) {
        errno = -result;
        perror("seccomp_rule_add(socketpair)");
        seccomp_release(filter);
        return -1;
    }

    for (i = 0; i < sizeof(denied_syscalls) / sizeof(denied_syscalls[0]); i++) {
        if (deny_syscall(filter, denied_syscalls[i]) != 0) {
            seccomp_release(filter);
            return -1;
        }
    }

    result = seccomp_load(filter);
    if (result < 0) {
        errno = -result;
        perror("seccomp_load");
        seccomp_release(filter);
        return -1;
    }

    seccomp_release(filter);
    return 0;
}

static int self_test(void) {
    int internet_socket;
    int unix_sockets[2];

    if (install_filter() != 0) {
        return SANDBOX_SETUP_FAILURE;
    }

    errno = 0;
    internet_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (internet_socket >= 0) {
        close(internet_socket);
        fputs("sandbox self-test failed: AF_INET socket was allowed\n", stderr);
        return EXIT_FAILURE;
    }
    if (errno != EPERM) {
        perror("sandbox self-test failed: unexpected AF_INET socket error");
        return EXIT_FAILURE;
    }

    if (socketpair(AF_UNIX, SOCK_STREAM, 0, unix_sockets) != 0) {
        perror("sandbox self-test failed: AF_UNIX socketpair was denied");
        return EXIT_FAILURE;
    }
    close(unix_sockets[0]);
    close(unix_sockets[1]);

    return EXIT_SUCCESS;
}

int main(int argc, char **argv) {
    if (argc == 2 && strcmp(argv[1], "--self-test") == 0) {
        return self_test();
    }

    if (argc < 2) {
        fprintf(stderr, "usage: %s COMMAND [ARG...]\n", argv[0]);
        return EXIT_FAILURE;
    }

    if (install_filter() != 0) {
        return SANDBOX_SETUP_FAILURE;
    }

    execvp(argv[1], &argv[1]);
    perror("execvp");
    return errno == ENOENT ? 127 : 126;
}
