package main

import (
	"fmt"
	"math/big"
)

func main() {
	fmt.Println(new(big.Int).Mul(big.NewInt(6), big.NewInt(7)))
}
