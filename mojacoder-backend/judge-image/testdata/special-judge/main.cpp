#include <fstream>
#include <iostream>
int main(int argc, char** argv) {
    if (argc != 3) return 2;
    int input, expected, actual;
    if (!(std::ifstream(argv[1]) >> input)) return 2;
    if (!(std::ifstream(argv[2]) >> expected)) return 2;
    if (!(std::cin >> actual)) return 2;
    return input + 22 == expected && actual == expected ? 0 : 1;
}
