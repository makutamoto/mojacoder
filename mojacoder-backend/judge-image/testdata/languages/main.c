#include <stdio.h>
#include <stdint.h>
int main(void) {
    uint64_t value = 6;
    printf("%llu\n", (unsigned long long)(value * 7));
    return 0;
}
