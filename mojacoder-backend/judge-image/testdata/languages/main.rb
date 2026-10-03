require 'rbtree'
require 'ac-library-rb/dsu'
require 'faster_prime'
require 'sorted_set'
require 'numo/narray'
tree = RBTree.new
tree[1] = 42
raise unless tree[1] == 42
groups = AcLibraryRb::DSU.new(3)
groups.merge(0, 1)
raise unless groups.same?(0, 1)
raise unless 43.prime? && !42.prime?
raise unless SortedSet.new([3, 1, 2]).to_a == [1, 2, 3]
raise unless Numo::Int64[20, 22].sum == 42
puts 42
