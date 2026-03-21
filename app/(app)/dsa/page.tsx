'use client';

import { useState, useMemo } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { PageContainer, GlassCard, DifficultyBadge } from '@/components/ui/components';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, HelpCircle, Brain, Code2, X, RefreshCw, ExternalLink, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { callClaude } from '@/lib/claude';

interface Pattern {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  problems: Array<{
    id: string;
    name: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
  }>;
}

const PATTERNS: Pattern[] = [
  {
    id: 'two-pointers',
    name: 'Two Pointers',
    difficulty: 'Easy',
    problems: [
      { id: '1', name: 'Valid Palindrome', difficulty: 'Easy' },
      { id: '2', name: '3Sum', difficulty: 'Medium' },
      { id: '3', name: 'Container With Most Water', difficulty: 'Medium' },
      { id: '4', name: 'Remove Duplicates', difficulty: 'Easy' },
    ],
  },
  {
    id: 'sliding-window',
    name: 'Sliding Window',
    difficulty: 'Medium',
    problems: [
      { id: '1', name: 'Longest Substring No Repeat', difficulty: 'Medium' },
      { id: '2', name: 'Max Subarray', difficulty: 'Medium' },
      { id: '3', name: 'Min Window Substring', difficulty: 'Hard' },
      { id: '4', name: 'Fruit Into Baskets', difficulty: 'Medium' },
    ],
  },
  {
    id: 'fast-slow-pointers',
    name: 'Fast & Slow Pointers',
    difficulty: 'Easy',
    problems: [
      { id: '1', name: 'Linked List Cycle', difficulty: 'Easy' },
      { id: '2', name: 'Find Middle', difficulty: 'Easy' },
      { id: '3', name: 'Happy Number', difficulty: 'Easy' },
      { id: '4', name: 'Palindrome LL', difficulty: 'Easy' },
    ],
  },
  {
    id: 'merge-intervals',
    name: 'Merge Intervals',
    difficulty: 'Medium',
    problems: [
      { id: '1', name: 'Merge Intervals', difficulty: 'Medium' },
      { id: '2', name: 'Insert Interval', difficulty: 'Medium' },
      { id: '3', name: 'Meeting Rooms II', difficulty: 'Hard' },
      { id: '4', name: 'Non-overlapping Intervals', difficulty: 'Medium' },
    ],
  },
  {
    id: 'cyclic-sort',
    name: 'Cyclic Sort',
    difficulty: 'Easy',
    problems: [
      { id: '1', name: 'Missing Number', difficulty: 'Easy' },
      { id: '2', name: 'Find Duplicate', difficulty: 'Medium' },
      { id: '3', name: 'First Missing Positive', difficulty: 'Hard' },
      { id: '4', name: 'Find All Duplicates', difficulty: 'Medium' },
    ],
  },
  {
    id: 'in-place-reversal',
    name: 'In-place Reversal',
    difficulty: 'Medium',
    problems: [
      { id: '1', name: 'Reverse Linked List', difficulty: 'Easy' },
      { id: '2', name: 'Rotate List', difficulty: 'Medium' },
      { id: '3', name: 'Reverse Sublist', difficulty: 'Medium' },
      { id: '4', name: 'Reverse in k-Group', difficulty: 'Hard' },
    ],
  },
  {
    id: 'bfs',
    name: 'BFS',
    difficulty: 'Medium',
    problems: [
      { id: '1', name: 'Binary Tree BFS', difficulty: 'Medium' },
      { id: '2', name: 'Level Order Traversal', difficulty: 'Easy' },
      { id: '3', name: 'Rotten Oranges', difficulty: 'Medium' },
      { id: '4', name: 'Word Ladder', difficulty: 'Hard' },
    ],
  },
  {
    id: 'dfs',
    name: 'DFS',
    difficulty: 'Medium',
    problems: [
      { id: '1', name: 'Path Sum', difficulty: 'Easy' },
      { id: '2', name: 'Tree Diameter', difficulty: 'Medium' },
      { id: '3', name: 'Number of Islands', difficulty: 'Medium' },
      { id: '4', name: 'Clone Graph', difficulty: 'Medium' },
    ],
  },
  {
    id: 'two-heaps',
    name: 'Two Heaps',
    difficulty: 'Hard',
    problems: [
      { id: '1', name: 'Find Median Stream', difficulty: 'Hard' },
      { id: '2', name: 'Sliding Window Median', difficulty: 'Hard' },
      { id: '3', name: 'IPO Problem', difficulty: 'Hard' },
      { id: '4', name: 'Next Interval', difficulty: 'Hard' },
    ],
  },
  {
    id: 'backtracking',
    name: 'Backtracking',
    difficulty: 'Medium',
    problems: [
      { id: '1', name: 'Subsets', difficulty: 'Medium' },
      { id: '2', name: 'Permutations', difficulty: 'Medium' },
      { id: '3', name: 'Combination Sum', difficulty: 'Medium' },
      { id: '4', name: 'Sudoku Solver', difficulty: 'Hard' },
    ],
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    difficulty: 'Medium',
    problems: [
      { id: '1', name: 'Search Rotated Array', difficulty: 'Medium' },
      { id: '2', name: 'Find Peak Element', difficulty: 'Medium' },
      { id: '3', name: 'Koko Bananas', difficulty: 'Medium' },
      { id: '4', name: 'Search 2D Matrix', difficulty: 'Medium' },
    ],
  },
  {
    id: 'top-k-elements',
    name: 'Top K Elements',
    difficulty: 'Medium',
    problems: [
      { id: '1', name: 'K Closest Points', difficulty: 'Medium' },
      { id: '2', name: 'Top K Frequent', difficulty: 'Medium' },
      { id: '3', name: 'Kth Largest', difficulty: 'Medium' },
      { id: '4', name: 'Task Scheduler', difficulty: 'Medium' },
    ],
  },
  {
    id: 'k-way-merge',
    name: 'K-way Merge',
    difficulty: 'Hard',
    problems: [
      { id: '1', name: 'Merge K Sorted Lists', difficulty: 'Hard' },
      { id: '2', name: 'Kth Smallest Matrix', difficulty: 'Hard' },
      { id: '3', name: 'Smallest Range', difficulty: 'Hard' },
      { id: '4', name: 'External Sort', difficulty: 'Hard' },
    ],
  },
  {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    difficulty: 'Hard',
    problems: [
      { id: '1', name: 'Coin Change', difficulty: 'Medium' },
      { id: '2', name: 'Longest Common Subsequence', difficulty: 'Medium' },
      { id: '3', name: 'House Robber', difficulty: 'Medium' },
      { id: '4', name: 'Knapsack', difficulty: 'Hard' },
    ],
  },
  {
    id: 'union-find',
    name: 'Union Find',
    difficulty: 'Hard',
    problems: [
      { id: '1', name: 'Number of Provinces', difficulty: 'Medium' },
      { id: '2', name: 'Redundant Connection', difficulty: 'Medium' },
      { id: '3', name: 'Accounts Merge', difficulty: 'Hard' },
      { id: '4', name: 'Swim Rising Water', difficulty: 'Hard' },
    ],
  },
];

interface PatternGuide {
  tagline: string;
  whenToUse: string[];
  intuition: string;
  steps: string[];
  complexity: { time: string; space: string; why: string };
  gotchas: string[];
  template: string;
  demo: { problem: string; input: string; trace: string[]; answer: string };
}

const PATTERN_GUIDES: Record<string, PatternGuide> = {
  'two-pointers': {
    tagline: 'Two indices converging inward — eliminates O(n²) brute force on sorted data',
    whenToUse: ['Sorted array, find pair/triplet with target sum', 'Palindrome check on string or array', 'Remove duplicates in-place', 'Container with most water style maximization'],
    intuition: 'Place one pointer at start, one at end. Sorted order means: sum too small → move left right; sum too large → move right left. Converge until they meet.',
    steps: ['Sort the input if not already sorted', 'Initialize left = 0, right = n−1', 'While left < right: evaluate the condition', 'Too small → left++  |  Too large → right--  |  Match → record answer', 'Skip duplicates if unique results required: while arr[left]==arr[left−1]: left++'],
    complexity: { time: 'O(n log n)', space: 'O(1)', why: 'Sort dominates; the two-pointer sweep itself is O(n)' },
    gotchas: ['Must sort first — unsorted input breaks the logic', 'Condition is left < right (not ≤), or you compare an element with itself', 'Duplicate skipping: advance AFTER recording the match, not before'],
    template: `def two_pointers(arr, target):
    arr.sort()                  # 1. Sort
    left, right = 0, len(arr) - 1
    while left < right:         # 2. Converge
        s = arr[left] + arr[right]
        if s == target:
            return [left, right]  # Found!
        elif s < target:
            left += 1             # Need bigger sum
        else:
            right -= 1            # Need smaller sum
    return []`,
    demo: { problem: 'Valid Palindrome — is "racecar" a palindrome?', input: 's = "racecar"', trace: ['left=0 (r), right=6 (r) → match → both move in', 'left=1 (a), right=5 (a) → match → both move in', 'left=2 (c), right=4 (c) → match → both move in', 'left=3 (e), right=3 → left >= right → STOP'], answer: 'True ✓  every pair matched before pointers crossed' },
  },
  'sliding-window': {
    tagline: 'Expand right, shrink left on violation — O(n) over contiguous subarray/substring',
    whenToUse: ['Longest/shortest substring with a constraint', 'Max/min sum of exactly k-size window', 'Count subarrays with at most k distinct elements', 'Permutation / anagram exists in string'],
    intuition: 'Maintain window [left, right]. Grow by moving right. When constraint violated, shrink from left until valid. Track best answer at every valid state. Each element enters and exits the window exactly once → O(n).',
    steps: ['Initialize left=0, window state (map / counter / running sum)', 'Expand: for right in range(n): add arr[right] to window', 'Shrink: while window violates constraint: remove arr[left], left++', 'Update answer outside the while-loop (window is valid here)'],
    complexity: { time: 'O(n)', space: 'O(k)', why: 'k = distinct elements tracked; each element enters/exits window at most once' },
    gotchas: ['Remove left element from window state when shrinking — easy to forget', 'Update answer AFTER the shrink loop, not inside it', 'Fixed window: use a simple dequeue; variable window: use the while-shrink pattern'],
    template: `def sliding_window(s, k):
    left = 0
    window = {}       # window state
    ans = 0

    for right in range(len(s)):
        # 1. Expand: add right element
        window[s[right]] = window.get(s[right], 0) + 1

        # 2. Shrink while violated
        while len(window) > k:
            window[s[left]] -= 1
            if window[s[left]] == 0:
                del window[s[left]]
            left += 1

        # 3. Update answer (window is valid)
        ans = max(ans, right - left + 1)
    return ans`,
    demo: { problem: 'Longest Substring No Repeat — "abcabcbb"', input: 's = "abcabcbb"', trace: ['right=0 "a": window={a:1}, size=1 ✓  ans=1', 'right=1 "b": window={a:1,b:1}, ans=2', 'right=2 "c": {a,b,c}, ans=3', 'right=3 "a": dup! shrink left→1 (remove a), window={b,c,a}, ans=3', 'right=4 "b": dup! shrink left→2, ans stays 3  ...  final ans=3'], answer: '3  ("abc") ✓' },
  },
  'fast-slow-pointers': {
    tagline: "Floyd's tortoise & hare — detect cycles and find midpoints in O(1) space",
    whenToUse: ['Detect cycle in linked list', 'Find middle node of linked list', 'Happy number / sequence cycle detection', 'Find the entry point of a cycle'],
    intuition: 'Slow moves 1 step, fast moves 2. If a cycle exists, fast will eventually lap slow — they must meet inside the cycle. No cycle → fast reaches null first. For middle: when fast hits end, slow is at middle.',
    steps: ['Initialize slow = head, fast = head', 'Loop: slow = slow.next  |  fast = fast.next.next', 'Cycle detected when slow == fast', 'Cycle entry: reset one pointer to head, advance both 1 step until meeting', 'Middle: when fast is None or fast.next is None, slow is at middle'],
    complexity: { time: 'O(n)', space: 'O(1)', why: 'No extra data structure — just two pointer variables' },
    gotchas: ['Always check fast AND fast.next for None before advancing fast', 'Even-length list middle: slow lands on first or second middle depending on start condition', 'Finding cycle entry requires a SECOND phase after detection (reset + single steps)'],
    template: `def has_cycle(head):
    slow = fast = head
    while fast and fast.next:    # null-check first!
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True           # cycle!
    return False

def find_middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow                   # slow is at middle`,
    demo: { problem: 'Linked List Cycle — 1→2→3→4→(back to 2)', input: '1 → 2 → 3 → 4 → (cycle to 2)', trace: ['Start: slow=1, fast=1', 'Step 1: slow=2, fast=3', 'Step 2: slow=3, fast=2  (fast looped through cycle)', 'Step 3: slow=4, fast=4  → MATCH → cycle detected!'], answer: 'True ✓' },
  },
  'merge-intervals': {
    tagline: 'Sort by start, greedily extend end — merge overlapping ranges in one pass',
    whenToUse: ['Merge overlapping intervals', 'Insert new interval into sorted list', 'Count concurrent meetings (Meeting Rooms)', 'Find free time between meetings'],
    intuition: 'After sorting by start time, any interval that overlaps the previous (curr.start ≤ prev.end) should be merged by extending prev.end = max(prev.end, curr.end). Otherwise, it is disjoint → append new.',
    steps: ['Sort intervals by start time', 'Initialize result with the first interval', 'For each subsequent interval: check if curr.start ≤ result.last.end', 'If overlaps: extend result.last.end = max(last.end, curr.end)', 'If no overlap: append curr as new interval'],
    complexity: { time: 'O(n log n)', space: 'O(n)', why: 'Sort dominates; the merge pass is O(n)' },
    gotchas: ['Overlap condition is ≤ not <  (e.g. [1,2],[2,3] overlap at point 2)', 'Take MAX of the two ends when merging — not just curr.end', "Input must be sorted — don't assume it is"],
    template: `def merge(intervals):
    intervals.sort(key=lambda x: x[0])   # sort by start
    result = [intervals[0]]

    for start, end in intervals[1:]:
        last_end = result[-1][1]
        if start <= last_end:             # overlap!
            result[-1][1] = max(last_end, end)  # extend
        else:
            result.append([start, end])   # disjoint, append
    return result`,
    demo: { problem: 'Merge Intervals — [[1,3],[2,6],[8,10],[15,18]]', input: '[[1,3],[2,6],[8,10],[15,18]]', trace: ['[1,3]: result=[[1,3]]', '[2,6]: 2≤3 overlap → extend to [1,6]', '[8,10]: 8>6 → no overlap → append', '[15,18]: 15>10 → append'], answer: '[[1,6],[8,10],[15,18]] ✓' },
  },
  'cyclic-sort': {
    tagline: 'Numbers 1-N belong at index i-1 — swap to correct position, then scan for missing',
    whenToUse: ['Array has numbers in range 1 to N', 'Find missing number(s)', 'Find duplicate number(s)', 'First missing positive integer'],
    intuition: 'If nums[i] is in range [1,N], it belongs at index nums[i]−1. Swap it there. After one full pass, any index i where nums[i] ≠ i+1 reveals the missing number as i+1.',
    steps: ['i = 0. While i < n:', '  j = nums[i] − 1  (correct index for this number)', '  If nums[i] is in [1,n] AND nums[i] ≠ nums[j]: swap nums[i] and nums[j]', '  Else: i++  (already correct, move forward)', 'Second pass: find first index where nums[i] ≠ i+1'],
    complexity: { time: 'O(n)', space: 'O(1)', why: 'Each number swapped at most once to its correct slot; passes look like O(n²) but are actually O(n) total' },
    gotchas: ["Don't increment i after a swap — the newly arrived number also needs placing", 'For duplicates: check nums[i]==nums[j] before swapping to avoid infinite loop', 'Numbers outside range [1,N] just get skipped (e.g. 0 in "missing number")'],
    template: `def cyclic_sort(nums):
    i = 0
    while i < len(nums):
        j = nums[i] - 1                 # correct index
        if 1 <= nums[i] <= len(nums) and nums[i] != nums[j]:
            nums[i], nums[j] = nums[j], nums[i]  # swap to home
        else:
            i += 1                      # already placed

    # Find first wrong position
    for i, n in enumerate(nums):
        if n != i + 1:
            return i + 1
    return len(nums) + 1`,
    demo: { problem: 'Missing Number — [3, 1, 2]', input: 'nums = [3, 1, 2]', trace: ['i=0: nums[0]=3, j=2. 3≠nums[2]=2 → swap → [2,1,3]', 'i=0: nums[0]=2, j=1. 2≠nums[1]=1 → swap → [1,2,3]', 'i=0: nums[0]=1, j=0. Already placed → i=1,2,3… all correct', 'Second pass: every nums[i]==i+1 → missing is n+1=4? No wait, if [3,0,1] then missing=2'], answer: 'All slots filled → missing = n (or check second pass) ✓' },
  },
  'in-place-reversal': {
    tagline: 'Three-pointer reversal: save next, flip link, advance — all in O(1) space',
    whenToUse: ['Reverse an entire linked list', 'Reverse a sub-portion [left, right]', 'Rotate list by k positions', 'Reverse every k-group'],
    intuition: 'Three pointers: prev, curr, next_node. Save next before overwriting curr.next. Point curr.next back to prev. Advance both pointers forward. The key is order: save → flip → advance.',
    steps: ['prev = None, curr = head', 'While curr is not None:', '  next_node = curr.next   (save BEFORE overwrite)', '  curr.next = prev         (reverse the link)', '  prev = curr              (advance prev)', '  curr = next_node         (advance curr)', 'Return prev  (new head; curr is None at end)'],
    complexity: { time: 'O(n)', space: 'O(1)', why: 'Single pass with 3 pointer variables — no stack or recursion needed' },
    gotchas: ['Save next_node BEFORE changing curr.next — or you lose the rest of the list', 'Return prev, not curr — curr is None when loop ends', 'For sublist reversal: reconnect prev_part.next = reversed_tail after completing'],
    template: `def reverse_list(head):
    prev, curr = None, head
    while curr:
        next_node = curr.next   # 1. Save
        curr.next = prev        # 2. Flip
        prev = curr             # 3. Advance prev
        curr = next_node        # 4. Advance curr
    return prev                 # new head`,
    demo: { problem: 'Reverse 1 → 2 → 3 → 4 → None', input: '1 → 2 → 3 → 4 → None', trace: ['prev=None, curr=1: save 2, 1→None, prev=1, curr=2', 'prev=1, curr=2: save 3, 2→1, prev=2, curr=3', 'prev=2, curr=3: save 4, 3→2, prev=3, curr=4', 'prev=3, curr=4: save None, 4→3, prev=4, curr=None → STOP'], answer: '4→3→2→1→None, return prev=4 ✓' },
  },
  'bfs': {
    tagline: 'Queue processes nodes level by level — guarantees shortest path in unweighted graphs',
    whenToUse: ['Shortest path / minimum steps in unweighted graph or grid', 'Level-order tree traversal', 'Find all nodes at distance k', 'Multi-source BFS (rotten oranges, walls & gates)'],
    intuition: 'BFS explores all neighbors at distance d before any at distance d+1. First time you reach the target is the shortest path. Use a queue (FIFO). Mark visited ON ENQUEUE to avoid processing duplicates.',
    steps: ['Enqueue start node. Mark start as visited', 'While queue not empty:', '  Snapshot queue size (= nodes at this level)', '  Process each node: if target → return level', '  Enqueue all unvisited neighbors, mark visited immediately', '  level++'],
    complexity: { time: 'O(V + E)', space: 'O(V)', why: 'V = vertices, E = edges. Queue holds at most one full level at a time' },
    gotchas: ['Mark visited WHEN ENQUEUING — not when dequeuing. Otherwise duplicates flood the queue', 'Level tracking: snapshot len(queue) before the inner loop', 'Multi-source BFS: push ALL sources at start — distance is from nearest source'],
    template: `from collections import deque

def bfs(graph, start, target):
    queue = deque([start])
    visited = {start}          # mark on enqueue!
    level = 0

    while queue:
        for _ in range(len(queue)):   # one full level
            node = queue.popleft()
            if node == target:
                return level
            for nb in graph[node]:
                if nb not in visited:
                    visited.add(nb)   # mark on enqueue
                    queue.append(nb)
        level += 1
    return -1`,
    demo: { problem: 'Rotten Oranges — BFS from all rotten cells simultaneously', input: 'grid=[[2,1,1],[1,1,0],[0,1,1]]', trace: ['Enqueue all 2s: [(0,0)]. minutes=0', 'Level 1: rot (0,1) and (1,0). minutes=1', 'Level 2: rot (0,2),(1,1). minutes=2', 'Level 3: rot (2,1). minutes=3. Level 4: rot (2,2). minutes=4'], answer: '4 minutes ✓ (multi-source start gives optimal answer immediately)' },
  },
  'dfs': {
    tagline: 'Recursive deep exploration — visit all paths, call stack is implicit memory',
    whenToUse: ['Count/find connected components in graph or grid', 'All paths from source to target', 'Tree traversals (pre/in/post-order)', 'Cycle detection, topological sort'],
    intuition: 'Go as deep as possible before backtracking. The recursion stack tracks the current path. Mark visited before recursing to avoid revisits. For backtracking problems, un-mark after returning.',
    steps: ['Check base case: out of bounds, already visited, wall/obstacle', 'Mark current node as visited', 'Recurse into all valid neighbors', 'For backtracking: un-mark after returning from recursion', 'Count / collect results as recursion unwinds'],
    complexity: { time: 'O(V + E)', space: 'O(V)', why: 'Space is O(depth) for recursion stack — O(n) worst case on a path graph' },
    gotchas: ['Mark visited BEFORE recursing — or you get infinite loops', 'Grid DFS: check bounds AND visited before each recursive call', 'Backtracking: un-mark AFTER the recursive call, not before'],
    template: `def dfs(grid, r, c, visited):
    # Base cases
    if r < 0 or r >= len(grid): return
    if c < 0 or c >= len(grid[0]): return
    if (r,c) in visited or grid[r][c] == 0: return

    visited.add((r, c))         # mark visited

    # Recurse in 4 directions
    for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]:
        dfs(grid, r+dr, c+dc, visited)`,
    demo: { problem: 'Number of Islands — count connected "1" groups', input: '[[1,1,0],[0,1,0],[0,0,1]]', trace: ['Scan: find (0,0)=1 → DFS marks (0,0),(0,1),(1,1). islands=1', '(0,1) and (1,1) already visited → skip', 'Find (2,2)=1 → DFS marks (2,2). islands=2', 'No more unvisited 1s'], answer: '2 islands ✓' },
  },
  'two-heaps': {
    tagline: 'Max-heap for lower half + min-heap for upper half → O(log n) running median',
    whenToUse: ['Median from a data stream', 'Sliding window median', 'Continuously balance two groups', 'Problems needing simultaneous access to min and max'],
    intuition: 'Split all numbers into two halves. Max-heap (lo) holds the lower half — its top is the max of lower. Min-heap (hi) holds the upper half — its top is the min of upper. Keep sizes balanced so median is always at the top(s).',
    steps: ['Push to lo (max-heap). Then: pop lo top → push to hi (ensures hi has smallest of larger half)', 'If len(hi) > len(lo): pop hi top → push back to lo', 'Invariant: len(lo) >= len(hi); lo always has the median or one of the two medians', 'Median: equal sizes → avg of lo[0] and hi[0]; else → lo top'],
    complexity: { time: 'O(log n) per insert', space: 'O(n)', why: 'Each insert does at most 2 heap operations — both O(log n)' },
    gotchas: ['Python only has min-heap — negate values to simulate max-heap', 'Always do the two-step rebalance (push to lo, move to hi, check sizes)', 'Sliding window variant needs lazy deletion — track which elements are stale'],
    template: `import heapq

class MedianFinder:
    def __init__(self):
        self.lo = []   # max-heap (negate values)
        self.hi = []   # min-heap

    def add(self, num):
        heapq.heappush(self.lo, -num)              # push to max-heap
        heapq.heappush(self.hi, -heapq.heappop(self.lo))  # balance
        if len(self.hi) > len(self.lo):            # keep lo >= hi
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def median(self):
        if len(self.lo) == len(self.hi):
            return (-self.lo[0] + self.hi[0]) / 2
        return -self.lo[0]`,
    demo: { problem: 'Find Median Stream — add [1, 2, 3]', input: 'stream = [1, 2, 3]', trace: ['add(1): lo=[-1], hi=[] → median = 1', 'add(2): push→lo=[-2,-1], move top 2→hi=[2], lo=[-1] → median = (1+2)/2 = 1.5', 'add(3): push→lo=[-3,-1], move 3→hi=[2,3], lo=[-1]. len(hi)>len(lo)! move hi[0]=2→lo → lo=[-2,-1], hi=[3] → median = 2'], answer: 'Medians: 1, 1.5, 2 ✓' },
  },
  'backtracking': {
    tagline: 'Build → Recurse → Undo — exhaustive search with early pruning',
    whenToUse: ['All subsets, permutations, combinations', 'Constraint satisfaction: Sudoku, N-Queens', 'Word search in grid', 'Generate all valid parentheses'],
    intuition: 'Think decision tree. At each node, try every choice: add it to path, recurse deeper, then remove it (backtrack) to try the next. Prune entire subtrees early by checking constraints before recursing.',
    steps: ['Base case: if path is complete, save a copy to results', 'Loop through available choices', '  Add choice to path  (make choice)', '  Recurse with updated state', '  Remove choice from path  ← BACKTRACK', 'Prune: skip invalid choices before recursing to cut branches'],
    complexity: { time: 'O(2^n) to O(n!)', space: 'O(n)', why: 'Space is recursion depth; time depends on branching factor. Pruning reduces actual calls significantly.' },
    gotchas: ['Append path[:] (a copy), not path — mutable reference gives wrong results', 'Must pop after every recursive call — missing one pop corrupts all future paths', 'Use a start index for combinations to avoid reuse and duplicate subsets'],
    template: `def backtrack(path, result, start, choices):
    if is_complete(path):          # base case
        result.append(path[:])     # copy, not reference!
        return

    for i in range(start, len(choices)):
        if not is_valid(choices[i], path):   # prune
            continue
        path.append(choices[i])    # choose
        backtrack(path, result, i+1, choices)  # explore
        path.pop()                 # un-choose (backtrack)`,
    demo: { problem: 'Subsets of [1, 2, 3]', input: 'nums = [1, 2, 3]', trace: ['path=[], start=0 → add [] to result', 'Choose 1 → path=[1] → choose 2 → [1,2] → choose 3 → [1,2,3] → add', 'Backtrack to [1,2] → add. Backtrack to [1] → choose 3 → [1,3] → add', 'Backtrack to [] → choose 2 → [2] → [2,3] → add. Backtrack → choose 3 → [3]'], answer: '[[], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]] ✓' },
  },
  'binary-search': {
    tagline: 'Eliminate half the search space per step — O(log n) on any monotonic decision',
    whenToUse: ['Search in sorted array', '"Minimise the maximum" or "maximise the minimum" (binary search on answer)', 'Find first or last occurrence', 'Rotated sorted array search'],
    intuition: 'If you can rephrase the problem as: "Is mid a valid answer?" and that gives a yes/no that splits the space into two halves — binary search applies. It is not just for finding a number.',
    steps: ['lo = 0, hi = n−1  (or answer-space range for binary-search-on-answer)', 'While lo <= hi: mid = lo + (hi − lo) // 2', 'arr[mid] == target → return mid', 'arr[mid] < target → search right half: lo = mid + 1', 'arr[mid] > target → search left half: hi = mid − 1'],
    complexity: { time: 'O(log n)', space: 'O(1)', why: 'Iterative binary search uses no extra memory; recursive adds O(log n) call stack' },
    gotchas: ['Integer overflow: use mid = lo + (hi−lo)//2, not (lo+hi)//2', 'Left-boundary (first occurrence): use hi = mid when found (not hi = mid−1)', 'Off-by-one: lo<=hi finds exact match; lo<hi finds a boundary'],
    template: `def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2   # avoid overflow
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1             # search right half
        else:
            hi = mid - 1             # search left half
    return -1                        # not found`,
    demo: { problem: 'Search Rotated Array — [4,5,6,7,0,1,2], target=0', input: 'arr=[4,5,6,7,0,1,2], target=0', trace: ['lo=0,hi=6: mid=3, arr[3]=7. Left half [4..7] sorted. 0 not in [4,7] → lo=4', 'lo=4,hi=6: mid=5, arr[5]=1. Right half sorted. target 0 < 1 → hi=4', 'lo=4,hi=4: mid=4, arr[4]=0 == target → return 4'], answer: 'Index 4 ✓' },
  },
  'top-k-elements': {
    tagline: 'Min-heap of size K — pop smallest when overflow to keep the K largest',
    whenToUse: ['Kth largest or smallest element', 'Top K frequent elements', 'K closest points to origin', 'Running top-K from a stream'],
    intuition: 'Maintain a min-heap of exactly K elements. When a new element arrives: push it. If heap size > K, pop the minimum. You are evicting the smallest, keeping only the K largest. heap[0] is always the Kth largest.',
    steps: ['Initialize min-heap = []', 'For each element: heappush(heap, element)', 'If len(heap) > k: heappop(heap)  ← evict the smallest', 'After all elements: heap contains the K largest', 'heap[0] is the Kth largest element'],
    complexity: { time: 'O(n log k)', space: 'O(k)', why: 'Each of n elements does O(log k) push/pop. Better than O(n log n) sort when k << n' },
    gotchas: ['Use a MIN-heap to find K LARGEST — the min is always the first to be evicted', 'Top K frequent: heap stores (count, value) tuples', 'K closest: heap stores (distance, point); negate distance to use max-concept'],
    template: `import heapq

def find_kth_largest(nums, k):
    min_heap = []
    for num in nums:
        heapq.heappush(min_heap, num)
        if len(min_heap) > k:
            heapq.heappop(min_heap)   # evict smallest
    return min_heap[0]                # Kth largest

# Top K frequent:
# from collections import Counter
# return [v for v,_ in Counter(nums).most_common(k)]`,
    demo: { problem: 'Kth Largest — [3,2,1,5,6,4], k=2', input: 'nums=[3,2,1,5,6,4], k=2', trace: ['Push 3,2 → heap=[2,3] (size=2, no pop)', 'Push 1 → heap=[1,2,3], size 3>2 → pop 1 → heap=[2,3]', 'Push 5 → [2,3,5] pop 2 → [3,5]', 'Push 6 → [3,5,6] pop 3 → [5,6]', 'Push 4 → [4,5,6] pop 4 → [5,6]. heap[0]=5'], answer: '5  (2nd largest) ✓' },
  },
  'k-way-merge': {
    tagline: 'Min-heap tracks the current head of each sorted source — global minimum in O(log k)',
    whenToUse: ['Merge K sorted linked lists or arrays', 'Kth smallest element in a sorted matrix', 'Find smallest range covering K lists', 'External sort (merge sorted file chunks)'],
    intuition: 'Push the first element of each list into a min-heap (with list index). The heap always surfaces the global minimum across all K sources. Pop it → output it → push the next element from that same list.',
    steps: ['Build heap: push (value, list_index, elem_index) for first element of each list', 'While heap not empty: pop (val, li, ei)', 'Append val to result', 'If ei+1 < len(lists[li]): push (lists[li][ei+1], li, ei+1)', 'Repeat until heap is empty'],
    complexity: { time: 'O(n log k)', space: 'O(k)', why: 'n = total elements. Heap stays at size k; each of n pops/pushes costs O(log k)' },
    gotchas: ['Heap needs a tiebreaker when values equal — include list_index to avoid comparing non-comparable objects', 'For linked lists: store (val, node), push node.next after popping', "Don't push when next element doesn't exist (index bounds check)"],
    template: `import heapq

def merge_k_sorted(lists):
    heap, result = [], []
    # Seed heap with first element of each list
    for i, lst in enumerate(lists):
        if lst:
            heapq.heappush(heap, (lst[0], i, 0))

    while heap:
        val, li, ei = heapq.heappop(heap)
        result.append(val)
        if ei + 1 < len(lists[li]):     # push next from same list
            heapq.heappush(heap, (lists[li][ei+1], li, ei+1))
    return result`,
    demo: { problem: 'Merge K Sorted — [[1,4,7],[2,5,8],[3,6,9]]', input: 'lists=[[1,4,7],[2,5,8],[3,6,9]]', trace: ['Init heap: [(1,0,0),(2,1,0),(3,2,0)]', 'Pop (1,0,0) → out:1, push (4,0,1) → heap:[(2,1,0),(3,2,0),(4,0,1)]', 'Pop (2,1,0) → out:2, push (5,1,1)', 'Pop (3,2,0) → out:3, push (6,2,1) … continues'], answer: '[1,2,3,4,5,6,7,8,9] ✓' },
  },
  'dynamic-programming': {
    tagline: 'Cache overlapping subproblems — define state, write recurrence, fill bottom-up',
    whenToUse: ['Count ways to reach a result (paths, change)', 'Min/max cost to achieve goal (coins, edit distance)', 'Knapsack: take-or-skip each item', 'Sequence: LCS, LIS, palindrome substrings'],
    intuition: 'DP applies when: (1) OPTIMAL SUBSTRUCTURE — optimal solution is built from optimal sub-solutions, and (2) OVERLAPPING SUBPROBLEMS — the same sub-problems recur. Define what dp[i] means, write the recurrence, add memoization.',
    steps: ['Define state in plain English: dp[i] = "min coins to make amount i"', 'Identify base cases: dp[0] = 0, dp[1] = ...', 'Write recurrence: dp[i] = f(dp[i−coin], dp[i−1], ...)', 'Choose: top-down (recursion + memo dict) or bottom-up (loop + table)', 'Answer lives at dp[n] or dp[m][n]'],
    complexity: { time: 'O(n) to O(n²) to O(n×W)', space: 'O(n)', why: 'Often reducible to O(1) or O(n) space by keeping only last 1-2 rows of the table' },
    gotchas: ['Wrong state definition breaks everything — think carefully what dp[i] means', 'dp array needs size n+1 (indices 0 through n)', 'Space optimization: if dp[i] only uses dp[i−1], use two variables instead of full array'],
    template: `# Coin Change: min coins to make amount
def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0              # base: 0 coins for amount 0

    for amt in range(1, amount + 1):
        for coin in coins:
            if coin <= amt:
                # Option: use this coin
                dp[amt] = min(dp[amt], dp[amt - coin] + 1)

    return dp[amount] if dp[amount] != float('inf') else -1`,
    demo: { problem: 'Coin Change — coins=[1,2,5], amount=6', input: 'coins=[1,2,5], amount=6', trace: ['dp=[0,∞,∞,∞,∞,∞,∞]', 'amt=1: coin=1 → dp[0]+1=1 → dp[1]=1', 'amt=2: coin=1→dp[1]+1=2; coin=2→dp[0]+1=1 → dp[2]=1', 'amt=5: coin=5→dp[0]+1=1 → dp[5]=1', 'amt=6: coin=1→dp[5]+1=2; coin=5→dp[1]+1=2 → dp[6]=2'], answer: '2 coins  (5+1) ✓' },
  },
  'union-find': {
    tagline: 'Disjoint Set Union — near O(1) merge and find with path compression + union by rank',
    whenToUse: ['Count connected components', 'Check if two nodes are in same component', 'Detect cycle in undirected graph', "Kruskal's MST algorithm"],
    intuition: 'Each set has a representative (root). Find traces up to the root. Union merges two sets by connecting roots. Path compression flattens the tree on every find. Union by rank keeps trees shallow. Together: α(n) ≈ O(1).',
    steps: ['Init: parent[i]=i, rank[i]=0 for all nodes', 'Find(x): if parent[x]≠x → parent[x]=find(parent[x]) (path compression)', 'Union(x,y): rootX=find(x), rootY=find(y). Same root → already connected', 'Attach smaller rank tree under larger: if rank[rx]<rank[ry] swap; set parent[ry]=rx', 'Increment rank only when both roots have equal rank'],
    complexity: { time: 'O(α(n)) ≈ O(1)', space: 'O(n)', why: 'α is inverse Ackermann — effectively constant for all practical inputs' },
    gotchas: ['Path compression mutates parent array — intentional; it makes future finds faster', 'Only increment rank when merging two equal-rank roots', 'Cycle detection: if find(u)==find(v) BEFORE union, edge u-v creates a cycle'],
    template: `class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank   = [0] * n
        self.count  = n          # number of components

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # compress
        return self.parent[x]

    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx == ry: return False         # already connected
        if self.rank[rx] < self.rank[ry]: rx, ry = ry, rx
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]: self.rank[rx] += 1
        self.count -= 1
        return True`,
    demo: { problem: 'Number of Provinces — 3 nodes, edge 0-1', input: 'isConnected=[[1,1,0],[1,1,0],[0,0,1]]', trace: ['Init: parent=[0,1,2], count=3', 'union(0,1): find(0)=0, find(1)=1. Different → parent[1]=0, count=2', 'No edge involving node 2 from off-diagonal cells', 'Result: 2 components — {0,1} and {2}'], answer: '2 provinces ✓' },
  },
};

// LeetCode URL map
const LEETCODE_URLS: Record<string, string> = {
  'Valid Palindrome': 'https://leetcode.com/problems/valid-palindrome/',
  '3Sum': 'https://leetcode.com/problems/3sum/',
  'Container With Most Water': 'https://leetcode.com/problems/container-with-most-water/',
  'Remove Duplicates': 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/',
  'Longest Substring No Repeat': 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
  'Max Subarray': 'https://leetcode.com/problems/maximum-subarray/',
  'Min Window Substring': 'https://leetcode.com/problems/minimum-window-substring/',
  'Fruit Into Baskets': 'https://leetcode.com/problems/fruit-into-baskets/',
  'Linked List Cycle': 'https://leetcode.com/problems/linked-list-cycle/',
  'Find Middle': 'https://leetcode.com/problems/middle-of-the-linked-list/',
  'Happy Number': 'https://leetcode.com/problems/happy-number/',
  'Palindrome LL': 'https://leetcode.com/problems/palindrome-linked-list/',
  'Merge Intervals': 'https://leetcode.com/problems/merge-intervals/',
  'Insert Interval': 'https://leetcode.com/problems/insert-interval/',
  'Meeting Rooms II': 'https://leetcode.com/problems/meeting-rooms-ii/',
  'Non-overlapping Intervals': 'https://leetcode.com/problems/non-overlapping-intervals/',
  'Missing Number': 'https://leetcode.com/problems/missing-number/',
  'Find Duplicate': 'https://leetcode.com/problems/find-the-duplicate-number/',
  'First Missing Positive': 'https://leetcode.com/problems/first-missing-positive/',
  'Find All Duplicates': 'https://leetcode.com/problems/find-all-duplicates-in-an-array/',
  'Reverse Linked List': 'https://leetcode.com/problems/reverse-linked-list/',
  'Rotate List': 'https://leetcode.com/problems/rotate-list/',
  'Reverse Sublist': 'https://leetcode.com/problems/reverse-linked-list-ii/',
  'Reverse in k-Group': 'https://leetcode.com/problems/reverse-nodes-in-k-group/',
  'Binary Tree BFS': 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
  'Level Order Traversal': 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
  'Rotten Oranges': 'https://leetcode.com/problems/rotting-oranges/',
  'Word Ladder': 'https://leetcode.com/problems/word-ladder/',
  'Path Sum': 'https://leetcode.com/problems/path-sum/',
  'Tree Diameter': 'https://leetcode.com/problems/diameter-of-binary-tree/',
  'Number of Islands': 'https://leetcode.com/problems/number-of-islands/',
  'Clone Graph': 'https://leetcode.com/problems/clone-graph/',
  'Find Median Stream': 'https://leetcode.com/problems/find-median-from-data-stream/',
  'Sliding Window Median': 'https://leetcode.com/problems/sliding-window-median/',
  'IPO Problem': 'https://leetcode.com/problems/ipo/',
  'Subsets': 'https://leetcode.com/problems/subsets/',
  'Permutations': 'https://leetcode.com/problems/permutations/',
  'Combination Sum': 'https://leetcode.com/problems/combination-sum/',
  'Sudoku Solver': 'https://leetcode.com/problems/sudoku-solver/',
  'Search Rotated Array': 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
  'Find Peak Element': 'https://leetcode.com/problems/find-peak-element/',
  'Koko Bananas': 'https://leetcode.com/problems/koko-eating-bananas/',
  'Search 2D Matrix': 'https://leetcode.com/problems/search-a-2d-matrix/',
  'K Closest Points': 'https://leetcode.com/problems/k-closest-points-to-origin/',
  'Top K Frequent': 'https://leetcode.com/problems/top-k-frequent-elements/',
  'Kth Largest': 'https://leetcode.com/problems/kth-largest-element-in-an-array/',
  'Task Scheduler': 'https://leetcode.com/problems/task-scheduler/',
  'Merge K Sorted Lists': 'https://leetcode.com/problems/merge-k-sorted-lists/',
  'Kth Smallest Matrix': 'https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/',
  'Coin Change': 'https://leetcode.com/problems/coin-change/',
  'Longest Common Subsequence': 'https://leetcode.com/problems/longest-common-subsequence/',
  'House Robber': 'https://leetcode.com/problems/house-robber/',
  'Knapsack': 'https://leetcode.com/problems/partition-equal-subset-sum/',
  'Number of Provinces': 'https://leetcode.com/problems/number-of-provinces/',
  'Redundant Connection': 'https://leetcode.com/problems/redundant-connection/',
  'Accounts Merge': 'https://leetcode.com/problems/accounts-merge/',
};

interface QuizQuestion {
  type: 'mcq' | 'short' | 'architecture';
  question: string;
  options?: string[];
  correctAnswer?: string;
  userAnswer?: string;
  feedback?: string;
  score?: number;
}

interface HintState {
  patternId: string;
  patternName: string;
  tab: 'explain' | 'hint' | 'approach';
  hintLevel: number;
  content: string;
  loading: boolean;
  error: string;
}

function saveSession(session: { topicsCovered: string[]; struggles: string; nextFocus: string; aiResponse: string; type: string }) {
  try {
    const sessions = JSON.parse(localStorage.getItem('ai-sessions') || '[]');
    sessions.push({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...session,
    });
    localStorage.setItem('ai-sessions', JSON.stringify(sessions));
  } catch {}
}

export default function DSATrack() {
  const { data, isLoaded, toggleProblemSolved } = useProgress();
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [showApproach, setShowApproach] = useState(false);
  const [patternTabs, setPatternTabs] = useState<Record<string, 'approach' | 'template' | 'problems'>>({});
  const getTab = (id: string) => patternTabs[id] ?? 'approach';
  const setTab = (id: string, tab: 'approach' | 'template' | 'problems') =>
    setPatternTabs(prev => ({ ...prev, [id]: tab }));

  // Quiz state
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizPattern, setQuizPattern] = useState('');
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizFeedback, setQuizFeedback] = useState<Record<number, { text: string; score: number }>>({});
  const [quizDone, setQuizDone] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [checkingAnswer, setCheckingAnswer] = useState(false);

  // Hint panel state
  const [hintPanel, setHintPanel] = useState<HintState | null>(null);

  // Paste Solution state
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteProblem, setPasteProblem] = useState('');
  const [pasteCode, setPasteCode] = useState('');
  const [pasteStuck, setPasteStuck] = useState('');
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pasteResult, setPasteResult] = useState('');
  const [pasteError, setPasteError] = useState('');

  const filteredPatterns = useMemo(() => {
    if (filter === 'All') return PATTERNS;
    return PATTERNS.filter(
      p => p.difficulty === filter || p.problems.some(pr => pr.difficulty === filter)
    );
  }, [filter]);

  const startQuiz = async (patternName: string) => {
    setQuizOpen(true);
    setQuizPattern(patternName);
    setQuizLoading(true);
    setQuizQuestions([]);
    setQuizIndex(0);
    setQuizAnswers({});
    setQuizFeedback({});
    setQuizDone(false);
    setQuizError('');

    const prompt = `Generate a quiz about the DSA pattern: "${patternName}". Return EXACTLY this JSON structure (no markdown, just raw JSON):
{
  "questions": [
    {"type":"mcq","question":"...","options":["A","B","C","D"],"correctAnswer":"A"},
    {"type":"mcq","question":"...","options":["A","B","C","D"],"correctAnswer":"B"},
    {"type":"short","question":"..."},
    {"type":"short","question":"..."},
    {"type":"architecture","question":"..."}
  ]
}
Make 2 MCQ conceptual, 2 short answer applied, 1 system/architecture question about ${patternName}.`;

    try {
      const raw = await callClaude(prompt);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response format');
      const parsed = JSON.parse(jsonMatch[0]);
      setQuizQuestions(parsed.questions || []);
    } catch (e: unknown) {
      setQuizError(e instanceof Error ? e.message : 'Failed to generate quiz');
    } finally {
      setQuizLoading(false);
    }
  };

  const checkShortAnswer = async (questionIndex: number) => {
    const q = quizQuestions[questionIndex];
    const answer = quizAnswers[questionIndex] || '';
    if (!answer.trim()) return;
    setCheckingAnswer(true);
    try {
      const prompt = `Quiz question about "${quizPattern}": "${q.question}"
Student answer: "${answer}"
Evaluate and respond with JSON: {"score": 0-10, "feedback": "brief feedback explaining what's right/wrong and the ideal answer"}`;
      const raw = await callClaude(prompt, false);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        setQuizFeedback(prev => ({ ...prev, [questionIndex]: result }));
      }
    } catch {}
    setCheckingAnswer(false);
  };

  const openHintPanel = async (pattern: Pattern, tab: 'explain' | 'hint' | 'approach') => {
    const cacheKey = `hint-${pattern.id}-${tab}-0`;
    const cached = localStorage.getItem(cacheKey);

    setHintPanel({
      patternId: pattern.id,
      patternName: pattern.name,
      tab,
      hintLevel: 0,
      content: cached || '',
      loading: !cached,
      error: '',
    });

    if (!cached) {
      const prompts: Record<string, string> = {
        explain: `Explain the "${pattern.name}" DSA pattern to a complete beginner. Use a simple real-world analogy, no code. Keep it under 200 words. Make it memorable.`,
        hint: `Give me Hint 1 for the "${pattern.name}" pattern. Just one gentle nudge about the key insight, don't give the full approach. Under 100 words.`,
        approach: `Give a step-by-step algorithm walkthrough for the "${pattern.name}" DSA pattern. No code, just the approach. Number each step. Under 250 words.`,
      };
      try {
        const result = await callClaude(prompts[tab]);
        localStorage.setItem(cacheKey, result);
        setHintPanel(prev => prev ? { ...prev, content: result, loading: false } : null);
      } catch (e: unknown) {
        setHintPanel(prev => prev ? { ...prev, error: e instanceof Error ? e.message : 'Error', loading: false } : null);
      }
    }
  };

  const loadNextHint = async () => {
    if (!hintPanel) return;
    const nextLevel = hintPanel.hintLevel + 1;
    if (nextLevel > 2) return;
    const cacheKey = `hint-${hintPanel.patternId}-hint-${nextLevel}`;
    const cached = localStorage.getItem(cacheKey);

    setHintPanel(prev => prev ? { ...prev, hintLevel: nextLevel, content: cached || '', loading: !cached } : null);

    if (!cached) {
      const hintLabels = ['', 'a more specific', 'the final'];
      const prompt = `Give me Hint ${nextLevel + 1} for "${hintPanel.patternName}" — make it ${hintLabels[nextLevel]} hint. Still no full solution, just guide. Under 120 words.`;
      try {
        const result = await callClaude(prompt);
        localStorage.setItem(cacheKey, result);
        setHintPanel(prev => prev ? { ...prev, content: result, loading: false } : null);
      } catch (e: unknown) {
        setHintPanel(prev => prev ? { ...prev, error: e instanceof Error ? e.message : 'Error', loading: false } : null);
      }
    }
  };

  const submitSolution = async () => {
    if (!pasteProblem || !pasteCode) return;
    setPasteLoading(true);
    setPasteError('');
    setPasteResult('');

    const prompt = `Review this coding solution for the problem "${pasteProblem}".

Code:
\`\`\`
${pasteCode}
\`\`\`

Where I got stuck: ${pasteStuck || 'Not specified'}

Please provide:
1. **What went wrong** — identify bugs or incorrect logic
2. **Pattern you missed** — what DSA concept/pattern should be applied here
3. **Optimized solution** — provide the optimal approach with explanation
4. **Key takeaway** — one memorable insight for this problem type

Keep the response focused and under 500 words.`;

    try {
      const result = await callClaude(prompt, false);
      setPasteResult(result);
      saveSession({
        topicsCovered: [pasteProblem],
        struggles: pasteStuck || 'code review',
        nextFocus: `Review and understand optimal ${pasteProblem} solution`,
        aiResponse: result,
        type: 'dsa',
      });
    } catch (e: unknown) {
      setPasteError(e instanceof Error ? e.message : 'Failed to analyze solution');
    } finally {
      setPasteLoading(false);
    }
  };

  const getQuizScore = () => {
    let total = 0;
    quizQuestions.forEach((q, i) => {
      if (q.type === 'mcq') {
        if (quizAnswers[i] === q.correctAnswer) total += 10;
      } else {
        total += quizFeedback[i]?.score || 0;
      }
    });
    return total;
  };

  if (!isLoaded) return null;

  const totalSolved = data.dsa.solvedProblems.length;
  const totalProblems = PATTERNS.reduce((sum, p) => sum + p.problems.length, 0);

  return (
    <PageContainer title="DSA Track" description="Master coding patterns for FAANG">
      {/* Top bar with Quiz Me */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <p className="font-heading font-semibold text-foreground">
            {totalSolved} / {totalProblems} solved
          </p>
          <button
            onClick={() => setPasteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-foreground rounded-lg text-sm transition-all"
          >
            <Code2 className="w-4 h-4 text-accent" />
            Paste Solution
          </button>
        </div>
        <button
          onClick={() => startQuiz('DSA Patterns (Mixed)')}
          className="flex items-center gap-2 px-4 py-2 bg-accent bg-opacity-20 hover:bg-opacity-30 text-accent border border-accent rounded-lg text-sm font-medium transition-all"
        >
          <Brain className="w-4 h-4" />
          Quiz Me
        </button>
      </div>

      {/* Progress Bar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="font-heading font-semibold text-foreground">Progress</p>
          <p className="text-accent font-bold">{((totalSolved / totalProblems) * 100).toFixed(0)}%</p>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(totalSolved / totalProblems) * 100}%` }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-accent to-success rounded-full"
          />
        </div>
      </motion.div>

      {/* Approach Guide */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
        <button
          onClick={() => setShowApproach(!showApproach)}
          className="w-full flex items-center justify-between p-4 rounded-xl border transition-all"
          style={{
            background: showApproach ? 'rgba(0,212,255,0.07)' : 'rgba(0,212,255,0.04)',
            borderColor: showApproach ? 'rgba(0,212,255,0.4)' : 'rgba(0,212,255,0.2)',
          }}
        >
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent" />
            <span className="font-heading font-semibold text-foreground">How to Solve Any DSA Problem</span>
            <span className="text-xs text-muted ml-1 hidden sm:inline">(5-step framework + demo)</span>
          </div>
          {showApproach
            ? <ChevronUp className="w-4 h-4 text-accent" />
            : <ChevronDown className="w-4 h-4 text-accent" />}
        </button>

        <AnimatePresence>
          {showApproach && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-2 bg-card border border-neutral-700 rounded-xl p-5">

                {/* 5-Step Framework */}
                <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-4">The Framework — use this order, every time</p>
                <div className="grid grid-cols-5 gap-3 mb-6">
                  {[
                    { num: 1, title: 'READ',    time: '2 min',  color: '#00d4ff', desc: 'Note constraints, input type, size, edge cases. What can be null? What are the bounds?' },
                    { num: 2, title: 'PATTERN', time: '1 min',  color: '#a855f7', desc: 'Think brute force first, then ask: what’s the bottleneck? Sorted → binary search. Lookup → HashMap. Contiguous → sliding window.' },
                    { num: 3, title: 'PLAN',    time: '3 min',  color: '#fbbf24', desc: 'Write pseudocode out loud. State the time and space complexity before writing a single line of code.' },
                    { num: 4, title: 'CODE',    time: '15 min', color: '#00ff88', desc: 'Clean variable names. Handle edge cases at the top. Don’t over-engineer — get it working first.' },
                    { num: 5, title: 'VERIFY',  time: '4 min',  color: '#ff6b6b', desc: 'Trace through the given examples. Then test: empty input, single element, negatives, duplicates.' },
                  ].map((step, i) => (
                    <div key={i} className="relative">
                      {i < 4 && (
                        <div className="absolute top-6 -right-2 z-10 text-neutral-600 text-sm select-none">→</div>
                      )}
                      <div className="border rounded-lg p-3 h-full" style={{ borderColor: step.color + '44', background: step.color + '08' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: step.color + '25', color: step.color }}>
                            {step.num}
                          </span>
                          <span className="font-bold text-sm" style={{ color: step.color }}>{step.title}</span>
                          <span className="text-xs text-muted ml-auto">{step.time}</span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Demo: Two Sum */}
                <div className="border-t border-neutral-700 pt-5 mb-5">
                  <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-3">Demo — Two Sum: walk each step</p>
                  <div className="bg-neutral-900 rounded-lg px-4 py-3 mb-3 border border-neutral-800">
                    <p className="text-sm text-foreground font-mono">Given int[] nums and int target — return indices of two numbers that add up to target.</p>
                    <p className="text-xs text-muted mt-1">e.g. nums=[2,7,11,15], target=9 → [0,1]</p>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="bg-neutral-900 rounded-lg p-3 border border-[#00d4ff]/20">
                      <p className="text-[#00d4ff] font-bold text-xs mb-2">1 READ</p>
                      <p className="text-xs text-muted">Return indices, not values. Exactly one answer guaranteed. Can’t use the same element twice.</p>
                    </div>
                    <div className="bg-neutral-900 rounded-lg p-3 border border-[#a855f7]/20">
                      <p className="text-[#a855f7] font-bold text-xs mb-2">2 PATTERN</p>
                      <p className="text-xs text-muted">Brute force: O(n²) nested loop. Bottleneck: finding the complement. <span className="text-accent">HashMap = O(1) lookup → O(n) total.</span></p>
                    </div>
                    <div className="bg-neutral-900 rounded-lg p-3 border border-[#fbbf24]/20">
                      <p className="text-[#fbbf24] font-bold text-xs mb-2">3 PLAN</p>
                      <p className="text-xs text-muted font-mono">map&#123;val→idx&#125;<br/>for each num:<br/>&nbsp; need = target-num<br/>&nbsp; if need in map:<br/>&nbsp;&nbsp; return indices<br/>&nbsp; map[num]=i</p>
                    </div>
                    <div className="bg-neutral-900 rounded-lg p-3 border border-[#00ff88]/20">
                      <p className="text-[#00ff88] font-bold text-xs mb-2">4 CODE</p>
                      <p className="text-xs text-muted font-mono">seen=&#123;&#125;<br/>for i,n in nums:<br/>&nbsp; need=t-n<br/>&nbsp; if need in seen:<br/>&nbsp;&nbsp; return [seen[need],i]<br/>&nbsp; seen[n]=i</p>
                    </div>
                    <div className="bg-neutral-900 rounded-lg p-3 border border-[#ff6b6b]/20">
                      <p className="text-[#ff6b6b] font-bold text-xs mb-2">5 VERIFY</p>
                      <p className="text-xs text-muted">[2,7], t=9:<br/>• seen=&#123;&#125;, need=7? No → seen=&#123;2:0&#125;<br/>• need=2? Yes! → return [0,1] ✓<br/>Edge: nums=[] → loop never runs ✓</p>
                    </div>
                  </div>
                </div>

                {/* Pattern cheat sheet */}
                <div className="border-t border-neutral-700 pt-4">
                  <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-3">Pattern Recognition Cheat Sheet — spot the signal, apply the pattern</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    {[
                      ['Sorted array + find pair / element',      'Two Pointers or Binary Search'],
                      ['Contiguous subarray min / max / count',   'Sliding Window'],
                      ['Finding element in sorted array',          'Binary Search'],
                      ['Fast lookup / dedup / frequency count',    'HashMap or HashSet'],
                      ['Tree traversal (any order)',               'DFS (recursion) or BFS (queue)'],
                      ['Shortest path in unweighted graph',        'BFS'],
                      ['All combinations / permutations',          'Backtracking'],
                      ['Optimal substructure + overlapping subs',  'Dynamic Programming'],
                      ['Linked list cycle / middle element',        'Fast & Slow Pointers'],
                      ['Top K largest / smallest elements',        'Min-Heap or Max-Heap'],
                      ['Range sum / product queries on array',     'Prefix Sum'],
                      ['Intervals overlap / merge',                'Sort by start + Greedy'],
                    ].map(([signal, pattern]) => (
                      <div key={signal} className="flex items-baseline gap-2 text-xs">
                        <span className="text-accent flex-shrink-0">→</span>
                        <span className="text-muted flex-1">{signal}</span>
                        <span className="text-foreground font-semibold flex-shrink-0 text-right">{pattern}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Filter Buttons */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex gap-2 mb-6 flex-wrap">
        {(['All', 'Easy', 'Medium', 'Hard'] as const).map(difficulty => (
          <button
            key={difficulty}
            onClick={() => setFilter(difficulty)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filter === difficulty ? 'bg-accent text-background' : 'bg-neutral-800 text-foreground hover:text-accent'
            }`}
          >
            {difficulty}
          </button>
        ))}
      </motion.div>

      {/* Patterns List */}
      <div className="space-y-3">
        {filteredPatterns.map((pattern, index) => {
          const isExpanded = expandedPattern === pattern.id;
          const solvedInPattern = pattern.problems.filter(p =>
            data.dsa.solvedProblems.includes(`${pattern.id}-${p.id}`)
          ).length;

          return (
            <motion.div key={pattern.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <GlassCard hoverable onClick={() => setExpandedPattern(isExpanded ? null : pattern.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-accent" /> : <ChevronDown className="w-5 h-5 text-muted" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-foreground">{pattern.name}</h3>
                      <p className="text-sm text-muted">{solvedInPattern} / {pattern.problems.length} problems</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Hint button */}
                    <button
                      onClick={e => { e.stopPropagation(); openHintPanel(pattern, 'explain'); }}
                      title="Get hints & explanation"
                      className="p-1.5 text-muted hover:text-accent transition-colors rounded"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                    {/* Quiz this pattern */}
                    <button
                      onClick={e => { e.stopPropagation(); startQuiz(pattern.name); }}
                      title="Quiz this pattern"
                      className="p-1.5 text-muted hover:text-accent transition-colors rounded"
                    >
                      <Brain className="w-4 h-4" />
                    </button>
                    <DifficultyBadge difficulty={pattern.difficulty} />
                    <div className="w-16 h-2 bg-neutral-800 rounded">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(solvedInPattern / pattern.problems.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-accent rounded"
                      />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (() => {
                    const guide = PATTERN_GUIDES[pattern.id];
                    const currentTab = getTab(pattern.id);
                    return (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-neutral-700"
                      >
                        {/* Inner tab bar */}
                        <div className="flex gap-1 mb-4" onClick={e => e.stopPropagation()}>
                          {(['approach', 'template', 'problems'] as const).map(tab => (
                            <button
                              key={tab}
                              onClick={e => { e.stopPropagation(); setTab(pattern.id, tab); }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                currentTab === tab
                                  ? 'bg-accent text-[#0a0a0f] border-accent'
                                  : 'bg-transparent text-muted border-neutral-700 hover:border-accent hover:text-foreground'
                              }`}
                            >
                              {tab === 'approach' ? '📖 Approach' : tab === 'template' ? '💻 Template & Demo' : `📋 Problems (${solvedInPattern}/${pattern.problems.length})`}
                            </button>
                          ))}
                        </div>

                        {/* ── APPROACH TAB ── */}
                        {currentTab === 'approach' && guide && (
                          <div className="space-y-4" onClick={e => e.stopPropagation()}>
                            {/* Tagline */}
                            <p className="text-sm text-accent font-medium">{guide.tagline}</p>

                            <div className="grid grid-cols-2 gap-4">
                              {/* When to use */}
                              <div className="bg-neutral-900 rounded-lg p-3">
                                <p className="text-xs text-success font-semibold uppercase tracking-wide mb-2">🎯 Spot It When...</p>
                                <ul className="space-y-1.5">
                                  {guide.whenToUse.map((signal, i) => (
                                    <li key={i} className="flex gap-2 text-xs">
                                      <span className="text-success flex-shrink-0 mt-0.5">→</span>
                                      <span className="text-foreground">{signal}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Complexity + Gotchas */}
                              <div className="space-y-3">
                                <div className="bg-neutral-900 rounded-lg p-3">
                                  <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wide mb-2">⚡ Complexity</p>
                                  <div className="flex gap-4">
                                    <div><p className="text-xs text-muted">Time</p><p className="text-sm font-bold text-foreground">{guide.complexity.time}</p></div>
                                    <div><p className="text-xs text-muted">Space</p><p className="text-sm font-bold text-foreground">{guide.complexity.space}</p></div>
                                  </div>
                                  <p className="text-xs text-muted mt-1.5 italic">{guide.complexity.why}</p>
                                </div>
                                <div className="bg-neutral-900 rounded-lg p-3">
                                  <p className="text-xs text-secondary font-semibold uppercase tracking-wide mb-2">⚠️ Common Gotchas</p>
                                  <ul className="space-y-1">
                                    {guide.gotchas.map((g, i) => (
                                      <li key={i} className="flex gap-2 text-xs">
                                        <span className="text-secondary flex-shrink-0">!</span>
                                        <span className="text-muted">{g}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>

                            {/* Core intuition */}
                            <div className="bg-accent/8 border border-accent/25 rounded-lg p-3">
                              <p className="text-xs text-accent font-semibold uppercase tracking-wide mb-1.5">💡 Core Intuition</p>
                              <p className="text-sm text-foreground leading-relaxed">{guide.intuition}</p>
                            </div>

                            {/* Step-by-step */}
                            <div className="bg-neutral-900 rounded-lg p-3">
                              <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-2">Step-by-Step Approach</p>
                              <ol className="space-y-1.5">
                                {guide.steps.map((step, i) => (
                                  <li key={i} className="flex gap-2.5 text-xs">
                                    <span className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                                    <span className="text-foreground font-mono">{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        )}

                        {/* ── TEMPLATE TAB ── */}
                        {currentTab === 'template' && guide && (
                          <div className="space-y-4" onClick={e => e.stopPropagation()}>
                            {/* Code template */}
                            <div>
                              <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-2">Python Template</p>
                              <pre className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 text-xs text-accent font-mono overflow-x-auto whitespace-pre leading-5">{guide.template}</pre>
                            </div>

                            {/* Demo walkthrough */}
                            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                              <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-3">🔍 Demo Walkthrough</p>
                              <div className="bg-neutral-800 rounded p-2 mb-3">
                                <p className="text-xs text-foreground font-semibold">{guide.demo.problem}</p>
                                <p className="text-xs text-muted font-mono mt-0.5">{guide.demo.input}</p>
                              </div>
                              <ol className="space-y-1.5 mb-3">
                                {guide.demo.trace.map((step, i) => (
                                  <li key={i} className="flex gap-2 text-xs">
                                    <span className="text-accent font-bold flex-shrink-0">{i + 1}.</span>
                                    <span className="text-muted font-mono">{step}</span>
                                  </li>
                                ))}
                              </ol>
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-700">
                                <span className="text-xs text-success font-bold">Answer:</span>
                                <span className="text-xs text-foreground font-mono">{guide.demo.answer}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ── PROBLEMS TAB ── */}
                        {currentTab === 'problems' && (
                          <div className="space-y-2" onClick={e => e.stopPropagation()}>
                            {pattern.problems.map(problem => {
                              const isSolved = data.dsa.solvedProblems.includes(`${pattern.id}-${problem.id}`);
                              const lcUrl = LEETCODE_URLS[problem.name];
                              return (
                                <motion.div
                                  key={problem.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="flex items-center gap-3 p-2 hover:bg-neutral-700 hover:bg-opacity-30 rounded group"
                                >
                                  <div className="cursor-pointer" onClick={e => { e.stopPropagation(); toggleProblemSolved(pattern.id, problem.id); }}>
                                    <motion.div whileHover={{ scale: 1.1 }}>
                                      {isSolved ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5 text-muted group-hover:text-accent" />}
                                    </motion.div>
                                  </div>
                                  <div className="flex-1">
                                    {lcUrl ? (
                                      <a href={lcUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                        className={`text-sm flex items-center gap-1 hover:text-accent transition-colors ${isSolved ? 'text-muted line-through' : 'text-foreground'}`}>
                                        {problem.name}<ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                      </a>
                                    ) : (
                                      <p className={`text-sm ${isSolved ? 'text-muted line-through' : 'text-foreground'}`}>{problem.name}</p>
                                    )}
                                  </div>
                                  <DifficultyBadge difficulty={problem.difficulty} />
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Stats Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid grid-cols-3 gap-6 mt-12">
        <GlassCard>
          <p className="text-muted text-sm mb-2">Easy Problems</p>
          <p className="text-3xl font-heading font-bold text-success">
            {PATTERNS.reduce((sum, p) => sum + p.problems.filter(pr => pr.difficulty === 'Easy' && data.dsa.solvedProblems.includes(`${p.id}-${pr.id}`)).length, 0)}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-muted text-sm mb-2">Medium Problems</p>
          <p className="text-3xl font-heading font-bold text-yellow-400">
            {PATTERNS.reduce((sum, p) => sum + p.problems.filter(pr => pr.difficulty === 'Medium' && data.dsa.solvedProblems.includes(`${p.id}-${pr.id}`)).length, 0)}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-muted text-sm mb-2">Hard Problems</p>
          <p className="text-3xl font-heading font-bold text-secondary">
            {PATTERNS.reduce((sum, p) => sum + p.problems.filter(pr => pr.difficulty === 'Hard' && data.dsa.solvedProblems.includes(`${p.id}-${pr.id}`)).length, 0)}
          </p>
        </GlassCard>
      </motion.div>

      {/* Paste Your Solution (Feature 1) */}
      <AnimatePresence>
        {pasteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setPasteOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card border border-neutral-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-xl text-foreground">Paste Your Solution</h3>
                <button onClick={() => setPasteOpen(false)} className="text-muted hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted mb-1 block">Problem Name</label>
                  <input
                    value={pasteProblem}
                    onChange={e => setPasteProblem(e.target.value)}
                    placeholder="e.g., Two Sum, Merge Intervals..."
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted mb-1 block">Your Code</label>
                  <textarea
                    value={pasteCode}
                    onChange={e => setPasteCode(e.target.value)}
                    placeholder="Paste your code here..."
                    rows={8}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm text-foreground font-mono focus:outline-none focus:border-accent resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted mb-1 block">Where did you get stuck?</label>
                  <textarea
                    value={pasteStuck}
                    onChange={e => setPasteStuck(e.target.value)}
                    placeholder="Describe where you got stuck or what confused you..."
                    rows={3}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm text-foreground focus:outline-none focus:border-accent resize-none"
                  />
                </div>

                <button
                  onClick={submitSolution}
                  disabled={pasteLoading || !pasteProblem || !pasteCode}
                  className="w-full py-3 bg-accent bg-opacity-20 hover:bg-opacity-30 text-accent border border-accent rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {pasteLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</> : '🔍 Analyze with Claude'}
                </button>
                {pasteError && <p className="text-sm text-secondary">{pasteError}</p>}

                {pasteResult && (
                  <div className="bg-neutral-800 rounded-lg p-4 border border-accent border-opacity-30">
                    <h4 className="text-accent font-semibold mb-3 text-sm">AI Analysis</h4>
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{pasteResult}</pre>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Panel (Feature 4) */}
      <AnimatePresence>
        {quizOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card border border-neutral-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading font-bold text-xl text-foreground">Quiz: {quizPattern}</h3>
                  {quizQuestions.length > 0 && !quizDone && (
                    <p className="text-sm text-muted mt-1">Question {quizIndex + 1} of {quizQuestions.length}</p>
                  )}
                </div>
                <button onClick={() => setQuizOpen(false)} className="text-muted hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>

              {quizLoading && (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-accent animate-spin" />
                  <span className="ml-3 text-muted">Generating quiz...</span>
                </div>
              )}

              {quizError && (
                <div className="text-center py-8">
                  <p className="text-secondary mb-4">{quizError}</p>
                  <button onClick={() => startQuiz(quizPattern)} className="text-accent hover:underline text-sm">Retry</button>
                </div>
              )}

              {/* Progress bar */}
              {quizQuestions.length > 0 && (
                <div className="h-1.5 bg-neutral-800 rounded-full mb-6 overflow-hidden">
                  <motion.div
                    animate={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }}
                    className="h-full bg-accent rounded-full"
                  />
                </div>
              )}

              {/* Question */}
              {quizQuestions.length > 0 && !quizDone && !quizLoading && (
                <div>
                  {quizQuestions[quizIndex] && (
                    <div>
                      <div className="mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          quizQuestions[quizIndex].type === 'mcq' ? 'bg-accent bg-opacity-20 text-accent' :
                          quizQuestions[quizIndex].type === 'short' ? 'bg-yellow-400 bg-opacity-20 text-yellow-400' :
                          'bg-purple-400 bg-opacity-20 text-purple-400'
                        }`}>
                          {quizQuestions[quizIndex].type === 'mcq' ? 'Multiple Choice' :
                           quizQuestions[quizIndex].type === 'short' ? 'Short Answer' : 'Architecture'}
                        </span>
                      </div>
                      <p className="text-foreground font-medium mb-4">{quizQuestions[quizIndex].question}</p>

                      {quizQuestions[quizIndex].type === 'mcq' && quizQuestions[quizIndex].options && (
                        <div className="space-y-2">
                          {quizQuestions[quizIndex].options!.map((opt, i) => {
                            const selected = quizAnswers[quizIndex] === opt;
                            const isCorrect = opt === quizQuestions[quizIndex].correctAnswer;
                            const hasAnswered = !!quizAnswers[quizIndex];
                            return (
                              <button
                                key={i}
                                onClick={() => !hasAnswered && setQuizAnswers(prev => ({ ...prev, [quizIndex]: opt }))}
                                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                                  hasAnswered
                                    ? isCorrect ? 'border-success bg-success bg-opacity-10 text-success'
                                      : selected ? 'border-secondary bg-secondary bg-opacity-10 text-secondary'
                                      : 'border-neutral-700 text-muted'
                                    : selected ? 'border-accent bg-accent bg-opacity-10 text-accent'
                                    : 'border-neutral-700 text-foreground hover:border-accent'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                          {quizAnswers[quizIndex] && (
                            <p className={`text-sm mt-2 ${quizAnswers[quizIndex] === quizQuestions[quizIndex].correctAnswer ? 'text-success' : 'text-secondary'}`}>
                              {quizAnswers[quizIndex] === quizQuestions[quizIndex].correctAnswer ? '✓ Correct!' : `✗ Correct answer: ${quizQuestions[quizIndex].correctAnswer}`}
                            </p>
                          )}
                        </div>
                      )}

                      {(quizQuestions[quizIndex].type === 'short' || quizQuestions[quizIndex].type === 'architecture') && (
                        <div>
                          <textarea
                            value={quizAnswers[quizIndex] || ''}
                            onChange={e => setQuizAnswers(prev => ({ ...prev, [quizIndex]: e.target.value }))}
                            placeholder="Type your answer..."
                            rows={4}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm text-foreground focus:outline-none focus:border-accent resize-none"
                          />
                          {!quizFeedback[quizIndex] ? (
                            <button
                              onClick={() => checkShortAnswer(quizIndex)}
                              disabled={checkingAnswer || !quizAnswers[quizIndex]?.trim()}
                              className="mt-2 px-4 py-2 bg-accent bg-opacity-20 text-accent rounded-lg text-sm disabled:opacity-50 hover:bg-opacity-30 transition-all flex items-center gap-2"
                            >
                              {checkingAnswer ? <><RefreshCw className="w-3 h-3 animate-spin" /> Checking...</> : 'Check Answer'}
                            </button>
                          ) : (
                            <div className="mt-3 p-3 bg-neutral-800 rounded-lg">
                              <p className="text-xs text-accent mb-1">Score: {quizFeedback[quizIndex].score}/10</p>
                              <p className="text-sm text-foreground">{quizFeedback[quizIndex].text}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between mt-6">
                        <button
                          onClick={() => setQuizIndex(i => Math.max(0, i - 1))}
                          disabled={quizIndex === 0}
                          className="px-4 py-2 text-sm text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                          ← Previous
                        </button>
                        {quizIndex < quizQuestions.length - 1 ? (
                          <button
                            onClick={() => setQuizIndex(i => i + 1)}
                            className="px-4 py-2 bg-accent text-background rounded-lg text-sm font-medium flex items-center gap-1"
                          >
                            Next <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setQuizDone(true)}
                            className="px-4 py-2 bg-success bg-opacity-20 text-success border border-success rounded-lg text-sm font-medium"
                          >
                            Finish Quiz
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Score Card */}
              {quizDone && (
                <div className="text-center py-4">
                  <div className="text-6xl mb-4">{getQuizScore() >= 40 ? '🎉' : getQuizScore() >= 25 ? '📚' : '💪'}</div>
                  <p className="text-3xl font-bold text-accent mb-2">{getQuizScore()}/50</p>
                  <p className="text-muted mb-6">
                    {getQuizScore() >= 40 ? 'Excellent! You have mastered this pattern.' :
                     getQuizScore() >= 25 ? 'Good understanding. Review weak areas.' :
                     'Keep practicing. Review the pattern fundamentals.'}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => startQuiz(quizPattern)}
                      className="px-4 py-2 bg-accent bg-opacity-20 text-accent border border-accent rounded-lg text-sm"
                    >
                      Retake Quiz
                    </button>
                    <button
                      onClick={() => setQuizOpen(false)}
                      className="px-4 py-2 bg-neutral-800 text-foreground rounded-lg text-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint Panel (Feature 5) — slide in from right */}
      <AnimatePresence>
        {hintPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHintPanel(null)}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-96 bg-card border-l border-neutral-700 z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-lg text-foreground">{hintPanel.patternName}</h3>
                  <button onClick={() => setHintPanel(null)} className="text-muted hover:text-foreground"><X className="w-5 h-5" /></button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-neutral-800 rounded-lg p-1">
                  {(['explain', 'hint', 'approach'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => {
                        const pattern = PATTERNS.find(p => p.id === hintPanel.patternId);
                        if (pattern) openHintPanel(pattern, tab);
                      }}
                      className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                        hintPanel.tab === tab
                          ? 'bg-accent text-background'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      {tab === 'explain' ? 'Explain Simply' : tab === 'hint' ? 'Give Hint' : 'Full Approach'}
                    </button>
                  ))}
                </div>

                {hintPanel.loading ? (
                  <div className="flex items-center gap-2 text-muted py-8">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Claude is thinking...</span>
                  </div>
                ) : hintPanel.error ? (
                  <div>
                    <p className="text-secondary text-sm mb-3">{hintPanel.error}</p>
                    <button
                      onClick={() => {
                        const pattern = PATTERNS.find(p => p.id === hintPanel.patternId);
                        if (pattern) openHintPanel(pattern, hintPanel.tab);
                      }}
                      className="text-accent text-sm hover:underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="prose prose-invert text-sm">
                      <pre className="text-foreground whitespace-pre-wrap font-sans leading-relaxed">{hintPanel.content}</pre>
                    </div>

                    {hintPanel.tab === 'hint' && hintPanel.hintLevel < 2 && (
                      <button
                        onClick={loadNextHint}
                        className="mt-4 flex items-center gap-2 text-sm text-accent hover:underline"
                      >
                        <ChevronRight className="w-4 h-4" />
                        Hint {hintPanel.hintLevel + 2} (more specific)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
