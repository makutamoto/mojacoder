#include <cassert>
#include <iostream>
#include <boost/multiprecision/cpp_int.hpp>
#include <Eigen/Dense>
#include <atcoder/dsu>
#include <gmpxx.h>
int main() {
    boost::multiprecision::cpp_int value = 6;
    assert(value * 7 == 42);
    Eigen::Matrix2d matrix;
    matrix << 1, 2, 3, 4;
    assert(matrix.determinant() == -2);
    atcoder::dsu groups(3);
    groups.merge(0, 1);
    assert(groups.same(0, 1));
    mpz_class answer = 6;
    std::cout << answer * 7 << '\n';
}
