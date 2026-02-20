// Comprehensive DSA Problem Bank for Daily Challenges
// Contains problems from LeetCode, Codeforces, and CodeChef organized by topic

const problemsBank = {
  'Arrays': [
    // LeetCode Problems
    { name: 'Two Sum', link: 'https://leetcode.com/problems/two-sum/', difficulty: 'Easy', platform: 'leetcode', slug: 'two-sum' },
    { name: 'Best Time to Buy and Sell Stock', link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', difficulty: 'Easy', platform: 'leetcode', slug: 'best-time-to-buy-and-sell-stock' },
    { name: 'Contains Duplicate', link: 'https://leetcode.com/problems/contains-duplicate/', difficulty: 'Easy', platform: 'leetcode', slug: 'contains-duplicate' },
    { name: 'Single Number', link: 'https://leetcode.com/problems/single-number/', difficulty: 'Easy', platform: 'leetcode', slug: 'single-number' },
    { name: 'Move Zeroes', link: 'https://leetcode.com/problems/move-zeroes/', difficulty: 'Easy', platform: 'leetcode', slug: 'move-zeroes' },
    { name: 'Missing Number', link: 'https://leetcode.com/problems/missing-number/', difficulty: 'Easy', platform: 'leetcode', slug: 'missing-number' },
    { name: 'Majority Element', link: 'https://leetcode.com/problems/majority-element/', difficulty: 'Easy', platform: 'leetcode', slug: 'majority-element' },
    { name: 'Remove Duplicates from Sorted Array', link: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/', difficulty: 'Easy', platform: 'leetcode', slug: 'remove-duplicates-from-sorted-array' },
    { name: 'Plus One', link: 'https://leetcode.com/problems/plus-one/', difficulty: 'Easy', platform: 'leetcode', slug: 'plus-one' },
    { name: 'Pascal\'s Triangle', link: 'https://leetcode.com/problems/pascals-triangle/', difficulty: 'Easy', platform: 'leetcode', slug: 'pascals-triangle' },
    { name: 'Merge Sorted Array', link: 'https://leetcode.com/problems/merge-sorted-array/', difficulty: 'Easy', platform: 'leetcode', slug: 'merge-sorted-array' },
    { name: 'Intersection of Two Arrays II', link: 'https://leetcode.com/problems/intersection-of-two-arrays-ii/', difficulty: 'Easy', platform: 'leetcode', slug: 'intersection-of-two-arrays-ii' },
    { name: 'Running Sum of 1d Array', link: 'https://leetcode.com/problems/running-sum-of-1d-array/', difficulty: 'Easy', platform: 'leetcode', slug: 'running-sum-of-1d-array' },
    { name: 'Max Consecutive Ones', link: 'https://leetcode.com/problems/max-consecutive-ones/', difficulty: 'Easy', platform: 'leetcode', slug: 'max-consecutive-ones' },
    { name: 'Product of Array Except Self', link: 'https://leetcode.com/problems/product-of-array-except-self/', difficulty: 'Medium', platform: 'leetcode', slug: 'product-of-array-except-self' },
    { name: 'Maximum Subarray', link: 'https://leetcode.com/problems/maximum-subarray/', difficulty: 'Medium', platform: 'leetcode', slug: 'maximum-subarray' },
    { name: '3Sum', link: 'https://leetcode.com/problems/3sum/', difficulty: 'Medium', platform: 'leetcode', slug: '3sum' },
    { name: 'Container With Most Water', link: 'https://leetcode.com/problems/container-with-most-water/', difficulty: 'Medium', platform: 'leetcode', slug: 'container-with-most-water' },
    { name: 'Sort Colors', link: 'https://leetcode.com/problems/sort-colors/', difficulty: 'Medium', platform: 'leetcode', slug: 'sort-colors' },
    { name: 'Next Permutation', link: 'https://leetcode.com/problems/next-permutation/', difficulty: 'Medium', platform: 'leetcode', slug: 'next-permutation' },
    { name: 'Set Matrix Zeroes', link: 'https://leetcode.com/problems/set-matrix-zeroes/', difficulty: 'Medium', platform: 'leetcode', slug: 'set-matrix-zeroes' },
    { name: 'Rotate Image', link: 'https://leetcode.com/problems/rotate-image/', difficulty: 'Medium', platform: 'leetcode', slug: 'rotate-image' },
    { name: 'Spiral Matrix', link: 'https://leetcode.com/problems/spiral-matrix/', difficulty: 'Medium', platform: 'leetcode', slug: 'spiral-matrix' },
    { name: 'Merge Intervals', link: 'https://leetcode.com/problems/merge-intervals/', difficulty: 'Medium', platform: 'leetcode', slug: 'merge-intervals' },
    { name: 'Insert Interval', link: 'https://leetcode.com/problems/insert-interval/', difficulty: 'Medium', platform: 'leetcode', slug: 'insert-interval' },
    { name: 'Maximum Product Subarray', link: 'https://leetcode.com/problems/maximum-product-subarray/', difficulty: 'Medium', platform: 'leetcode', slug: 'maximum-product-subarray' },
    { name: 'Find the Duplicate Number', link: 'https://leetcode.com/problems/find-the-duplicate-number/', difficulty: 'Medium', platform: 'leetcode', slug: 'find-the-duplicate-number' },
    { name: 'Subarray Sum Equals K', link: 'https://leetcode.com/problems/subarray-sum-equals-k/', difficulty: 'Medium', platform: 'leetcode', slug: 'subarray-sum-equals-k' },
    { name: 'Longest Consecutive Sequence', link: 'https://leetcode.com/problems/longest-consecutive-sequence/', difficulty: 'Medium', platform: 'leetcode', slug: 'longest-consecutive-sequence' },
    { name: '4Sum', link: 'https://leetcode.com/problems/4sum/', difficulty: 'Medium', platform: 'leetcode', slug: '4sum' },
    { name: 'First Missing Positive', link: 'https://leetcode.com/problems/first-missing-positive/', difficulty: 'Hard', platform: 'leetcode', slug: 'first-missing-positive' },
    { name: 'Trapping Rain Water', link: 'https://leetcode.com/problems/trapping-rain-water/', difficulty: 'Hard', platform: 'leetcode', slug: 'trapping-rain-water' },
    { name: 'Reverse Pairs', link: 'https://leetcode.com/problems/reverse-pairs/', difficulty: 'Hard', platform: 'leetcode', slug: 'reverse-pairs' },
    { name: 'Median of Two Sorted Arrays', link: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', difficulty: 'Hard', platform: 'leetcode', slug: 'median-of-two-sorted-arrays' },
    // Codeforces Problems
    { name: 'Watermelon', link: 'https://codeforces.com/problemset/problem/4/A', difficulty: 'Easy', platform: 'codeforces', problemId: '4A' },
    { name: 'Theatre Square', link: 'https://codeforces.com/problemset/problem/1/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1A' },
    { name: 'Way Too Long Words', link: 'https://codeforces.com/problemset/problem/71/A', difficulty: 'Easy', platform: 'codeforces', problemId: '71A' },
    { name: 'Team', link: 'https://codeforces.com/problemset/problem/231/A', difficulty: 'Easy', platform: 'codeforces', problemId: '231A' },
    { name: 'Next Round', link: 'https://codeforces.com/problemset/problem/158/A', difficulty: 'Easy', platform: 'codeforces', problemId: '158A' },
    { name: 'Domino Piling', link: 'https://codeforces.com/problemset/problem/50/A', difficulty: 'Easy', platform: 'codeforces', problemId: '50A' },
    { name: 'Bit++', link: 'https://codeforces.com/problemset/problem/282/A', difficulty: 'Easy', platform: 'codeforces', problemId: '282A' },
    { name: 'Petya and Strings', link: 'https://codeforces.com/problemset/problem/112/A', difficulty: 'Easy', platform: 'codeforces', problemId: '112A' },
    { name: 'Football', link: 'https://codeforces.com/problemset/problem/96/A', difficulty: 'Easy', platform: 'codeforces', problemId: '96A' },
    { name: 'Beautiful Matrix', link: 'https://codeforces.com/problemset/problem/263/A', difficulty: 'Easy', platform: 'codeforces', problemId: '263A' },
    { name: 'Sum in the tree', link: 'https://codeforces.com/problemset/problem/1099/D', difficulty: 'Medium', platform: 'codeforces', problemId: '1099D' },
    { name: 'Array Stabilization', link: 'https://codeforces.com/problemset/problem/1095/B', difficulty: 'Easy', platform: 'codeforces', problemId: '1095B' },
    { name: 'Two Teams Composing', link: 'https://codeforces.com/problemset/problem/1335/C', difficulty: 'Easy', platform: 'codeforces', problemId: '1335C' },
    { name: 'Restoring Three Numbers', link: 'https://codeforces.com/problemset/problem/1154/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1154A' },
    { name: 'Array and Peaks', link: 'https://codeforces.com/problemset/problem/1513/C', difficulty: 'Medium', platform: 'codeforces', problemId: '1513C' },
    // CodeChef Problems
    { name: 'ATM', link: 'https://www.codechef.com/problems/HS08TEST', difficulty: 'Easy', platform: 'codechef', problemId: 'HS08TEST' },
    { name: 'Add Two Numbers', link: 'https://www.codechef.com/problems/FLOW001', difficulty: 'Easy', platform: 'codechef', problemId: 'FLOW001' },
    { name: 'Enormous Input Test', link: 'https://www.codechef.com/problems/INTEST', difficulty: 'Easy', platform: 'codechef', problemId: 'INTEST' },
    { name: 'Sum of Digits', link: 'https://www.codechef.com/problems/FLOW006', difficulty: 'Easy', platform: 'codechef', problemId: 'FLOW006' },
    { name: 'Find Remainder', link: 'https://www.codechef.com/problems/FLOW002', difficulty: 'Easy', platform: 'codechef', problemId: 'FLOW002' },
    { name: 'Small Factorials', link: 'https://www.codechef.com/problems/FCTRL2', difficulty: 'Easy', platform: 'codechef', problemId: 'FCTRL2' },
    { name: 'Chef and Dice', link: 'https://www.codechef.com/problems/CDROLL', difficulty: 'Easy', platform: 'codechef', problemId: 'CDROLL' },
    { name: 'Count Substrings', link: 'https://www.codechef.com/problems/CSUB', difficulty: 'Easy', platform: 'codechef', problemId: 'CSUB' },
    { name: 'Chef and Operator', link: 'https://www.codechef.com/problems/CHOPRT', difficulty: 'Easy', platform: 'codechef', problemId: 'CHOPRT' },
    { name: 'Valid Triangles', link: 'https://www.codechef.com/problems/FLOW013', difficulty: 'Easy', platform: 'codechef', problemId: 'FLOW013' },
  ],

  'Strings': [
    // LeetCode Problems
    { name: 'Valid Anagram', link: 'https://leetcode.com/problems/valid-anagram/', difficulty: 'Easy', platform: 'leetcode', slug: 'valid-anagram' },
    { name: 'Valid Palindrome', link: 'https://leetcode.com/problems/valid-palindrome/', difficulty: 'Easy', platform: 'leetcode', slug: 'valid-palindrome' },
    { name: 'Longest Common Prefix', link: 'https://leetcode.com/problems/longest-common-prefix/', difficulty: 'Easy', platform: 'leetcode', slug: 'longest-common-prefix' },
    { name: 'Reverse String', link: 'https://leetcode.com/problems/reverse-string/', difficulty: 'Easy', platform: 'leetcode', slug: 'reverse-string' },
    { name: 'First Unique Character', link: 'https://leetcode.com/problems/first-unique-character-in-a-string/', difficulty: 'Easy', platform: 'leetcode', slug: 'first-unique-character-in-a-string' },
    { name: 'Roman to Integer', link: 'https://leetcode.com/problems/roman-to-integer/', difficulty: 'Easy', platform: 'leetcode', slug: 'roman-to-integer' },
    { name: 'Implement strStr()', link: 'https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/', difficulty: 'Easy', platform: 'leetcode', slug: 'find-the-index-of-the-first-occurrence-in-a-string' },
    { name: 'Valid Parentheses', link: 'https://leetcode.com/problems/valid-parentheses/', difficulty: 'Easy', platform: 'leetcode', slug: 'valid-parentheses' },
    { name: 'Longest Substring Without Repeating', link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', difficulty: 'Medium', platform: 'leetcode', slug: 'longest-substring-without-repeating-characters' },
    { name: 'Longest Palindromic Substring', link: 'https://leetcode.com/problems/longest-palindromic-substring/', difficulty: 'Medium', platform: 'leetcode', slug: 'longest-palindromic-substring' },
    { name: 'Group Anagrams', link: 'https://leetcode.com/problems/group-anagrams/', difficulty: 'Medium', platform: 'leetcode', slug: 'group-anagrams' },
    { name: 'String to Integer (atoi)', link: 'https://leetcode.com/problems/string-to-integer-atoi/', difficulty: 'Medium', platform: 'leetcode', slug: 'string-to-integer-atoi' },
    { name: 'Longest Repeating Character Replacement', link: 'https://leetcode.com/problems/longest-repeating-character-replacement/', difficulty: 'Medium', platform: 'leetcode', slug: 'longest-repeating-character-replacement' },
    { name: 'Palindromic Substrings', link: 'https://leetcode.com/problems/palindromic-substrings/', difficulty: 'Medium', platform: 'leetcode', slug: 'palindromic-substrings' },
    { name: 'Generate Parentheses', link: 'https://leetcode.com/problems/generate-parentheses/', difficulty: 'Medium', platform: 'leetcode', slug: 'generate-parentheses' },
    { name: 'Minimum Window Substring', link: 'https://leetcode.com/problems/minimum-window-substring/', difficulty: 'Hard', platform: 'leetcode', slug: 'minimum-window-substring' },
    { name: 'Regular Expression Matching', link: 'https://leetcode.com/problems/regular-expression-matching/', difficulty: 'Hard', platform: 'leetcode', slug: 'regular-expression-matching' },
    { name: 'Wildcard Matching', link: 'https://leetcode.com/problems/wildcard-matching/', difficulty: 'Hard', platform: 'leetcode', slug: 'wildcard-matching' },
    // Codeforces Problems
    { name: 'Boy or Girl', link: 'https://codeforces.com/problemset/problem/236/A', difficulty: 'Easy', platform: 'codeforces', problemId: '236A' },
    { name: 'Word', link: 'https://codeforces.com/problemset/problem/59/A', difficulty: 'Easy', platform: 'codeforces', problemId: '59A' },
    { name: 'String Task', link: 'https://codeforces.com/problemset/problem/118/A', difficulty: 'Easy', platform: 'codeforces', problemId: '118A' },
    { name: 'Nearly Lucky Number', link: 'https://codeforces.com/problemset/problem/110/A', difficulty: 'Easy', platform: 'codeforces', problemId: '110A' },
    { name: 'Helpful Maths', link: 'https://codeforces.com/problemset/problem/339/A', difficulty: 'Easy', platform: 'codeforces', problemId: '339A' },
    { name: 'I Wanna Be the Guy', link: 'https://codeforces.com/problemset/problem/469/A', difficulty: 'Easy', platform: 'codeforces', problemId: '469A' },
    { name: 'Even Odds', link: 'https://codeforces.com/problemset/problem/318/A', difficulty: 'Easy', platform: 'codeforces', problemId: '318A' },
    { name: 'Panoramix\'s Prediction', link: 'https://codeforces.com/problemset/problem/80/A', difficulty: 'Easy', platform: 'codeforces', problemId: '80A' },
    { name: 'Insomnia Cure', link: 'https://codeforces.com/problemset/problem/148/A', difficulty: 'Easy', platform: 'codeforces', problemId: '148A' },
    { name: 'Chat Server\'s Outgoing Traffic', link: 'https://codeforces.com/problemset/problem/5/A', difficulty: 'Easy', platform: 'codeforces', problemId: '5A' },
    { name: 'Beautiful String', link: 'https://codeforces.com/problemset/problem/1265/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1265A' },
    { name: 'Diverse Strings', link: 'https://codeforces.com/problemset/problem/1144/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1144A' },
    { name: 'Vanya and Cards', link: 'https://codeforces.com/problemset/problem/401/A', difficulty: 'Easy', platform: 'codeforces', problemId: '401A' },
    // CodeChef Problems
    { name: 'Palindrome Check', link: 'https://www.codechef.com/problems/FLOW007', difficulty: 'Easy', platform: 'codechef', problemId: 'FLOW007' },
    { name: 'String Length', link: 'https://www.codechef.com/problems/STRLEN', difficulty: 'Easy', platform: 'codechef', problemId: 'STRLEN' },
    { name: 'Lucky Four', link: 'https://www.codechef.com/problems/LUCKYFR', difficulty: 'Easy', platform: 'codechef', problemId: 'LUCKYFR' },
    { name: 'Reverse The Number', link: 'https://www.codechef.com/problems/FLOW007', difficulty: 'Easy', platform: 'codechef', problemId: 'FLOW007' },
    { name: 'Chef and Strings', link: 'https://www.codechef.com/problems/CHFSTR', difficulty: 'Easy', platform: 'codechef', problemId: 'CHFSTR' },
    { name: 'Valid Pair', link: 'https://www.codechef.com/problems/VLDPAIR', difficulty: 'Easy', platform: 'codechef', problemId: 'VLDPAIR' },
    { name: 'Equal Strings', link: 'https://www.codechef.com/problems/EQUALST', difficulty: 'Medium', platform: 'codechef', problemId: 'EQUALST' },
  ],

  'Linked List': [
    // LeetCode Problems
    { name: 'Reverse Linked List', link: 'https://leetcode.com/problems/reverse-linked-list/', difficulty: 'Easy', platform: 'leetcode', slug: 'reverse-linked-list' },
    { name: 'Merge Two Sorted Lists', link: 'https://leetcode.com/problems/merge-two-sorted-lists/', difficulty: 'Easy', platform: 'leetcode', slug: 'merge-two-sorted-lists' },
    { name: 'Linked List Cycle', link: 'https://leetcode.com/problems/linked-list-cycle/', difficulty: 'Easy', platform: 'leetcode', slug: 'linked-list-cycle' },
    { name: 'Palindrome Linked List', link: 'https://leetcode.com/problems/palindrome-linked-list/', difficulty: 'Easy', platform: 'leetcode', slug: 'palindrome-linked-list' },
    { name: 'Remove Linked List Elements', link: 'https://leetcode.com/problems/remove-linked-list-elements/', difficulty: 'Easy', platform: 'leetcode', slug: 'remove-linked-list-elements' },
    { name: 'Middle of the Linked List', link: 'https://leetcode.com/problems/middle-of-the-linked-list/', difficulty: 'Easy', platform: 'leetcode', slug: 'middle-of-the-linked-list' },
    { name: 'Intersection of Two Linked Lists', link: 'https://leetcode.com/problems/intersection-of-two-linked-lists/', difficulty: 'Easy', platform: 'leetcode', slug: 'intersection-of-two-linked-lists' },
    { name: 'Add Two Numbers', link: 'https://leetcode.com/problems/add-two-numbers/', difficulty: 'Medium', platform: 'leetcode', slug: 'add-two-numbers' },
    { name: 'Remove Nth Node From End', link: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', difficulty: 'Medium', platform: 'leetcode', slug: 'remove-nth-node-from-end-of-list' },
    { name: 'Reorder List', link: 'https://leetcode.com/problems/reorder-list/', difficulty: 'Medium', platform: 'leetcode', slug: 'reorder-list' },
    { name: 'Copy List with Random Pointer', link: 'https://leetcode.com/problems/copy-list-with-random-pointer/', difficulty: 'Medium', platform: 'leetcode', slug: 'copy-list-with-random-pointer' },
    { name: 'Linked List Cycle II', link: 'https://leetcode.com/problems/linked-list-cycle-ii/', difficulty: 'Medium', platform: 'leetcode', slug: 'linked-list-cycle-ii' },
    { name: 'Sort List', link: 'https://leetcode.com/problems/sort-list/', difficulty: 'Medium', platform: 'leetcode', slug: 'sort-list' },
    { name: 'Odd Even Linked List', link: 'https://leetcode.com/problems/odd-even-linked-list/', difficulty: 'Medium', platform: 'leetcode', slug: 'odd-even-linked-list' },
    { name: 'LRU Cache', link: 'https://leetcode.com/problems/lru-cache/', difficulty: 'Medium', platform: 'leetcode', slug: 'lru-cache' },
    { name: 'Merge K Sorted Lists', link: 'https://leetcode.com/problems/merge-k-sorted-lists/', difficulty: 'Hard', platform: 'leetcode', slug: 'merge-k-sorted-lists' },
    { name: 'Reverse Nodes in K-Group', link: 'https://leetcode.com/problems/reverse-nodes-in-k-group/', difficulty: 'Hard', platform: 'leetcode', slug: 'reverse-nodes-in-k-group' },
    { name: 'LFU Cache', link: 'https://leetcode.com/problems/lfu-cache/', difficulty: 'Hard', platform: 'leetcode', slug: 'lfu-cache' },
  ],

  'Binary Search': [
    // LeetCode Problems
    { name: 'Binary Search', link: 'https://leetcode.com/problems/binary-search/', difficulty: 'Easy', platform: 'leetcode', slug: 'binary-search' },
    { name: 'Search Insert Position', link: 'https://leetcode.com/problems/search-insert-position/', difficulty: 'Easy', platform: 'leetcode', slug: 'search-insert-position' },
    { name: 'Sqrt(x)', link: 'https://leetcode.com/problems/sqrtx/', difficulty: 'Easy', platform: 'leetcode', slug: 'sqrtx' },
    { name: 'First Bad Version', link: 'https://leetcode.com/problems/first-bad-version/', difficulty: 'Easy', platform: 'leetcode', slug: 'first-bad-version' },
    { name: 'Search in Rotated Sorted Array', link: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', difficulty: 'Medium', platform: 'leetcode', slug: 'search-in-rotated-sorted-array' },
    { name: 'Find Minimum in Rotated Sorted Array', link: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', difficulty: 'Medium', platform: 'leetcode', slug: 'find-minimum-in-rotated-sorted-array' },
    { name: 'Find First and Last Position', link: 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/', difficulty: 'Medium', platform: 'leetcode', slug: 'find-first-and-last-position-of-element-in-sorted-array' },
    { name: 'Search a 2D Matrix', link: 'https://leetcode.com/problems/search-a-2d-matrix/', difficulty: 'Medium', platform: 'leetcode', slug: 'search-a-2d-matrix' },
    { name: 'Koko Eating Bananas', link: 'https://leetcode.com/problems/koko-eating-bananas/', difficulty: 'Medium', platform: 'leetcode', slug: 'koko-eating-bananas' },
    { name: 'Find Peak Element', link: 'https://leetcode.com/problems/find-peak-element/', difficulty: 'Medium', platform: 'leetcode', slug: 'find-peak-element' },
    { name: 'Single Element in Sorted Array', link: 'https://leetcode.com/problems/single-element-in-a-sorted-array/', difficulty: 'Medium', platform: 'leetcode', slug: 'single-element-in-a-sorted-array' },
    { name: 'Capacity to Ship Packages', link: 'https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/', difficulty: 'Medium', platform: 'leetcode', slug: 'capacity-to-ship-packages-within-d-days' },
    { name: 'Median of Two Sorted Arrays', link: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', difficulty: 'Hard', platform: 'leetcode', slug: 'median-of-two-sorted-arrays' },
    { name: 'Split Array Largest Sum', link: 'https://leetcode.com/problems/split-array-largest-sum/', difficulty: 'Hard', platform: 'leetcode', slug: 'split-array-largest-sum' },
    // Codeforces Problems
    { name: 'Burning Midnight Oil', link: 'https://codeforces.com/problemset/problem/165/B', difficulty: 'Medium', platform: 'codeforces', problemId: '165B' },
    { name: 'Hamburgers', link: 'https://codeforces.com/problemset/problem/371/C', difficulty: 'Medium', platform: 'codeforces', problemId: '371C' },
    { name: 'Sagheer and Nubian Market', link: 'https://codeforces.com/problemset/problem/812/C', difficulty: 'Medium', platform: 'codeforces', problemId: '812C' },
    { name: 'K-th Not Divisible by n', link: 'https://codeforces.com/problemset/problem/1352/C', difficulty: 'Easy', platform: 'codeforces', problemId: '1352C' },
    { name: 'Frodo and pillows', link: 'https://codeforces.com/problemset/problem/760/B', difficulty: 'Medium', platform: 'codeforces', problemId: '760B' },
    { name: 'Magic Powder - 1', link: 'https://codeforces.com/problemset/problem/670/D1', difficulty: 'Easy', platform: 'codeforces', problemId: '670D1' },
    { name: 'Maximum Median', link: 'https://codeforces.com/problemset/problem/1201/C', difficulty: 'Medium', platform: 'codeforces', problemId: '1201C' },
    // CodeChef Problems
    { name: 'Binary Search', link: 'https://www.codechef.com/problems/BSEARCH', difficulty: 'Easy', platform: 'codechef', problemId: 'BSEARCH' },
    { name: 'Sticks', link: 'https://www.codechef.com/problems/STICKS', difficulty: 'Medium', platform: 'codechef', problemId: 'STICKS' },
  ],

  'Trees': [
    // LeetCode Problems
    { name: 'Maximum Depth of Binary Tree', link: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', difficulty: 'Easy', platform: 'leetcode', slug: 'maximum-depth-of-binary-tree' },
    { name: 'Same Tree', link: 'https://leetcode.com/problems/same-tree/', difficulty: 'Easy', platform: 'leetcode', slug: 'same-tree' },
    { name: 'Invert Binary Tree', link: 'https://leetcode.com/problems/invert-binary-tree/', difficulty: 'Easy', platform: 'leetcode', slug: 'invert-binary-tree' },
    { name: 'Symmetric Tree', link: 'https://leetcode.com/problems/symmetric-tree/', difficulty: 'Easy', platform: 'leetcode', slug: 'symmetric-tree' },
    { name: 'Subtree of Another Tree', link: 'https://leetcode.com/problems/subtree-of-another-tree/', difficulty: 'Easy', platform: 'leetcode', slug: 'subtree-of-another-tree' },
    { name: 'Diameter of Binary Tree', link: 'https://leetcode.com/problems/diameter-of-binary-tree/', difficulty: 'Easy', platform: 'leetcode', slug: 'diameter-of-binary-tree' },
    { name: 'Balanced Binary Tree', link: 'https://leetcode.com/problems/balanced-binary-tree/', difficulty: 'Easy', platform: 'leetcode', slug: 'balanced-binary-tree' },
    { name: 'Path Sum', link: 'https://leetcode.com/problems/path-sum/', difficulty: 'Easy', platform: 'leetcode', slug: 'path-sum' },
    { name: 'Binary Tree Level Order Traversal', link: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', difficulty: 'Medium', platform: 'leetcode', slug: 'binary-tree-level-order-traversal' },
    { name: 'Validate Binary Search Tree', link: 'https://leetcode.com/problems/validate-binary-search-tree/', difficulty: 'Medium', platform: 'leetcode', slug: 'validate-binary-search-tree' },
    { name: 'Lowest Common Ancestor', link: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', difficulty: 'Medium', platform: 'leetcode', slug: 'lowest-common-ancestor-of-a-binary-tree' },
    { name: 'Binary Tree Right Side View', link: 'https://leetcode.com/problems/binary-tree-right-side-view/', difficulty: 'Medium', platform: 'leetcode', slug: 'binary-tree-right-side-view' },
    { name: 'Kth Smallest Element in BST', link: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/', difficulty: 'Medium', platform: 'leetcode', slug: 'kth-smallest-element-in-a-bst' },
    { name: 'Construct BT from Preorder Inorder', link: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/', difficulty: 'Medium', platform: 'leetcode', slug: 'construct-binary-tree-from-preorder-and-inorder-traversal' },
    { name: 'Binary Tree Maximum Path Sum', link: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', difficulty: 'Hard', platform: 'leetcode', slug: 'binary-tree-maximum-path-sum' },
    { name: 'Serialize and Deserialize BT', link: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', difficulty: 'Hard', platform: 'leetcode', slug: 'serialize-and-deserialize-binary-tree' },
    // Codeforces Problems
    { name: 'Tree Queries', link: 'https://codeforces.com/problemset/problem/1328/E', difficulty: 'Medium', platform: 'codeforces', problemId: '1328E' },
    { name: 'Distance in Tree', link: 'https://codeforces.com/problemset/problem/161/D', difficulty: 'Medium', platform: 'codeforces', problemId: '161D' },
    { name: 'Appleman and Tree', link: 'https://codeforces.com/problemset/problem/461/B', difficulty: 'Medium', platform: 'codeforces', problemId: '461B' },
  ],

  'Dynamic Programming': [
    // LeetCode Problems
    { name: 'Climbing Stairs', link: 'https://leetcode.com/problems/climbing-stairs/', difficulty: 'Easy', platform: 'leetcode', slug: 'climbing-stairs' },
    { name: 'Min Cost Climbing Stairs', link: 'https://leetcode.com/problems/min-cost-climbing-stairs/', difficulty: 'Easy', platform: 'leetcode', slug: 'min-cost-climbing-stairs' },
    { name: 'Fibonacci Number', link: 'https://leetcode.com/problems/fibonacci-number/', difficulty: 'Easy', platform: 'leetcode', slug: 'fibonacci-number' },
    { name: 'Maximum Subarray', link: 'https://leetcode.com/problems/maximum-subarray/', difficulty: 'Medium', platform: 'leetcode', slug: 'maximum-subarray' },
    { name: 'House Robber', link: 'https://leetcode.com/problems/house-robber/', difficulty: 'Medium', platform: 'leetcode', slug: 'house-robber' },
    { name: 'House Robber II', link: 'https://leetcode.com/problems/house-robber-ii/', difficulty: 'Medium', platform: 'leetcode', slug: 'house-robber-ii' },
    { name: 'Coin Change', link: 'https://leetcode.com/problems/coin-change/', difficulty: 'Medium', platform: 'leetcode', slug: 'coin-change' },
    { name: 'Coin Change II', link: 'https://leetcode.com/problems/coin-change-ii/', difficulty: 'Medium', platform: 'leetcode', slug: 'coin-change-ii' },
    { name: 'Longest Increasing Subsequence', link: 'https://leetcode.com/problems/longest-increasing-subsequence/', difficulty: 'Medium', platform: 'leetcode', slug: 'longest-increasing-subsequence' },
    { name: 'Longest Common Subsequence', link: 'https://leetcode.com/problems/longest-common-subsequence/', difficulty: 'Medium', platform: 'leetcode', slug: 'longest-common-subsequence' },
    { name: 'Word Break', link: 'https://leetcode.com/problems/word-break/', difficulty: 'Medium', platform: 'leetcode', slug: 'word-break' },
    { name: 'Unique Paths', link: 'https://leetcode.com/problems/unique-paths/', difficulty: 'Medium', platform: 'leetcode', slug: 'unique-paths' },
    { name: 'Minimum Path Sum', link: 'https://leetcode.com/problems/minimum-path-sum/', difficulty: 'Medium', platform: 'leetcode', slug: 'minimum-path-sum' },
    { name: 'Triangle', link: 'https://leetcode.com/problems/triangle/', difficulty: 'Medium', platform: 'leetcode', slug: 'triangle' },
    { name: 'Target Sum', link: 'https://leetcode.com/problems/target-sum/', difficulty: 'Medium', platform: 'leetcode', slug: 'target-sum' },
    { name: 'Partition Equal Subset Sum', link: 'https://leetcode.com/problems/partition-equal-subset-sum/', difficulty: 'Medium', platform: 'leetcode', slug: 'partition-equal-subset-sum' },
    { name: 'Decode Ways', link: 'https://leetcode.com/problems/decode-ways/', difficulty: 'Medium', platform: 'leetcode', slug: 'decode-ways' },
    { name: 'Edit Distance', link: 'https://leetcode.com/problems/edit-distance/', difficulty: 'Hard', platform: 'leetcode', slug: 'edit-distance' },
    { name: 'Burst Balloons', link: 'https://leetcode.com/problems/burst-balloons/', difficulty: 'Hard', platform: 'leetcode', slug: 'burst-balloons' },
    { name: 'Super Egg Drop', link: 'https://leetcode.com/problems/super-egg-drop/', difficulty: 'Hard', platform: 'leetcode', slug: 'super-egg-drop' },
    // Codeforces Problems
    { name: 'Boredom', link: 'https://codeforces.com/problemset/problem/455/A', difficulty: 'Medium', platform: 'codeforces', problemId: '455A' },
    { name: 'Longest Regular Bracket', link: 'https://codeforces.com/problemset/problem/5/C', difficulty: 'Medium', platform: 'codeforces', problemId: '5C' },
    { name: 'Flowers', link: 'https://codeforces.com/problemset/problem/474/D', difficulty: 'Medium', platform: 'codeforces', problemId: '474D' },
    { name: 'Vacations', link: 'https://codeforces.com/problemset/problem/698/A', difficulty: 'Easy', platform: 'codeforces', problemId: '698A' },
    { name: 'Mortal Kombat Tower', link: 'https://codeforces.com/problemset/problem/1418/C', difficulty: 'Medium', platform: 'codeforces', problemId: '1418C' },
    { name: 'Cut Ribbon', link: 'https://codeforces.com/problemset/problem/189/A', difficulty: 'Easy', platform: 'codeforces', problemId: '189A' },
    { name: 'Catch Overflow!', link: 'https://codeforces.com/problemset/problem/1175/B', difficulty: 'Medium', platform: 'codeforces', problemId: '1175B' },
    { name: 'Yet Another Problem On a Subsequence', link: 'https://codeforces.com/problemset/problem/1000/D', difficulty: 'Hard', platform: 'codeforces', problemId: '1000D' },
    // CodeChef Problems
    { name: 'Chef and Digits', link: 'https://www.codechef.com/problems/COOK82C', difficulty: 'Medium', platform: 'codechef', problemId: 'COOK82C' },
    { name: 'Magic Pairs', link: 'https://www.codechef.com/problems/MAGPAIR', difficulty: 'Medium', platform: 'codechef', problemId: 'MAGPAIR' },
    { name: 'Chef and Strange Matrix', link: 'https://www.codechef.com/problems/CHEFMAT', difficulty: 'Medium', platform: 'codechef', problemId: 'CHEFMAT' },
  ],

  'Graphs': [
    // LeetCode Problems
    { name: 'Find if Path Exists', link: 'https://leetcode.com/problems/find-if-path-exists-in-graph/', difficulty: 'Easy', platform: 'leetcode', slug: 'find-if-path-exists-in-graph' },
    { name: 'Number of Islands', link: 'https://leetcode.com/problems/number-of-islands/', difficulty: 'Medium', platform: 'leetcode', slug: 'number-of-islands' },
    { name: 'Clone Graph', link: 'https://leetcode.com/problems/clone-graph/', difficulty: 'Medium', platform: 'leetcode', slug: 'clone-graph' },
    { name: 'Course Schedule', link: 'https://leetcode.com/problems/course-schedule/', difficulty: 'Medium', platform: 'leetcode', slug: 'course-schedule' },
    { name: 'Course Schedule II', link: 'https://leetcode.com/problems/course-schedule-ii/', difficulty: 'Medium', platform: 'leetcode', slug: 'course-schedule-ii' },
    { name: 'Pacific Atlantic Water Flow', link: 'https://leetcode.com/problems/pacific-atlantic-water-flow/', difficulty: 'Medium', platform: 'leetcode', slug: 'pacific-atlantic-water-flow' },
    { name: 'Rotting Oranges', link: 'https://leetcode.com/problems/rotting-oranges/', difficulty: 'Medium', platform: 'leetcode', slug: 'rotting-oranges' },
    { name: 'Surrounded Regions', link: 'https://leetcode.com/problems/surrounded-regions/', difficulty: 'Medium', platform: 'leetcode', slug: 'surrounded-regions' },
    { name: 'Number of Provinces', link: 'https://leetcode.com/problems/number-of-provinces/', difficulty: 'Medium', platform: 'leetcode', slug: 'number-of-provinces' },
    { name: 'Max Area of Island', link: 'https://leetcode.com/problems/max-area-of-island/', difficulty: 'Medium', platform: 'leetcode', slug: 'max-area-of-island' },
    { name: 'Flood Fill', link: 'https://leetcode.com/problems/flood-fill/', difficulty: 'Easy', platform: 'leetcode', slug: 'flood-fill' },
    { name: 'Is Graph Bipartite', link: 'https://leetcode.com/problems/is-graph-bipartite/', difficulty: 'Medium', platform: 'leetcode', slug: 'is-graph-bipartite' },
    { name: 'Network Delay Time', link: 'https://leetcode.com/problems/network-delay-time/', difficulty: 'Medium', platform: 'leetcode', slug: 'network-delay-time' },
    { name: 'Cheapest Flights K Stops', link: 'https://leetcode.com/problems/cheapest-flights-within-k-stops/', difficulty: 'Medium', platform: 'leetcode', slug: 'cheapest-flights-within-k-stops' },
    { name: 'Redundant Connection', link: 'https://leetcode.com/problems/redundant-connection/', difficulty: 'Medium', platform: 'leetcode', slug: 'redundant-connection' },
    { name: 'Accounts Merge', link: 'https://leetcode.com/problems/accounts-merge/', difficulty: 'Medium', platform: 'leetcode', slug: 'accounts-merge' },
    { name: 'Word Ladder', link: 'https://leetcode.com/problems/word-ladder/', difficulty: 'Hard', platform: 'leetcode', slug: 'word-ladder' },
    { name: 'Critical Connections', link: 'https://leetcode.com/problems/critical-connections-in-a-network/', difficulty: 'Hard', platform: 'leetcode', slug: 'critical-connections-in-a-network' },
    // Codeforces Problems
    { name: 'King Escape', link: 'https://codeforces.com/problemset/problem/1033/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1033A' },
    { name: 'Mike and Shortcuts', link: 'https://codeforces.com/problemset/problem/689/B', difficulty: 'Medium', platform: 'codeforces', problemId: '689B' },
    { name: 'Roads not only in Berland', link: 'https://codeforces.com/problemset/problem/25/D', difficulty: 'Medium', platform: 'codeforces', problemId: '25D' },
    { name: 'Learning Languages', link: 'https://codeforces.com/problemset/problem/277/A', difficulty: 'Medium', platform: 'codeforces', problemId: '277A' },
    { name: 'Dijkstra?', link: 'https://codeforces.com/problemset/problem/20/C', difficulty: 'Medium', platform: 'codeforces', problemId: '20C' },
    { name: 'New Year Transportation', link: 'https://codeforces.com/problemset/problem/500/A', difficulty: 'Easy', platform: 'codeforces', problemId: '500A' },
    { name: 'Shortest Path with Obstacle', link: 'https://codeforces.com/problemset/problem/1547/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1547A' },
    { name: 'Three Paths on a Tree', link: 'https://codeforces.com/problemset/problem/1294/F', difficulty: 'Hard', platform: 'codeforces', problemId: '1294F' },
    // CodeChef Problems
    { name: 'FIRESC', link: 'https://www.codechef.com/problems/FIRESC', difficulty: 'Medium', platform: 'codechef', problemId: 'FIRESC' },
    { name: 'Bipartite Graph Check', link: 'https://www.codechef.com/problems/APTS', difficulty: 'Medium', platform: 'codechef', problemId: 'APTS' },
  ],

  'Backtracking': [
    // LeetCode Problems
    { name: 'Subsets', link: 'https://leetcode.com/problems/subsets/', difficulty: 'Medium', platform: 'leetcode', slug: 'subsets' },
    { name: 'Subsets II', link: 'https://leetcode.com/problems/subsets-ii/', difficulty: 'Medium', platform: 'leetcode', slug: 'subsets-ii' },
    { name: 'Permutations', link: 'https://leetcode.com/problems/permutations/', difficulty: 'Medium', platform: 'leetcode', slug: 'permutations' },
    { name: 'Permutations II', link: 'https://leetcode.com/problems/permutations-ii/', difficulty: 'Medium', platform: 'leetcode', slug: 'permutations-ii' },
    { name: 'Combination Sum', link: 'https://leetcode.com/problems/combination-sum/', difficulty: 'Medium', platform: 'leetcode', slug: 'combination-sum' },
    { name: 'Combination Sum II', link: 'https://leetcode.com/problems/combination-sum-ii/', difficulty: 'Medium', platform: 'leetcode', slug: 'combination-sum-ii' },
    { name: 'Combinations', link: 'https://leetcode.com/problems/combinations/', difficulty: 'Medium', platform: 'leetcode', slug: 'combinations' },
    { name: 'Letter Combinations of Phone', link: 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/', difficulty: 'Medium', platform: 'leetcode', slug: 'letter-combinations-of-a-phone-number' },
    { name: 'Word Search', link: 'https://leetcode.com/problems/word-search/', difficulty: 'Medium', platform: 'leetcode', slug: 'word-search' },
    { name: 'Palindrome Partitioning', link: 'https://leetcode.com/problems/palindrome-partitioning/', difficulty: 'Medium', platform: 'leetcode', slug: 'palindrome-partitioning' },
    { name: 'Generate Parentheses', link: 'https://leetcode.com/problems/generate-parentheses/', difficulty: 'Medium', platform: 'leetcode', slug: 'generate-parentheses' },
    { name: 'N-Queens', link: 'https://leetcode.com/problems/n-queens/', difficulty: 'Hard', platform: 'leetcode', slug: 'n-queens' },
    { name: 'Sudoku Solver', link: 'https://leetcode.com/problems/sudoku-solver/', difficulty: 'Hard', platform: 'leetcode', slug: 'sudoku-solver' },
    { name: 'Word Search II', link: 'https://leetcode.com/problems/word-search-ii/', difficulty: 'Hard', platform: 'leetcode', slug: 'word-search-ii' },
    // Codeforces Problems
    { name: 'Vanya and Cards', link: 'https://codeforces.com/problemset/problem/401/A', difficulty: 'Easy', platform: 'codeforces', problemId: '401A' },
    { name: 'Maximum Splitting', link: 'https://codeforces.com/problemset/problem/872/B', difficulty: 'Easy', platform: 'codeforces', problemId: '872B' },
  ],

  'Stack & Queue': [
    // LeetCode Problems
    { name: 'Valid Parentheses', link: 'https://leetcode.com/problems/valid-parentheses/', difficulty: 'Easy', platform: 'leetcode', slug: 'valid-parentheses' },
    { name: 'Implement Queue using Stacks', link: 'https://leetcode.com/problems/implement-queue-using-stacks/', difficulty: 'Easy', platform: 'leetcode', slug: 'implement-queue-using-stacks' },
    { name: 'Implement Stack using Queues', link: 'https://leetcode.com/problems/implement-stack-using-queues/', difficulty: 'Easy', platform: 'leetcode', slug: 'implement-stack-using-queues' },
    { name: 'Next Greater Element I', link: 'https://leetcode.com/problems/next-greater-element-i/', difficulty: 'Easy', platform: 'leetcode', slug: 'next-greater-element-i' },
    { name: 'Min Stack', link: 'https://leetcode.com/problems/min-stack/', difficulty: 'Medium', platform: 'leetcode', slug: 'min-stack' },
    { name: 'Evaluate Reverse Polish Notation', link: 'https://leetcode.com/problems/evaluate-reverse-polish-notation/', difficulty: 'Medium', platform: 'leetcode', slug: 'evaluate-reverse-polish-notation' },
    { name: 'Daily Temperatures', link: 'https://leetcode.com/problems/daily-temperatures/', difficulty: 'Medium', platform: 'leetcode', slug: 'daily-temperatures' },
    { name: 'Car Fleet', link: 'https://leetcode.com/problems/car-fleet/', difficulty: 'Medium', platform: 'leetcode', slug: 'car-fleet' },
    { name: 'Online Stock Span', link: 'https://leetcode.com/problems/online-stock-span/', difficulty: 'Medium', platform: 'leetcode', slug: 'online-stock-span' },
    { name: 'Remove K Digits', link: 'https://leetcode.com/problems/remove-k-digits/', difficulty: 'Medium', platform: 'leetcode', slug: 'remove-k-digits' },
    { name: 'Decode String', link: 'https://leetcode.com/problems/decode-string/', difficulty: 'Medium', platform: 'leetcode', slug: 'decode-string' },
    { name: 'Largest Rectangle in Histogram', link: 'https://leetcode.com/problems/largest-rectangle-in-histogram/', difficulty: 'Hard', platform: 'leetcode', slug: 'largest-rectangle-in-histogram' },
    { name: 'Maximal Rectangle', link: 'https://leetcode.com/problems/maximal-rectangle/', difficulty: 'Hard', platform: 'leetcode', slug: 'maximal-rectangle' },
    { name: 'Sliding Window Maximum', link: 'https://leetcode.com/problems/sliding-window-maximum/', difficulty: 'Hard', platform: 'leetcode', slug: 'sliding-window-maximum' },
    // Codeforces Problems
    { name: 'Stock Market', link: 'https://codeforces.com/problemset/problem/1150/B', difficulty: 'Medium', platform: 'codeforces', problemId: '1150B' },
    { name: 'Maximum Xor Secondary', link: 'https://codeforces.com/problemset/problem/281/D', difficulty: 'Hard', platform: 'codeforces', problemId: '281D' },
  ],

  'Heap': [
    // LeetCode Problems
    { name: 'Kth Largest Element in Stream', link: 'https://leetcode.com/problems/kth-largest-element-in-a-stream/', difficulty: 'Easy', platform: 'leetcode', slug: 'kth-largest-element-in-a-stream' },
    { name: 'Last Stone Weight', link: 'https://leetcode.com/problems/last-stone-weight/', difficulty: 'Easy', platform: 'leetcode', slug: 'last-stone-weight' },
    { name: 'Kth Largest Element in Array', link: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', difficulty: 'Medium', platform: 'leetcode', slug: 'kth-largest-element-in-an-array' },
    { name: 'Top K Frequent Elements', link: 'https://leetcode.com/problems/top-k-frequent-elements/', difficulty: 'Medium', platform: 'leetcode', slug: 'top-k-frequent-elements' },
    { name: 'K Closest Points to Origin', link: 'https://leetcode.com/problems/k-closest-points-to-origin/', difficulty: 'Medium', platform: 'leetcode', slug: 'k-closest-points-to-origin' },
    { name: 'Task Scheduler', link: 'https://leetcode.com/problems/task-scheduler/', difficulty: 'Medium', platform: 'leetcode', slug: 'task-scheduler' },
    { name: 'Design Twitter', link: 'https://leetcode.com/problems/design-twitter/', difficulty: 'Medium', platform: 'leetcode', slug: 'design-twitter' },
    { name: 'Reorganize String', link: 'https://leetcode.com/problems/reorganize-string/', difficulty: 'Medium', platform: 'leetcode', slug: 'reorganize-string' },
    { name: 'Find Median from Data Stream', link: 'https://leetcode.com/problems/find-median-from-data-stream/', difficulty: 'Hard', platform: 'leetcode', slug: 'find-median-from-data-stream' },
    { name: 'Merge K Sorted Lists', link: 'https://leetcode.com/problems/merge-k-sorted-lists/', difficulty: 'Hard', platform: 'leetcode', slug: 'merge-k-sorted-lists' },
    // Codeforces Problems
    { name: 'Minimal Square', link: 'https://codeforces.com/problemset/problem/1360/B', difficulty: 'Easy', platform: 'codeforces', problemId: '1360B' },
    { name: 'Greedy Shopping', link: 'https://codeforces.com/problemset/problem/1280/B', difficulty: 'Medium', platform: 'codeforces', problemId: '1280B' },
  ],

  'Greedy': [
    // LeetCode Problems
    { name: 'Assign Cookies', link: 'https://leetcode.com/problems/assign-cookies/', difficulty: 'Easy', platform: 'leetcode', slug: 'assign-cookies' },
    { name: 'Lemonade Change', link: 'https://leetcode.com/problems/lemonade-change/', difficulty: 'Easy', platform: 'leetcode', slug: 'lemonade-change' },
    { name: 'Jump Game', link: 'https://leetcode.com/problems/jump-game/', difficulty: 'Medium', platform: 'leetcode', slug: 'jump-game' },
    { name: 'Jump Game II', link: 'https://leetcode.com/problems/jump-game-ii/', difficulty: 'Medium', platform: 'leetcode', slug: 'jump-game-ii' },
    { name: 'Gas Station', link: 'https://leetcode.com/problems/gas-station/', difficulty: 'Medium', platform: 'leetcode', slug: 'gas-station' },
    { name: 'Partition Labels', link: 'https://leetcode.com/problems/partition-labels/', difficulty: 'Medium', platform: 'leetcode', slug: 'partition-labels' },
    { name: 'Valid Parenthesis String', link: 'https://leetcode.com/problems/valid-parenthesis-string/', difficulty: 'Medium', platform: 'leetcode', slug: 'valid-parenthesis-string' },
    { name: 'Hand of Straights', link: 'https://leetcode.com/problems/hand-of-straights/', difficulty: 'Medium', platform: 'leetcode', slug: 'hand-of-straights' },
    { name: 'Non-overlapping Intervals', link: 'https://leetcode.com/problems/non-overlapping-intervals/', difficulty: 'Medium', platform: 'leetcode', slug: 'non-overlapping-intervals' },
    { name: 'Candy', link: 'https://leetcode.com/problems/candy/', difficulty: 'Hard', platform: 'leetcode', slug: 'candy' },
    // Codeforces Problems
    { name: 'George and Accommodation', link: 'https://codeforces.com/problemset/problem/467/A', difficulty: 'Easy', platform: 'codeforces', problemId: '467A' },
    { name: 'Anton and Letters', link: 'https://codeforces.com/problemset/problem/443/A', difficulty: 'Easy', platform: 'codeforces', problemId: '443A' },
    { name: 'Polycarp and Coins', link: 'https://codeforces.com/problemset/problem/1551/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1551A' },
    { name: 'Chocolates', link: 'https://codeforces.com/problemset/problem/1139/B', difficulty: 'Easy', platform: 'codeforces', problemId: '1139B' },
    { name: 'Nastya and Door', link: 'https://codeforces.com/problemset/problem/1341/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1341A' },
    // CodeChef Problems
    { name: 'Chef and Remissness', link: 'https://www.codechef.com/problems/CHEFREMI', difficulty: 'Easy', platform: 'codechef', problemId: 'CHEFREMI' },
    { name: 'Buying New Tablet', link: 'https://www.codechef.com/problems/TABLET', difficulty: 'Easy', platform: 'codechef', problemId: 'TABLET' },
  ],

  'Two Pointers': [
    // LeetCode Problems
    { name: 'Valid Palindrome', link: 'https://leetcode.com/problems/valid-palindrome/', difficulty: 'Easy', platform: 'leetcode', slug: 'valid-palindrome' },
    { name: 'Merge Sorted Array', link: 'https://leetcode.com/problems/merge-sorted-array/', difficulty: 'Easy', platform: 'leetcode', slug: 'merge-sorted-array' },
    { name: 'Remove Duplicates from Sorted Array', link: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/', difficulty: 'Easy', platform: 'leetcode', slug: 'remove-duplicates-from-sorted-array' },
    { name: 'Move Zeroes', link: 'https://leetcode.com/problems/move-zeroes/', difficulty: 'Easy', platform: 'leetcode', slug: 'move-zeroes' },
    { name: 'Squares of Sorted Array', link: 'https://leetcode.com/problems/squares-of-a-sorted-array/', difficulty: 'Easy', platform: 'leetcode', slug: 'squares-of-a-sorted-array' },
    { name: 'Two Sum II', link: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', difficulty: 'Medium', platform: 'leetcode', slug: 'two-sum-ii-input-array-is-sorted' },
    { name: '3Sum', link: 'https://leetcode.com/problems/3sum/', difficulty: 'Medium', platform: 'leetcode', slug: '3sum' },
    { name: '3Sum Closest', link: 'https://leetcode.com/problems/3sum-closest/', difficulty: 'Medium', platform: 'leetcode', slug: '3sum-closest' },
    { name: '4Sum', link: 'https://leetcode.com/problems/4sum/', difficulty: 'Medium', platform: 'leetcode', slug: '4sum' },
    { name: 'Container With Most Water', link: 'https://leetcode.com/problems/container-with-most-water/', difficulty: 'Medium', platform: 'leetcode', slug: 'container-with-most-water' },
    { name: 'Trapping Rain Water', link: 'https://leetcode.com/problems/trapping-rain-water/', difficulty: 'Hard', platform: 'leetcode', slug: 'trapping-rain-water' },
    // Codeforces Problems
    { name: 'Books', link: 'https://codeforces.com/problemset/problem/279/B', difficulty: 'Medium', platform: 'codeforces', problemId: '279B' },
    { name: 'Cellular Network', link: 'https://codeforces.com/problemset/problem/702/C', difficulty: 'Medium', platform: 'codeforces', problemId: '702C' },
  ],

  'Sliding Window': [
    // LeetCode Problems
    { name: 'Best Time Buy Sell Stock', link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', difficulty: 'Easy', platform: 'leetcode', slug: 'best-time-to-buy-and-sell-stock' },
    { name: 'Contains Duplicate II', link: 'https://leetcode.com/problems/contains-duplicate-ii/', difficulty: 'Easy', platform: 'leetcode', slug: 'contains-duplicate-ii' },
    { name: 'Longest Substring Without Repeating', link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', difficulty: 'Medium', platform: 'leetcode', slug: 'longest-substring-without-repeating-characters' },
    { name: 'Longest Repeating Character Replacement', link: 'https://leetcode.com/problems/longest-repeating-character-replacement/', difficulty: 'Medium', platform: 'leetcode', slug: 'longest-repeating-character-replacement' },
    { name: 'Permutation in String', link: 'https://leetcode.com/problems/permutation-in-string/', difficulty: 'Medium', platform: 'leetcode', slug: 'permutation-in-string' },
    { name: 'Max Consecutive Ones III', link: 'https://leetcode.com/problems/max-consecutive-ones-iii/', difficulty: 'Medium', platform: 'leetcode', slug: 'max-consecutive-ones-iii' },
    { name: 'Fruit Into Baskets', link: 'https://leetcode.com/problems/fruit-into-baskets/', difficulty: 'Medium', platform: 'leetcode', slug: 'fruit-into-baskets' },
    { name: 'Subarray Sum Equals K', link: 'https://leetcode.com/problems/subarray-sum-equals-k/', difficulty: 'Medium', platform: 'leetcode', slug: 'subarray-sum-equals-k' },
    { name: 'Minimum Window Substring', link: 'https://leetcode.com/problems/minimum-window-substring/', difficulty: 'Hard', platform: 'leetcode', slug: 'minimum-window-substring' },
    { name: 'Sliding Window Maximum', link: 'https://leetcode.com/problems/sliding-window-maximum/', difficulty: 'Hard', platform: 'leetcode', slug: 'sliding-window-maximum' },
    // Codeforces Problems
    { name: 'Good Subarrays', link: 'https://codeforces.com/problemset/problem/1398/C', difficulty: 'Medium', platform: 'codeforces', problemId: '1398C' },
  ],

  'Bit Manipulation': [
    // LeetCode Problems
    { name: 'Single Number', link: 'https://leetcode.com/problems/single-number/', difficulty: 'Easy', platform: 'leetcode', slug: 'single-number' },
    { name: 'Number of 1 Bits', link: 'https://leetcode.com/problems/number-of-1-bits/', difficulty: 'Easy', platform: 'leetcode', slug: 'number-of-1-bits' },
    { name: 'Counting Bits', link: 'https://leetcode.com/problems/counting-bits/', difficulty: 'Easy', platform: 'leetcode', slug: 'counting-bits' },
    { name: 'Reverse Bits', link: 'https://leetcode.com/problems/reverse-bits/', difficulty: 'Easy', platform: 'leetcode', slug: 'reverse-bits' },
    { name: 'Missing Number', link: 'https://leetcode.com/problems/missing-number/', difficulty: 'Easy', platform: 'leetcode', slug: 'missing-number' },
    { name: 'Power of Two', link: 'https://leetcode.com/problems/power-of-two/', difficulty: 'Easy', platform: 'leetcode', slug: 'power-of-two' },
    { name: 'Sum of Two Integers', link: 'https://leetcode.com/problems/sum-of-two-integers/', difficulty: 'Medium', platform: 'leetcode', slug: 'sum-of-two-integers' },
    { name: 'Single Number II', link: 'https://leetcode.com/problems/single-number-ii/', difficulty: 'Medium', platform: 'leetcode', slug: 'single-number-ii' },
    { name: 'Single Number III', link: 'https://leetcode.com/problems/single-number-iii/', difficulty: 'Medium', platform: 'leetcode', slug: 'single-number-iii' },
    // Codeforces Problems
    { name: 'Hamming Distance Sum', link: 'https://codeforces.com/problemset/problem/608/A', difficulty: 'Medium', platform: 'codeforces', problemId: '608A' },
    { name: 'Xenia and Ringroad', link: 'https://codeforces.com/problemset/problem/339/B', difficulty: 'Easy', platform: 'codeforces', problemId: '339B' },
    { name: 'XOR Equation', link: 'https://codeforces.com/problemset/problem/627/A', difficulty: 'Medium', platform: 'codeforces', problemId: '627A' },
    // CodeChef Problems
    { name: 'XOR with Smallest Element', link: 'https://www.codechef.com/problems/XORSML', difficulty: 'Easy', platform: 'codechef', problemId: 'XORSML' },
  ],

  'Trie': [
    // LeetCode Problems
    { name: 'Implement Trie (Prefix Tree)', link: 'https://leetcode.com/problems/implement-trie-prefix-tree/', difficulty: 'Medium', platform: 'leetcode', slug: 'implement-trie-prefix-tree' },
    { name: 'Design Add and Search Words', link: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/', difficulty: 'Medium', platform: 'leetcode', slug: 'design-add-and-search-words-data-structure' },
    { name: 'Replace Words', link: 'https://leetcode.com/problems/replace-words/', difficulty: 'Medium', platform: 'leetcode', slug: 'replace-words' },
    { name: 'Longest Word in Dictionary', link: 'https://leetcode.com/problems/longest-word-in-dictionary/', difficulty: 'Medium', platform: 'leetcode', slug: 'longest-word-in-dictionary' },
    { name: 'Word Search II', link: 'https://leetcode.com/problems/word-search-ii/', difficulty: 'Hard', platform: 'leetcode', slug: 'word-search-ii' },
  ],

  'Math & Geometry': [
    // LeetCode Problems
    { name: 'Fizz Buzz', link: 'https://leetcode.com/problems/fizz-buzz/', difficulty: 'Easy', platform: 'leetcode', slug: 'fizz-buzz' },
    { name: 'Palindrome Number', link: 'https://leetcode.com/problems/palindrome-number/', difficulty: 'Easy', platform: 'leetcode', slug: 'palindrome-number' },
    { name: 'Happy Number', link: 'https://leetcode.com/problems/happy-number/', difficulty: 'Easy', platform: 'leetcode', slug: 'happy-number' },
    { name: 'Plus One', link: 'https://leetcode.com/problems/plus-one/', difficulty: 'Easy', platform: 'leetcode', slug: 'plus-one' },
    { name: 'Excel Sheet Column Number', link: 'https://leetcode.com/problems/excel-sheet-column-number/', difficulty: 'Easy', platform: 'leetcode', slug: 'excel-sheet-column-number' },
    { name: 'Rotate Image', link: 'https://leetcode.com/problems/rotate-image/', difficulty: 'Medium', platform: 'leetcode', slug: 'rotate-image' },
    { name: 'Spiral Matrix', link: 'https://leetcode.com/problems/spiral-matrix/', difficulty: 'Medium', platform: 'leetcode', slug: 'spiral-matrix' },
    { name: 'Set Matrix Zeroes', link: 'https://leetcode.com/problems/set-matrix-zeroes/', difficulty: 'Medium', platform: 'leetcode', slug: 'set-matrix-zeroes' },
    { name: 'Pow(x, n)', link: 'https://leetcode.com/problems/powx-n/', difficulty: 'Medium', platform: 'leetcode', slug: 'powx-n' },
    { name: 'Multiply Strings', link: 'https://leetcode.com/problems/multiply-strings/', difficulty: 'Medium', platform: 'leetcode', slug: 'multiply-strings' },
    // Codeforces Problems
    { name: 'Bear and Big Brother', link: 'https://codeforces.com/problemset/problem/791/A', difficulty: 'Easy', platform: 'codeforces', problemId: '791A' },
    { name: 'Vanya and Fence', link: 'https://codeforces.com/problemset/problem/677/A', difficulty: 'Easy', platform: 'codeforces', problemId: '677A' },
    { name: 'Anton and Danik', link: 'https://codeforces.com/problemset/problem/734/A', difficulty: 'Easy', platform: 'codeforces', problemId: '734A' },
    { name: 'Hulk', link: 'https://codeforces.com/problemset/problem/705/A', difficulty: 'Easy', platform: 'codeforces', problemId: '705A' },
    { name: 'Elephant', link: 'https://codeforces.com/problemset/problem/617/A', difficulty: 'Easy', platform: 'codeforces', problemId: '617A' },
    { name: 'Wrong Subtraction', link: 'https://codeforces.com/problemset/problem/977/A', difficulty: 'Easy', platform: 'codeforces', problemId: '977A' },
    { name: 'Tram', link: 'https://codeforces.com/problemset/problem/116/A', difficulty: 'Easy', platform: 'codeforces', problemId: '116A' },
    { name: 'Soldier and Bananas', link: 'https://codeforces.com/problemset/problem/546/A', difficulty: 'Easy', platform: 'codeforces', problemId: '546A' },
    { name: 'Is your horseshoe on the other hoof?', link: 'https://codeforces.com/problemset/problem/228/A', difficulty: 'Easy', platform: 'codeforces', problemId: '228A' },
    // CodeChef Problems
    { name: 'First and Last Digit', link: 'https://www.codechef.com/problems/FLOW004', difficulty: 'Easy', platform: 'codechef', problemId: 'FLOW004' },
    { name: 'Number Mirror', link: 'https://www.codechef.com/problems/START01', difficulty: 'Easy', platform: 'codechef', problemId: 'START01' },
    { name: 'Factorial', link: 'https://www.codechef.com/problems/FCTRL', difficulty: 'Easy', platform: 'codechef', problemId: 'FCTRL' },
    { name: 'Turbo Sort', link: 'https://www.codechef.com/problems/TSORT', difficulty: 'Easy', platform: 'codechef', problemId: 'TSORT' },
  ],

  'Intervals': [
    // LeetCode Problems
    { name: 'Meeting Rooms', link: 'https://leetcode.com/problems/meeting-rooms/', difficulty: 'Easy', platform: 'leetcode', slug: 'meeting-rooms' },
    { name: 'Insert Interval', link: 'https://leetcode.com/problems/insert-interval/', difficulty: 'Medium', platform: 'leetcode', slug: 'insert-interval' },
    { name: 'Merge Intervals', link: 'https://leetcode.com/problems/merge-intervals/', difficulty: 'Medium', platform: 'leetcode', slug: 'merge-intervals' },
    { name: 'Non-overlapping Intervals', link: 'https://leetcode.com/problems/non-overlapping-intervals/', difficulty: 'Medium', platform: 'leetcode', slug: 'non-overlapping-intervals' },
    { name: 'Meeting Rooms II', link: 'https://leetcode.com/problems/meeting-rooms-ii/', difficulty: 'Medium', platform: 'leetcode', slug: 'meeting-rooms-ii' },
    { name: 'Interval List Intersections', link: 'https://leetcode.com/problems/interval-list-intersections/', difficulty: 'Medium', platform: 'leetcode', slug: 'interval-list-intersections' },
    { name: 'Minimum Interval to Include Query', link: 'https://leetcode.com/problems/minimum-interval-to-include-each-query/', difficulty: 'Hard', platform: 'leetcode', slug: 'minimum-interval-to-include-each-query' },
  ],

  'Union Find': [
    // LeetCode Problems
    { name: 'Number of Connected Components', link: 'https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/', difficulty: 'Medium', platform: 'leetcode', slug: 'number-of-connected-components-in-an-undirected-graph' },
    { name: 'Graph Valid Tree', link: 'https://leetcode.com/problems/graph-valid-tree/', difficulty: 'Medium', platform: 'leetcode', slug: 'graph-valid-tree' },
    { name: 'Redundant Connection', link: 'https://leetcode.com/problems/redundant-connection/', difficulty: 'Medium', platform: 'leetcode', slug: 'redundant-connection' },
    { name: 'Accounts Merge', link: 'https://leetcode.com/problems/accounts-merge/', difficulty: 'Medium', platform: 'leetcode', slug: 'accounts-merge' },
    { name: 'Most Stones Removed', link: 'https://leetcode.com/problems/most-stones-removed-with-same-row-or-column/', difficulty: 'Medium', platform: 'leetcode', slug: 'most-stones-removed-with-same-row-or-column' },
    // Codeforces Problems
    { name: 'Disjoint Sets Union', link: 'https://codeforces.com/edu/course/2/lesson/7', difficulty: 'Medium', platform: 'codeforces', problemId: 'edu-dsu' },
  ],

  'Number Theory': [
    // Codeforces Problems
    { name: 'Ancient Berland Circus', link: 'https://codeforces.com/problemset/problem/1/C', difficulty: 'Hard', platform: 'codeforces', problemId: '1C' },
    { name: 'Round House', link: 'https://codeforces.com/problemset/problem/659/A', difficulty: 'Easy', platform: 'codeforces', problemId: '659A' },
    { name: 'Twins', link: 'https://codeforces.com/problemset/problem/160/A', difficulty: 'Easy', platform: 'codeforces', problemId: '160A' },
    { name: 'Die Roll', link: 'https://codeforces.com/problemset/problem/9/A', difficulty: 'Easy', platform: 'codeforces', problemId: '9A' },
    { name: 'Young Physicist', link: 'https://codeforces.com/problemset/problem/69/A', difficulty: 'Easy', platform: 'codeforces', problemId: '69A' },
    { name: 'Chat Room', link: 'https://codeforces.com/problemset/problem/58/A', difficulty: 'Easy', platform: 'codeforces', problemId: '58A' },
    { name: 'Stone on the Table', link: 'https://codeforces.com/problemset/problem/266/A', difficulty: 'Easy', platform: 'codeforces', problemId: '266A' },
    { name: 'Gravity Flip', link: 'https://codeforces.com/problemset/problem/405/A', difficulty: 'Easy', platform: 'codeforces', problemId: '405A' },
    { name: 'Presents', link: 'https://codeforces.com/problemset/problem/136/A', difficulty: 'Easy', platform: 'codeforces', problemId: '136A' },
    { name: 'Snowy Peaks', link: 'https://codeforces.com/problemset/problem/1654/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1654A' },
    // CodeChef Problems
    { name: 'Prime Generator', link: 'https://www.codechef.com/problems/PRIME1', difficulty: 'Medium', platform: 'codechef', problemId: 'PRIME1' },
    { name: 'GCD and LCM', link: 'https://www.codechef.com/problems/FLOW016', difficulty: 'Easy', platform: 'codechef', problemId: 'FLOW016' },
    { name: 'The Lead Game', link: 'https://www.codechef.com/problems/TLG', difficulty: 'Easy', platform: 'codechef', problemId: 'TLG' },
    { name: 'Chef and Two Strings', link: 'https://www.codechef.com/problems/CHEFSTR', difficulty: 'Easy', platform: 'codechef', problemId: 'CHEFSTR' },
  ],

  'Sorting': [
    // Codeforces Problems
    { name: 'Sort the Array', link: 'https://codeforces.com/problemset/problem/451/B', difficulty: 'Easy', platform: 'codeforces', problemId: '451B' },
    { name: 'Almost Sorted', link: 'https://codeforces.com/problemset/problem/105/A', difficulty: 'Easy', platform: 'codeforces', problemId: '105A' },
    { name: 'C+=', link: 'https://codeforces.com/problemset/problem/1368/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1368A' },
    { name: 'Odd Selection', link: 'https://codeforces.com/problemset/problem/1363/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1363A' },
    { name: 'Balanced Rating Changes', link: 'https://codeforces.com/problemset/problem/1237/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1237A' },
    { name: 'Candies and Two Sisters', link: 'https://codeforces.com/problemset/problem/1335/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1335A' },
    { name: 'Find Array', link: 'https://codeforces.com/problemset/problem/1536/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1536A' },
    // CodeChef Problems
    { name: 'Turbo Sort', link: 'https://www.codechef.com/problems/TSORT', difficulty: 'Easy', platform: 'codechef', problemId: 'TSORT' },
  ],

  'Implementation': [
    // Codeforces Problems
    { name: 'Sasha and Sticks', link: 'https://codeforces.com/problemset/problem/832/A', difficulty: 'Easy', platform: 'codeforces', problemId: '832A' },
    { name: 'Lucky Division', link: 'https://codeforces.com/problemset/problem/122/A', difficulty: 'Easy', platform: 'codeforces', problemId: '122A' },
    { name: 'Colorful Stones', link: 'https://codeforces.com/problemset/problem/102/B', difficulty: 'Easy', platform: 'codeforces', problemId: '102B' },
    { name: 'Sereja and Dima', link: 'https://codeforces.com/problemset/problem/381/A', difficulty: 'Easy', platform: 'codeforces', problemId: '381A' },
    { name: 'Expression', link: 'https://codeforces.com/problemset/problem/479/A', difficulty: 'Easy', platform: 'codeforces', problemId: '479A' },
    { name: 'Magnets', link: 'https://codeforces.com/problemset/problem/344/A', difficulty: 'Easy', platform: 'codeforces', problemId: '344A' },
    { name: 'Borze', link: 'https://codeforces.com/problemset/problem/32/B', difficulty: 'Easy', platform: 'codeforces', problemId: '32B' },
    { name: 'Team Olympiad', link: 'https://codeforces.com/problemset/problem/490/A', difficulty: 'Easy', platform: 'codeforces', problemId: '490A' },
    { name: 'Night at the Museum', link: 'https://codeforces.com/problemset/problem/731/A', difficulty: 'Easy', platform: 'codeforces', problemId: '731A' },
    { name: 'Dragons', link: 'https://codeforces.com/problemset/problem/230/A', difficulty: 'Easy', platform: 'codeforces', problemId: '230A' },
    { name: 'Police Recruits', link: 'https://codeforces.com/problemset/problem/427/A', difficulty: 'Easy', platform: 'codeforces', problemId: '427A' },
    { name: 'QAQ', link: 'https://codeforces.com/problemset/problem/894/A', difficulty: 'Easy', platform: 'codeforces', problemId: '894A' },
    { name: 'Fair Game', link: 'https://codeforces.com/problemset/problem/864/A', difficulty: 'Easy', platform: 'codeforces', problemId: '864A' },
    { name: 'Currency System in Geraldion', link: 'https://codeforces.com/problemset/problem/560/A', difficulty: 'Easy', platform: 'codeforces', problemId: '560A' },
    { name: 'Yaroslav and Permutations', link: 'https://codeforces.com/problemset/problem/296/A', difficulty: 'Easy', platform: 'codeforces', problemId: '296A' },
    // CodeChef Problems
    { name: 'Chef and Digits', link: 'https://www.codechef.com/problems/LONGSEQU', difficulty: 'Easy', platform: 'codechef', problemId: 'LONGSEQU' },
    { name: 'Second Largest', link: 'https://www.codechef.com/problems/FLOW017', difficulty: 'Easy', platform: 'codechef', problemId: 'FLOW017' },
    { name: 'Grade The Steel', link: 'https://www.codechef.com/problems/FLOW008', difficulty: 'Easy', platform: 'codechef', problemId: 'FLOW008' },
    { name: 'Chef and Pick', link: 'https://www.codechef.com/problems/CHEFPICK', difficulty: 'Easy', platform: 'codechef', problemId: 'CHEFPICK' },
    { name: 'Chef and Ice Cream', link: 'https://www.codechef.com/problems/CHFICECM', difficulty: 'Easy', platform: 'codechef', problemId: 'CHFICECM' },
  ],

  'Constructive Algorithms': [
    // Codeforces Problems
    { name: 'Sum of Odd Integers', link: 'https://codeforces.com/problemset/problem/1327/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1327A' },
    { name: 'Product of Three Numbers', link: 'https://codeforces.com/problemset/problem/1294/C', difficulty: 'Easy', platform: 'codeforces', problemId: '1294C' },
    { name: 'Shuffle Hashing', link: 'https://codeforces.com/problemset/problem/1278/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1278A' },
    { name: 'Filling Shapes', link: 'https://codeforces.com/problemset/problem/1182/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1182A' },
    { name: 'Codeforces Checking', link: 'https://codeforces.com/problemset/problem/1791/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1791A' },
    { name: 'Vasya and Books', link: 'https://codeforces.com/problemset/problem/1073/B', difficulty: 'Easy', platform: 'codeforces', problemId: '1073B' },
    { name: 'Phoenix and Balance', link: 'https://codeforces.com/problemset/problem/1348/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1348A' },
    { name: 'Neko Finds Grapes', link: 'https://codeforces.com/problemset/problem/1152/A', difficulty: 'Easy', platform: 'codeforces', problemId: '1152A' },
  ],
};

// Get all topics available
const getAllTopics = () => Object.keys(problemsBank);

// Get all problems for a topic
const getProblemsForTopic = (topic) => problemsBank[topic] || [];

// Get total problem count
const getTotalProblemCount = () => {
  return Object.values(problemsBank).reduce((sum, problems) => sum + problems.length, 0);
};

// Get problems by difficulty
const getProblemsByDifficulty = (difficulty) => {
  const result = [];
  Object.entries(problemsBank).forEach(([topic, problems]) => {
    problems.forEach(p => {
      if (p.difficulty === difficulty) {
        result.push({ ...p, topic });
      }
    });
  });
  return result;
};

// Get problems by platform
const getProblemsByPlatform = (platform) => {
  const result = [];
  Object.entries(problemsBank).forEach(([topic, problems]) => {
    problems.forEach(p => {
      if (p.platform === platform) {
        result.push({ ...p, topic });
      }
    });
  });
  return result;
};

// Get random problem from specified topics, excluding solved ones
const getRandomProblemFromTopics = (topics, excludeSlugs = new Set(), excludeIds = new Set()) => {
  const eligibleProblems = [];
  
  topics.forEach(topic => {
    const problems = problemsBank[topic] || [];
    problems.forEach(p => {
      let isExcluded = false;
      if (p.platform === 'leetcode') {
        isExcluded = excludeSlugs.has(p.slug);
      } else if (p.platform === 'codeforces') {
        isExcluded = excludeIds.has(p.problemId);
      } else if (p.platform === 'codechef') {
        isExcluded = excludeIds.has(p.problemId);
      }
      
      if (!isExcluded) {
        eligibleProblems.push({ ...p, topic });
      }
    });
  });
  
  if (eligibleProblems.length === 0) {
    return null;
  }
  
  return eligibleProblems[Math.floor(Math.random() * eligibleProblems.length)];
};

// Get random problem from all topics, excluding solved ones
const getRandomProblem = (excludeSlugs = new Set(), excludeIds = new Set()) => {
  return getRandomProblemFromTopics(getAllTopics(), excludeSlugs, excludeIds);
};

// Get statistics about problem bank
const getStats = () => {
  const stats = {
    totalProblems: 0,
    byPlatform: { leetcode: 0, codeforces: 0, codechef: 0 },
    byDifficulty: { Easy: 0, Medium: 0, Hard: 0 },
    byTopic: {}
  };
  
  Object.entries(problemsBank).forEach(([topic, problems]) => {
    stats.byTopic[topic] = problems.length;
    stats.totalProblems += problems.length;
    
    problems.forEach(p => {
      if (stats.byPlatform[p.platform] !== undefined) {
        stats.byPlatform[p.platform]++;
      }
      if (stats.byDifficulty[p.difficulty] !== undefined) {
        stats.byDifficulty[p.difficulty]++;
      }
    });
  });
  
  return stats;
};

module.exports = {
  problemsBank,
  getAllTopics,
  getProblemsForTopic,
  getTotalProblemCount,
  getProblemsByDifficulty,
  getProblemsByPlatform,
  getRandomProblemFromTopics,
  getRandomProblem,
  getStats
};
