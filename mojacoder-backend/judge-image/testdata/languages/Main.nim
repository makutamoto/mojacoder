import neo
import bignum
import atcoder/dsu

let groups = initDSU(3)
groups.merge(0, 1)
doAssert groups.same(0, 1)
let a = matrix(@[@[6.0]])
let b = matrix(@[@[7.0]])
doAssert (a * b)[0, 0] == 42.0
doAssert $(newInt(6) * newInt(7)) == "42"
echo 42
