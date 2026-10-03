import sys
with open(sys.argv[1]) as stream:
    input_value = int(stream.read())
with open(sys.argv[2]) as stream:
    expected = int(stream.read())
actual = int(sys.stdin.read())
sys.exit(0 if input_value + 22 == expected == actual else 1)
