use ac_library::Dsu;
use itertools::Itertools;
use num_bigint::BigUint;
use ndarray::array;
use nalgebra::Matrix2;
use proconio::input;
use regex::Regex;

#[proconio::derive_readable]
struct Input {
    value: u64,
}

fn main() {
    let mut groups = Dsu::new(3);
    groups.merge(0, 1);
    assert!(groups.same(0, 1));
    assert_eq!((0..3).permutations(2).count(), 6);
    assert_eq!(BigUint::from(6u32) * BigUint::from(7u32), BigUint::from(42u32));
    assert_eq!(array![6, 7].sum(), 13);
    assert_eq!(Matrix2::new(1.0, 2.0, 3.0, 4.0).determinant(), -2.0);
    assert!(Regex::new(r"^\d+$").unwrap().is_match("42"));
    input! { item: Input }
    println!("{}", item.value);
}
