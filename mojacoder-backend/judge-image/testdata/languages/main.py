import platform
import numpy as np
import networkx as nx
import sympy
from sortedcontainers import SortedList
from more_itertools import chunked
from shapely.geometry import Point
from bitarray import bitarray
import mpmath
import z3
import cppyy
from atcoder.dsu import DSU

assert np.dot([6.0], [7.0]) == 42
assert nx.shortest_path_length(nx.path_graph(3), 0, 2) == 2
assert sympy.factorial(5) == 120
assert list(SortedList([3, 1, 2])) == [1, 2, 3]
assert list(chunked(range(3), 2)) == [[0, 1], [2]]
assert Point(0, 0).distance(Point(3, 4)) == 5
assert bitarray("101").count() == 2
assert mpmath.sqrt(4) == 2
solver = z3.Solver()
x = z3.Int("x")
solver.add(x * 2 == 84)
assert solver.check() == z3.sat
assert solver.model()[x].as_long() == 42
cppyy.cppdef("int arm64_answer() { return 6 * 7; }")
assert cppyy.gbl.arm64_answer() == 42
dsu = DSU(3)
dsu.merge(0, 1)
assert dsu.same(0, 1)
if platform.python_implementation() == "CPython":
    from numba import njit

    @njit
    def multiply(a, b):
        return a * b

    assert multiply(6, 7) == 42
print(42)
