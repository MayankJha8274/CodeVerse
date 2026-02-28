const mongoose = require('mongoose');
require('dotenv').config();

// Import the classifier directly
const classifyProblemTopics = (problemName, problemSlug) => {
  const text = `${problemName} ${problemSlug}`.toLowerCase();
  const matched = [];
  
  const topicRules = [
    ['Linked List', ['linked list', 'linked-list', 'doubly linked', 'singly linked', 'circular linked', 'merge list', 'node insertion', 'node deletion'], []],
    ['Tree', ['tree', 'bst', 'binary search tree', 'binary-tree', 'inorder', 'preorder', 'postorder', 'leaf', 'subtree', 'root to', 'left view', 'right view', 'top view', 'bottom view', 'boundary traversal', 'level order', 'height of', 'diameter of', 'balanced tree', 'mirror tree', 'symmetric tree'], ['spanning tree']],
    ['Graph', ['graph', 'dijkstra', 'bfs of', 'dfs of', 'cycle in', 'spanning tree', 'floyd', 'bellman', 'shortest path', 'island', 'province', 'topological', 'bipartite', 'word ladder', 'alien dict', 'safe state', 'connected component'], []],
    ['Dynamic Programming', ['knapsack', 'longest increasing sub', 'longest common sub', 'longest bitonic', 'rod cutting', 'coin change', 'perfect sum', 'subset sum', 'partition', 'frog jump', 'geek.s training', 'climbing', 'edit distance', 'egg drop', 'matrix chain', 'fibonacci', 'lcs', 'lis'], ['binary search']],
    ['Sorting', ['sort', 'bubble sort', 'merge sort', 'quick sort', 'insertion sort', 'selection sort', 'heap sort', 'count inversion'], ['binary search', 'topological sort']],
    ['Searching', ['binary search', 'search', 'lower bound', 'upper bound', 'floor in', 'ceil in', 'kth smallest', 'kth largest', 'kth element', 'nth root', 'square root', 'find peak', 'search pattern'], ['binary search tree', 'search in linked']],
    ['Array', ['array', 'subarray', 'sub-array', 'rotate array', 'reverse array', 'leaders', 'kadane', 'maximum sub array', 'duplicate', 'missing', 'pair', 'triplet', 'stock', 'trapping rain', 'max sum', 'move all', 'rearrange'], []],
    ['Stack', ['stack', 'parenthes', 'bracket', 'next greater', 'stock span', 'celebrity', 'expression', 'postfix', 'infix', 'prefix'], []],
    ['Queue', ['queue', 'circular queue', 'deque', 'first non-repeating', 'stream', 'sliding window'], []],
    ['Hash', ['hash', 'union of', 'frequency', 'count subarray', 'xor', 'largest subarray with 0', 'longest sub-array with sum', 'distinct'], ['binary search']],
    ['String', ['string', 'pattern', 'anagram', 'palindrome', 'rabin-karp', 'kmp', 'reverse string', 'word'], ['subsequence', 'longest common sub']],
    ['Math', ['gcd', 'lcm', 'prime', 'factorial', 'armstrong', 'divisor', 'digit', 'power of', 'sieve', 'modular', 'count digit', 'sum of divisors', 'odd or even'], []],
    ['Bit Manipulation', ['bit', 'xor', 'set bit', 'toggle', 'rightmost', 'kth bit', 'power of 2', 'number of 1 bit'], ['longest bitonic']],
    ['Greedy', ['greedy', 'fractional knapsack', 'gas station', 'minimum cost of ropes', 'job sequencing', 'huffman', 'activity selection', 'minimum platform'], []],
    ['Backtracking', ['backtrack', 'rat in a maze', 'n queen', 'sudoku', 'permutation', 'combination'], []],
    ['Heap', ['heap', 'priority queue', 'median of stream', 'merge k sorted', 'k largest', 'k closest'], []],
    ['Recursion', ['recursion', 'recursive', 'tower of hanoi', 'print 1 to n', 'print n to 1', 'print gfg'], []],
    ['Matrix', ['matrix', 'spiral', 'row-wise', 'row wise', 'column', 'rotate matrix'], []],
    ['Sliding Window', ['window', 'sliding', 'longest subarray with atmost', 'first negative in every', 'fruit into basket'], []],
    ['Two Pointer', ['two pointer', 'container with most', 'pair sum', '3sum', 'triplet'], []],
    ['Divide and Conquer', ['divide and conquer', 'merge sort', 'count inversion'], []],
    ['Trie', ['trie', 'prefix tree', 'auto complete'], []],
    ['Segment Tree', ['segment tree', 'range query', 'range update'], []],
    ['Disjoint Set', ['disjoint set', 'union find', 'union-find', 'kruskal'], []],
  ];
  
  for (const [topic, keywords, negKeywords] of topicRules) {
    const hasNeg = negKeywords.length > 0 && negKeywords.some(nk => text.includes(nk));
    if (!hasNeg && keywords.some(kw => text.includes(kw))) {
      matched.push(topic);
    }
  }
  
  return matched;
};

(async () => {
  // Test with actual GFG problem data from the submissions API
  const testProblems = [
    { pname: "Delete in a Doubly Linked List", slug: "delete-node-in-doubly-linked-list" },
    { pname: "Reverse a Doubly Linked List", slug: "reverse-a-doubly-linked-list" },
    { pname: "Bubble Sort", slug: "bubble-sort" },
    { pname: "Left View of Binary Tree", slug: "left-view-of-binary-tree" },
    { pname: "DFS of Graph", slug: "depth-first-traversal-for-a-graph" },
    { pname: "BFS of graph", slug: "bfs-traversal-of-graph" },
    { pname: "Square Root", slug: "square-root" },
    { pname: "Queue Reversal", slug: "queue-reversal" },
    { pname: "Reverse an Array", slug: "reverse-an-array" },
    { pname: "Check K-th Bit", slug: "check-whether-k-th-bit-is-set-or-not-1587115620" },
    { pname: "Frequencies in a Limited Array", slug: "frequency-of-array-elements-1587115620" },
    { pname: "Array Leaders", slug: "leaders-in-an-array-1587115620" },
    { pname: "Floor in a Sorted Array", slug: "floor-in-a-sorted-array-1587115620" },
    { pname: "Sort a linked list of 0s, 1s and 2s", slug: "given-a-linked-list-of-0s-1s-and-2s-sort-it" },
    { pname: "Merge Sort", slug: "merge-sort" },
    { pname: "Bottom View of Binary Tree", slug: "bottom-view-of-binary-tree" },
    { pname: "Directed Graph Cycle", slug: "detect-cycle-in-a-directed-graph" },
    { pname: "Dijkstra Algorithm", slug: "implementing-dijkstra-set-1-adjacency-matrix" },
    { pname: "Minimum Spanning Tree", slug: "minimum-spanning-tree" },
    { pname: "Rat in a Maze", slug: "rat-in-a-maze-problem" },
    { pname: "Bipartite Graph", slug: "bipartite-graph" },
    { pname: "Topological Sort", slug: "topological-sort" },
    { pname: "Longest Increasing Subsequence", slug: "longest-increasing-subsequence-1587115620" },
    { pname: "0 - 1 Knapsack Problem", slug: "0-1-knapsack-problem0945" },
    { pname: "Rod Cutting", slug: "rod-cutting0840" },
    { pname: "Fractional Knapsack", slug: "fractional-knapsack-1587115620" },
    { pname: "Tower Of Hanoi", slug: "tower-of-hanoi-1587115621" },
    { pname: "Reverse a Stack", slug: "reverse-a-stack" },
    { pname: "Floyd Warshall", slug: "implementing-floyd-warshall2042" },
    { pname: "Bellman-Ford", slug: "distance-from-the-source-bellman-ford-algorithm" },
    { pname: "Number of Provinces", slug: "number-of-provinces" },
    { pname: "Number Of Islands", slug: "number-of-islands" },
    { pname: "GCD of two numbers", slug: "gcd-of-two-numbers3459" },
    { pname: "Armstrong Numbers", slug: "armstrong-numbers2727" },
    { pname: "Count Digits", slug: "count-digits5716" },
    { pname: "Frog Jump", slug: "geek-jump" },
    { pname: "Aggressive Cows", slug: "aggressive-cows" },
    { pname: "Subset Sum Problem", slug: "subset-sum-problem-1611555638" },
    { pname: "Maximum Sub Array", slug: "maximum-sub-array5443" },
    { pname: "Count Subarrays with given XOR", slug: "count-subarray-with-given-xor" },
  ];
  
  console.log('=== Topic Classification Test ===\n');
  
  const topicMap = {};
  let classified = 0;
  let unclassified = 0;
  
  for (const p of testProblems) {
    const topics = classifyProblemTopics(p.pname, p.slug);
    if (topics.length > 0) {
      classified++;
      for (const t of topics) {
        topicMap[t] = (topicMap[t] || 0) + 1;
      }
      console.log(`  ${p.pname} → ${topics.join(', ')}`);
    } else {
      unclassified++;
      console.log(`  ${p.pname} → ❌ UNCLASSIFIED`);
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Classified: ${classified}/${testProblems.length} (${Math.round(classified/testProblems.length*100)}%)`);
  console.log(`Unclassified: ${unclassified}`);
  console.log(`\nTopics found:`);
  
  const topics = Object.entries(topicMap).sort((a, b) => b[1] - a[1]);
  for (const [name, count] of topics) {
    console.log(`  ${name}: ${count}`);
  }
})();
