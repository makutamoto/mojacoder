use std::{env, fs, io::{self, Read}, process};
fn main() {
    let args: Vec<String> = env::args().collect();
    let input: i32 = fs::read_to_string(&args[1]).unwrap().trim().parse().unwrap();
    let expected: i32 = fs::read_to_string(&args[2]).unwrap().trim().parse().unwrap();
    let mut answer = String::new();
    io::stdin().read_to_string(&mut answer).unwrap();
    let actual: i32 = answer.trim().parse().unwrap();
    process::exit(if input + 22 == expected && actual == expected { 0 } else { 1 });
}
