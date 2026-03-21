'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { PageContainer, GlassCard } from '@/components/ui/components';

/* ─── Types ─────────────────────────────────────────────────────────── */
interface CodeBlock {
  label: string;
  lang: string;
  code: string;
}
interface CheatRow {
  pattern: string;
  when: string;
  timeComplexity: string;
  spaceComplexity: string;
  keyInsight: string;
  code?: CodeBlock;
}
interface Section {
  id: string;
  title: string;
  emoji: string;
  rows: CheatRow[];
}

/* ─── DSA CHEATSHEET ─────────────────────────────────────────────────── */
const DSA_SECTIONS: Section[] = [
  {
    id: 'arrays-strings',
    title: 'Arrays & Strings',
    emoji: '📋',
    rows: [
      {
        pattern: 'Two Pointers',
        when: 'Sorted array, pair/triplet sum, palindrome check, container problems',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        keyInsight: 'Move left/right pointers inward based on comparison. Avoid nested loops.',
        code: {
          label: 'Two Sum (sorted)',
          lang: 'python',
          code: `def two_sum_sorted(nums, target):
    l, r = 0, len(nums) - 1
    while l < r:
        s = nums[l] + nums[r]
        if s == target: return [l, r]
        elif s < target: l += 1
        else: r -= 1
    return []`,
        },
      },
      {
        pattern: 'Sliding Window',
        when: 'Subarray/substring of length k or with constraint (max sum, longest without repeat)',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(k)',
        keyInsight: 'Expand right pointer; shrink left when constraint violated. Each element enters/exits once.',
        code: {
          label: 'Longest substring without repeating chars',
          lang: 'python',
          code: `def length_of_longest_substring(s):
    seen = {}
    l = res = 0
    for r, ch in enumerate(s):
        if ch in seen and seen[ch] >= l:
            l = seen[ch] + 1
        seen[ch] = r
        res = max(res, r - l + 1)
    return res`,
        },
      },
      {
        pattern: 'Prefix Sum',
        when: 'Range sum queries, subarray sum equals k, 2D matrix queries',
        timeComplexity: 'O(n) build, O(1) query',
        spaceComplexity: 'O(n)',
        keyInsight: 'prefix[i] = sum of nums[0..i-1]. Range sum [l,r] = prefix[r+1] - prefix[l].',
        code: {
          label: 'Subarray sum equals K',
          lang: 'python',
          code: `def subarray_sum(nums, k):
    count = 0
    prefix_sum = 0
    seen = {0: 1}  # prefix_sum -> count
    for n in nums:
        prefix_sum += n
        count += seen.get(prefix_sum - k, 0)
        seen[prefix_sum] = seen.get(prefix_sum, 0) + 1
    return count`,
        },
      },
      {
        pattern: 'Monotonic Stack',
        when: 'Next greater/smaller element, histogram area, temperature problems',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        keyInsight: 'Stack holds indices of elements waiting for their "answer." Pop when current beats top.',
        code: {
          label: 'Next greater element',
          lang: 'python',
          code: `def next_greater(nums):
    res = [-1] * len(nums)
    stack = []  # stores indices
    for i, n in enumerate(nums):
        while stack and nums[stack[-1]] < n:
            res[stack.pop()] = n
        stack.append(i)
    return res`,
        },
      },
    ],
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    emoji: '🔍',
    rows: [
      {
        pattern: 'Classic Binary Search',
        when: 'Sorted array, find target index',
        timeComplexity: 'O(log n)',
        spaceComplexity: 'O(1)',
        keyInsight: 'Converge mid towards target. Use while lo <= hi; move lo = mid+1 or hi = mid-1.',
        code: {
          label: 'Template',
          lang: 'python',
          code: `def binary_search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2  # avoid overflow
        if nums[mid] == target: return mid
        elif nums[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return -1`,
        },
      },
      {
        pattern: 'Binary Search on Answer',
        when: 'Minimize/maximize a value satisfying condition (k workers, ship packages)',
        timeComplexity: 'O(n log(max-min))',
        spaceComplexity: 'O(1)',
        keyInsight: 'Ask "is X feasible?" If monotone, binary search on X directly.',
        code: {
          label: 'Min days to make m bouquets',
          lang: 'python',
          code: `def min_days(bloom_day, m, k):
    def feasible(day):
        bouquets = flowers = 0
        for b in bloom_day:
            flowers = flowers + 1 if b <= day else 0
            if flowers == k:
                bouquets += 1
                flowers = 0
        return bouquets >= m

    lo, hi = min(bloom_day), max(bloom_day)
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid): hi = mid
        else: lo = mid + 1
    return lo`,
        },
      },
    ],
  },
  {
    id: 'trees-graphs',
    title: 'Trees & Graphs',
    emoji: '🌲',
    rows: [
      {
        pattern: 'BFS (Level-order)',
        when: 'Shortest path in unweighted graph, level-by-level traversal, word ladder',
        timeComplexity: 'O(V + E)',
        spaceComplexity: 'O(V)',
        keyInsight: 'Use deque. Process all nodes at current depth before going deeper.',
        code: {
          label: 'BFS shortest path',
          lang: 'python',
          code: `from collections import deque

def bfs(graph, start, end):
    queue = deque([(start, [start])])
    visited = {start}
    while queue:
        node, path = queue.popleft()
        if node == end: return path
        for nei in graph[node]:
            if nei not in visited:
                visited.add(nei)
                queue.append((nei, path + [nei]))
    return []`,
        },
      },
      {
        pattern: 'DFS (Recursive/Iterative)',
        when: 'Path existence, connected components, cycle detection, backtracking',
        timeComplexity: 'O(V + E)',
        spaceComplexity: 'O(V) stack',
        keyInsight: 'Mark visited BEFORE enqueueing to avoid reprocessing. Pre-order vs post-order matters.',
        code: {
          label: 'DFS iterative',
          lang: 'python',
          code: `def dfs(graph, start):
    visited = set()
    stack = [start]
    result = []
    while stack:
        node = stack.pop()
        if node in visited: continue
        visited.add(node)
        result.append(node)
        for nei in graph[node]:
            if nei not in visited:
                stack.append(nei)
    return result`,
        },
      },
      {
        pattern: "Dijkstra's",
        when: 'Shortest path in weighted graph (non-negative weights)',
        timeComplexity: 'O((V + E) log V)',
        spaceComplexity: 'O(V)',
        keyInsight: 'Min-heap on (distance, node). Relax edges when popped. Skip if already settled.',
        code: {
          label: "Dijkstra's template",
          lang: 'python',
          code: `import heapq

def dijkstra(graph, src):
    dist = {node: float('inf') for node in graph}
    dist[src] = 0
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]: continue
        for v, w in graph[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(heap, (dist[v], v))
    return dist`,
        },
      },
      {
        pattern: 'Union-Find (DSU)',
        when: 'Connected components, cycle detection, Kruskal MST',
        timeComplexity: 'O(α(n)) ≈ O(1)',
        spaceComplexity: 'O(n)',
        keyInsight: 'Path compression + union by rank makes nearly O(1) per op. α is inverse Ackermann.',
        code: {
          label: 'DSU template',
          lang: 'python',
          code: `class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]

    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py: return False  # already connected
        if self.rank[px] < self.rank[py]: px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]: self.rank[px] += 1
        return True`,
        },
      },
    ],
  },
  {
    id: 'dp',
    title: 'Dynamic Programming',
    emoji: '🧮',
    rows: [
      {
        pattern: '1D DP (Bottom-up)',
        when: 'Fibonacci, climbing stairs, house robber, coin change',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1) optimized',
        keyInsight: 'Define dp[i] = optimal answer for subproblem i. Build forward from base cases.',
        code: {
          label: 'Coin change (min coins)',
          lang: 'python',
          code: `def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for a in range(1, amount + 1):
        for c in coins:
            if a - c >= 0:
                dp[a] = min(dp[a], 1 + dp[a - c])
    return dp[amount] if dp[amount] != float('inf') else -1`,
        },
      },
      {
        pattern: '2D DP',
        when: 'Longest common subsequence, edit distance, grid path, 0/1 knapsack',
        timeComplexity: 'O(m × n)',
        spaceComplexity: 'O(m × n) → O(n) with rolling',
        keyInsight: 'dp[i][j] depends on dp[i-1][...] or dp[...][j-1]. Can often reduce to 1 row.',
        code: {
          label: 'Longest Common Subsequence',
          lang: 'python',
          code: `def lcs(text1, text2):
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i-1] == text2[j-1]:
                dp[i][j] = 1 + dp[i-1][j-1]
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]`,
        },
      },
      {
        pattern: 'Interval DP',
        when: 'Burst balloons, matrix chain multiplication, palindrome partition',
        timeComplexity: 'O(n³)',
        spaceComplexity: 'O(n²)',
        keyInsight: 'Iterate over interval length. For each [i,j], try all split points k.',
        code: {
          label: 'Burst balloons',
          lang: 'python',
          code: `def maxCoins(nums):
    nums = [1] + nums + [1]
    n = len(nums)
    dp = [[0] * n for _ in range(n)]
    for length in range(2, n):
        for l in range(0, n - length):
            r = l + length
            for k in range(l + 1, r):
                dp[l][r] = max(dp[l][r],
                    nums[l] * nums[k] * nums[r] + dp[l][k] + dp[k][r])
    return dp[0][n-1]`,
        },
      },
    ],
  },
  {
    id: 'heaps-sorting',
    title: 'Heaps & Sorting',
    emoji: '📊',
    rows: [
      {
        pattern: 'Min/Max Heap (Top K)',
        when: 'K closest points, K largest elements, merge K sorted lists',
        timeComplexity: 'O(n log k)',
        spaceComplexity: 'O(k)',
        keyInsight: 'Min-heap of size k for top-k largest. Push all, pop when size > k.',
        code: {
          label: 'K largest elements',
          lang: 'python',
          code: `import heapq

def k_largest(nums, k):
    # min-heap of size k — top is smallest of the k largest
    heap = []
    for n in nums:
        heapq.heappush(heap, n)
        if len(heap) > k:
            heapq.heappop(heap)
    return sorted(heap, reverse=True)`,
        },
      },
      {
        pattern: 'Two Heaps (Median)',
        when: 'Sliding window median, find median from data stream',
        timeComplexity: 'O(log n) per insert',
        spaceComplexity: 'O(n)',
        keyInsight: 'Max-heap (lower half) + min-heap (upper half). Balance so sizes differ by at most 1.',
        code: {
          label: 'Median finder',
          lang: 'python',
          code: `import heapq

class MedianFinder:
    def __init__(self):
        self.lo = []   # max-heap (negate values)
        self.hi = []   # min-heap

    def addNum(self, num):
        heapq.heappush(self.lo, -num)
        heapq.heappush(self.hi, -heapq.heappop(self.lo))
        if len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def findMedian(self):
        if len(self.lo) > len(self.hi):
            return -self.lo[0]
        return (-self.lo[0] + self.hi[0]) / 2`,
        },
      },
    ],
  },
];

/* ─── BIG O REFERENCE ────────────────────────────────────────────────── */
const BIG_O_TABLE = [
  { name: 'Hash Map get/set', time: 'O(1)', space: 'O(n)', notes: 'Amortized; worst case O(n) with collisions' },
  { name: 'Binary Search', time: 'O(log n)', space: 'O(1)', notes: 'Sorted array only' },
  { name: 'Sorting (comparison)', time: 'O(n log n)', space: 'O(log n)', notes: 'Timsort in Python; O(n) for nearly sorted' },
  { name: 'Heap insert/pop', time: 'O(log n)', space: 'O(n)', notes: 'Build heap from array = O(n) (heapify)' },
  { name: 'DFS / BFS', time: 'O(V + E)', space: 'O(V)', notes: 'V = vertices, E = edges' },
  { name: 'Quicksort (avg)', time: 'O(n log n)', space: 'O(log n)', notes: 'Worst O(n²) with bad pivot; use random pivot' },
  { name: 'Dynamic Programming (1D)', time: 'O(n)', space: 'O(n)→O(1)', notes: 'Space often reducible to rolling variables' },
  { name: 'Backtracking', time: 'O(k^n)', space: 'O(n)', notes: 'k = branching factor; pruning drastically reduces real calls' },
  { name: 'Trie insert/search', time: 'O(m)', space: 'O(m·n)', notes: 'm = word length; n = number of words' },
  { name: 'Union-Find find/union', time: 'O(α(n)) ≈ O(1)', space: 'O(n)', notes: 'With path compression + union by rank' },
];

/* ─── SYSTEM DESIGN CHEATSHEET ───────────────────────────────────────── */
const SD_SECTIONS = [
  {
    id: 'component-selection',
    title: 'Component Selection Guide',
    emoji: '🏗️',
    rows: [
      {
        need: 'Cache',
        choose: 'Redis (Cluster mode)',
        when: 'Sub-ms read latency, TTL-based eviction, distributed session, rate limiting, leaderboard (sorted sets)',
        avoid: 'Sole source of truth — always a cache aside from a DB; data loss on restart without persistence',
      },
      {
        need: 'Message Queue',
        choose: 'Kafka / SQS / RabbitMQ',
        when: 'Decouple services, async work, fan-out, event log. Kafka = durable replay. SQS = simple, serverless. RabbitMQ = routing/priority',
        avoid: 'Real-time sub-10ms (use WebSockets). Synchronous request-response (use REST/gRPC)',
      },
      {
        need: 'Search',
        choose: 'Elasticsearch / OpenSearch',
        when: 'Full-text search, fuzzy match, faceted filtering, log analytics. Index by relevance score',
        avoid: 'Primary DB — always replicate from Postgres/MySQL. Heavy writes; ES is read-optimized',
      },
      {
        need: 'CDN',
        choose: 'CloudFront / Cloudflare',
        when: 'Static assets, images, geographically distributed users, DDoS mitigation, edge caching of API responses',
        avoid: 'Personalized dynamic data per-user. Real-time updates that must bypass cache',
      },
      {
        need: 'SQL DB',
        choose: 'PostgreSQL / MySQL / Aurora',
        when: 'ACID required, complex joins, relational data, transactional correctness (payments, inventory, orders)',
        avoid: 'Massive write amplification at web scale without sharding strategy. Unstructured / schema-less data',
      },
      {
        need: 'NoSQL DB',
        choose: 'DynamoDB / Cassandra / MongoDB',
        when: 'Massive scale, known access patterns, simple get/put by key, time-series, high write throughput',
        avoid: 'Complex multi-table joins. Frequently changing query patterns. Strong consistency across partitions',
      },
      {
        need: 'Object Storage',
        choose: 'S3 / GCS',
        when: 'Blobs, images, videos, backups, data lake, audit logs. Unlimited scale, 11-nines durability',
        avoid: 'Low latency lookups (<10ms). Random-read workloads. Small frequent updates (use block storage)',
      },
      {
        need: 'Real-time Communication',
        choose: 'WebSockets / SSE / Long Polling',
        when: 'WebSockets: bidirectional (chat, gaming). SSE: server→client (notifications, live feeds). Long poll: fallback',
        avoid: 'HTTP REST for persistent connections — stateless model wastes connections',
      },
    ],
  },
  {
    id: 'cap-theorem',
    title: 'CAP Theorem',
    emoji: '⚖️',
    rows: [
      { need: 'CP (Consistency + Partition tolerance)', choose: 'HBase, Zookeeper, ETCD', when: 'Financial ledgers, inventory counts — wrong answer is worse than no answer', avoid: 'High-availability use cases; system pauses during partition' },
      { need: 'AP (Availability + Partition tolerance)', choose: 'Cassandra, DynamoDB, CouchDB', when: 'Shopping carts, user profiles, DNS — old answer is OK; update eventually', avoid: 'Where stale reads cause business/legal risk' },
      { need: 'CA (Consistency + Availability)', choose: 'Traditional RDBMS (single node)', when: 'Dev/test, small scale — no network partition assumed', avoid: 'Any distributed system; network partitions always happen eventually' },
    ],
  },
  {
    id: 'numbers',
    title: 'Latency Numbers (2024)',
    emoji: '⏱️',
    rows: [
      { need: 'L1 cache read', choose: '1 ns', when: 'CPU register → L1: ~1 ns', avoid: '' },
      { need: 'L2 cache read', choose: '4 ns', when: 'L1 miss → L2: ~4 ns', avoid: '' },
      { need: 'Main memory (RAM)', choose: '100 ns', when: 'DRAM access; 100× slower than L1', avoid: '' },
      { need: 'SSD read', choose: '100 µs', when: 'NVMe SSD; 1000× slower than RAM', avoid: '' },
      { need: 'Disk seek (HDD)', choose: '10 ms', when: 'Spinning disk seek; avoid for latency-sensitive ops', avoid: '' },
      { need: 'Same-region network', choose: '0.5 ms', when: 'Same AWS region round-trip', avoid: '' },
      { need: 'Cross-region network', choose: '50–200 ms', when: 'e.g., US-East to US-West ≈ 60 ms; US to EU ≈ 150 ms', avoid: '' },
      { need: 'Redis get', choose: '< 1 ms', when: 'Sub-millisecond in-memory key lookup', avoid: '' },
      { need: 'DB query (indexed)', choose: '5–10 ms', when: 'Simple SELECT with index; grows with joins', avoid: '' },
      { need: 'DB query (full scan)', choose: '100s ms – s', when: 'Depends on table size; avoid without index', avoid: '' },
    ],
  },
  {
    id: 'estimation',
    title: 'Back-of-Envelope Numbers',
    emoji: '🧮',
    rows: [
      { need: 'QPS estimation', choose: '= DAU × actions_per_day / 86400', when: '50M DAU, 10 actions = 5B/day ÷ 86400 ≈ 58K QPS', avoid: '' },
      { need: 'Storage (characters)', choose: '1 char = 1 byte (ASCII)', when: '1M tweets × 140 chars = 140 MB/day', avoid: '' },
      { need: 'Storage (images)', choose: '1 image ≈ 300 KB thumbnail, 2 MB original', when: '1M uploads/day = 2 TB/day raw', avoid: '' },
      { need: 'Storage (video)', choose: '1 min 1080p ≈ 100 MB (raw), 10 MB (H.264)', when: '100K uploads/day × 10 MB = 1 TB/day', avoid: '' },
      { need: 'Bandwidth', choose: '= throughput × avg_object_size', when: '100K QPS × 1 KB = 100 MB/s out', avoid: '' },
      { need: 'Cache memory', choose: '80/20 rule — 20% hot data needed', when: '1B objects × 1 KB × 20% = 200 GB cache', avoid: '' },
    ],
  },
];

/* ─── DE CHEATSHEET ──────────────────────────────────────────────────── */
const DE_CHEAT = {
  sql: [
    {
      category: 'Window Functions',
      entries: [
        { func: 'ROW_NUMBER()', use: 'Unique sequential ID per row within partition. No ties.' },
        { func: 'RANK()', use: 'Same rank for ties; next rank skips (1,1,3,4).' },
        { func: 'DENSE_RANK()', use: 'Same rank for ties; next rank does NOT skip (1,1,2,3).' },
        { func: 'LAG(col, n)', use: 'Value of col n rows before current row. NULL for first n rows.' },
        { func: 'LEAD(col, n)', use: 'Value of col n rows after current row. NULL for last n rows.' },
        { func: 'SUM() OVER (...)', use: 'Running total / partition total. Add ORDER BY for running sum.' },
        { func: 'NTILE(n)', use: 'Divide rows into n equal buckets. Returns bucket number 1..n.' },
        { func: 'PERCENT_RANK()', use: 'Relative rank: (rank - 1) / (total_rows - 1). Range [0, 1].' },
      ],
    },
    {
      category: 'Frame Clauses',
      entries: [
        { func: 'ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW', use: 'Running sum from start to current row.' },
        { func: 'ROWS BETWEEN 6 PRECEDING AND CURRENT ROW', use: '7-day rolling sum (current + 6 prior).' },
        { func: 'ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING', use: 'Suffix sum from current row to end.' },
        { func: 'RANGE vs ROWS', use: 'RANGE works with logical values (duplicates treated as window). ROWS is physical row count.' },
      ],
    },
    {
      category: 'Common Patterns',
      entries: [
        { func: 'Retention (Day 1)', use: 'JOIN users.first_day = events.day - 1 on user_id. Count distinct retained.' },
        { func: 'Cohort Analysis', use: 'GROUP BY DATE_TRUNC month of first_purchase; compute revenue per cohort month.' },
        { func: 'Deduplication', use: 'ROW_NUMBER() OVER (PARTITION BY key ORDER BY updated_at DESC) = 1.' },
        { func: 'Cumulative Distribution', use: 'SUM(revenue) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING).' },
        { func: 'Pivot / CASE', use: "SUM(CASE WHEN channel='organic' THEN revenue END) AS organic_rev." },
        { func: 'Rolling 7-day avg', use: 'AVG(metric) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW).' },
      ],
    },
  ],
  spark: [
    { category: 'Performance Tuning', entries: [
      { func: 'spark.sql.shuffle.partitions', use: 'Default 200. Lower for small data (10-50). Higher for big shuffles. Target 128MB/partition.' },
      { func: 'Broadcast Join', use: 'spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "50m"). Sends small table to all executors — no shuffle.' },
      { func: 'AQE (Adaptive Query Execution)', use: 'spark.sql.adaptive.enabled=true. Auto-coalesces shuffle partitions + switches join strategies at runtime.' },
      { func: 'Partition Pruning', use: 'Always filter on partition column first. df.filter("date=\'2024-01-01\'") reads only that S3 prefix.' },
      { func: 'Cache Hot Data', use: 'df.cache() / df.persist(StorageLevel.MEMORY_AND_DISK). Unpersist when done.' },
      { func: 'Avoid collect()', use: 'Never collect() large DataFrames to driver. Use show(n), take(n), or write to storage.' },
    ]},
    { category: 'PySpark Templates', entries: [
      { func: 'Read Parquet', use: 'spark.read.parquet("s3a://bucket/path/year=2024/")' },
      { func: 'Write Delta', use: 'df.write.format("delta").mode("overwrite").partitionBy("date").save("s3://path/")' },
      { func: 'MERGE (Upsert)', use: 'DeltaTable.forPath(spark, path).alias("t").merge(df.alias("s"), "t.id = s.id").whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()' },
      { func: 'Window function', use: 'Window.partitionBy("user_id").orderBy(F.desc("ts"))' },
      { func: 'Explode array', use: 'df.select(F.explode("items").alias("item"))' },
    ]},
  ],
  fileFormats: [
    { format: 'Parquet', encoding: 'Columnar + dictionary + RLE', compression: 'Snappy (default), ZSTD, GZIP', bestFor: 'Analytical queries — scan only needed columns. 80-95% cost reduction vs CSV on Athena.', avoid: 'Row-by-row inserts, schema unknown at write time' },
    { format: 'ORC', encoding: 'Columnar + predicate pushdown', compression: 'ZLIB (default)', bestFor: 'Hive on-prem, Presto. Better compression than Parquet for string-heavy data.', avoid: 'Multi-engine lakehouse; Parquet has broader support' },
    { format: 'Avro', encoding: 'Row-based + schema in header', compression: 'Snappy, Deflate', bestFor: 'Kafka message schemas, CDC events, Confluent Schema Registry. Good for streaming ingestion.', avoid: 'Analytical queries — no column pruning advantage' },
    { format: 'Delta Lake', encoding: 'Parquet + _delta_log (JSON/checkpoint)', compression: 'Snappy', bestFor: 'ACID upserts, time travel, schema evolution, concurrent writes on S3.', avoid: 'Non-Spark engines without Delta reader lib' },
    { format: 'Apache Iceberg', encoding: 'Parquet/ORC + metadata (manifests)', compression: 'Snappy', bestFor: 'Multi-engine (Spark + Athena + Trino + Flink). Partition evolution without rewrite.', avoid: 'Environments where Glue Catalog not supported' },
    { format: 'JSON / JSONL', encoding: 'Text, self-describing', compression: 'GZIP', bestFor: 'Raw landing zone (Bronze), API payloads, semi-structured schema-on-read exploration.', avoid: 'Production analytics — 10x larger than Parquet, no column pruning' },
    { format: 'CSV', encoding: 'Text, delimited', compression: 'GZIP', bestFor: 'Human-readable exports, legacy systems, small reference data.', avoid: 'Any petabyte-scale analytics — Athena charges per TB scanned; CSV has no compression benefit' },
  ],
  aws: [
    { service: 'S3', tagline: 'Object storage', pricing: '$0.023/GB/mo', tip: 'Always partition: year=/month=/day=. Partition pruning = 90% cost reduction on Athena.' },
    { service: 'Glue', tagline: 'Serverless ETL + Catalog', pricing: '$0.44/DPU-hr', tip: 'Catalog shared across Athena, Redshift Spectrum, EMR. Define schema once.' },
    { service: 'Athena', tagline: 'Serverless SQL on S3', pricing: '$5/TB scanned', tip: 'Parquet + Snappy + partitions → typically < $0.01/query.' },
    { service: 'Redshift', tagline: 'MPP Data Warehouse', pricing: '$1.086/hr (ra3.xlplus)', tip: 'Distribute FACT table by most-joined key. ALL distribution for small DIM tables.' },
    { service: 'Kinesis', tagline: 'Managed streaming', pricing: '$0.015/shard-hr', tip: 'Partition key must be high-cardinality. Bad key → hot shard → throttling.' },
    { service: 'EMR', tagline: 'Managed Spark/Hadoop', pricing: 'EC2 + $0.27/hr', tip: 'Use spot instances (60-90% cheaper) + instance fleets for automatic failover.' },
    { service: 'MWAA', tagline: 'Managed Airflow', pricing: '$0.49/hr (mw1.small)', tip: 'DAG sync delay ~30s from S3. Use Glue/EMR operators for native AWS integrations.' },
    { service: 'Lake Formation', tagline: 'Data governance', pricing: 'Free (underlying costs)', tip: 'Column-level security: non-privileged users see NULL instead of real PII values.' },
    { service: 'DMS', tagline: 'DB replication + CDC', pricing: '$0.107/hr (t3.med)', tip: 'DMS → Kinesis → S3: real-time DB changes in < 10 seconds end-to-end.' },
    { service: 'EventBridge', tagline: 'Serverless event bus', pricing: '$1/1M events', tip: 'S3 → EventBridge → Step Functions → Glue: fully serverless pipeline trigger.' },
  ],
};

/* ─── COPY BUTTON ────────────────────────────────────────────────────── */
function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors px-2 py-1 rounded border border-neutral-700 hover:border-accent"
    >
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

/* ─── EXPANDABLE CODE SNIPPET ────────────────────────────────────────── */
function CodeSnippet({ block }: { block: CodeBlock }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {open ? 'Hide' : 'Show'} code — {block.label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-800 bg-neutral-900">
                <span className="text-xs text-muted font-mono">{block.lang}</span>
                <CopyButton code={block.code} />
              </div>
              <pre className="p-3 text-xs text-green-300 overflow-x-auto font-mono leading-relaxed whitespace-pre">
                {block.code}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── DSA SECTION ────────────────────────────────────────────────────── */
function DSASection({ section }: { section: Section }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl hover:border-accent transition-colors"
      >
        <span className="font-heading font-semibold text-foreground">
          {section.emoji} {section.title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-accent" /> : <ChevronDown className="w-4 h-4 text-muted" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2 border border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-900 border-b border-neutral-700">
                    <th className="text-left px-4 py-2.5 text-xs text-accent font-semibold uppercase tracking-wide w-40">Pattern</th>
                    <th className="text-left px-4 py-2.5 text-xs text-accent font-semibold uppercase tracking-wide">When to Use</th>
                    <th className="text-left px-4 py-2.5 text-xs text-accent font-semibold uppercase tracking-wide w-28">Time</th>
                    <th className="text-left px-4 py-2.5 text-xs text-accent font-semibold uppercase tracking-wide w-24">Space</th>
                    <th className="text-left px-4 py-2.5 text-xs text-accent font-semibold uppercase tracking-wide">Key Insight + Code</th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row, i) => (
                    <tr key={i} className={`border-b border-neutral-800/60 ${i % 2 === 0 ? 'bg-neutral-950/40' : 'bg-neutral-900/20'}`}>
                      <td className="px-4 py-3 font-medium text-foreground text-xs">{row.pattern}</td>
                      <td className="px-4 py-3 text-xs text-muted">{row.when}</td>
                      <td className="px-4 py-3 font-mono text-xs text-yellow-400">{row.timeComplexity}</td>
                      <td className="px-4 py-3 font-mono text-xs text-success">{row.spaceComplexity}</td>
                      <td className="px-4 py-3 text-xs text-muted">
                        <p>{row.keyInsight}</p>
                        {row.code && <CodeSnippet block={row.code} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────── */
const TABS = [
  { id: 'dsa', label: '🧩 DSA & Algorithms' },
  { id: 'system-design', label: '🏗️ System Design' },
  { id: 'de', label: '🗄️ Data Engineering' },
] as const;
type Tab = typeof TABS[number]['id'];

export default function CheatsheetPage() {
  const [tab, setTab] = useState<Tab>('dsa');

  return (
    <PageContainer title="Cheatsheet" description="Quick reference for DSA, System Design, and Data Engineering">
      {/* Tab switcher */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              tab === t.id
                ? 'bg-accent text-[#0a0a0f] border-accent font-bold'
                : 'bg-transparent text-muted border-neutral-700 hover:border-accent hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DSA TAB ── */}
      {tab === 'dsa' && (
        <motion.div key="dsa" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Big-O Table */}
          <GlassCard className="mb-6">
            <h3 className="font-heading font-bold text-foreground mb-4">📊 Big-O Quick Reference</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left pb-2 text-xs text-accent uppercase tracking-wide">Operation</th>
                    <th className="text-left pb-2 text-xs text-accent uppercase tracking-wide">Time</th>
                    <th className="text-left pb-2 text-xs text-accent uppercase tracking-wide">Space</th>
                    <th className="text-left pb-2 text-xs text-accent uppercase tracking-wide">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {BIG_O_TABLE.map((row, i) => (
                    <tr key={i} className={`border-b border-neutral-800/40 ${i % 2 === 0 ? '' : 'bg-neutral-900/20'}`}>
                      <td className="py-2 pr-4 text-xs text-foreground font-medium">{row.name}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-yellow-400">{row.time}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-success">{row.space}</td>
                      <td className="py-2 text-xs text-muted">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Pattern Sections */}
          <h3 className="font-heading font-bold text-foreground mb-3">🔑 Algorithm Patterns</h3>
          {DSA_SECTIONS.map(section => (
            <DSASection key={section.id} section={section} />
          ))}

          {/* Interview tips */}
          <GlassCard className="mt-4">
            <h4 className="font-heading font-semibold text-foreground mb-3">💡 Interview Problem-Solving Framework</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ['1. Clarify', 'Ask constraints: array size? sorted? duplicates? What to return? Edge cases (empty array, single element)?'],
                ['2. Brute Force First', 'State the O(n²) / O(2^n) solution. Then explain why it\'s suboptimal and what you\'ll improve.'],
                ['3. Optimize', 'What repeated work can I eliminate? Can I use a hash map? Is the input sorted (binary search)?'],
                ['4. Code', 'Write clean, readable code. Prefer descriptive variable names over single letters.'],
                ['5. Test', 'Test with: empty input, single element, all same, sorted, reverse sorted, actual example.'],
                ['6. Complexity', 'State time and space complexity with explanation. Offer space tradeoff if time is optimal.'],
              ].map(([title, desc]) => (
                <div key={title} className="p-3 bg-neutral-900 rounded-lg">
                  <p className="text-xs font-bold text-accent mb-1">{title}</p>
                  <p className="text-xs text-muted">{desc}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* ── SYSTEM DESIGN TAB ── */}
      {tab === 'system-design' && (
        <motion.div key="sd" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {SD_SECTIONS.map(section => (
            <div key={section.id} className="mb-6">
              <h3 className="font-heading font-bold text-foreground mb-3">{section.emoji} {section.title}</h3>
              {section.id === 'component-selection' && (
                <div className="overflow-x-auto rounded-xl border border-neutral-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-900 border-b border-neutral-700">
                        <th className="text-left px-4 py-3 text-xs text-accent uppercase tracking-wide w-32">Need</th>
                        <th className="text-left px-4 py-3 text-xs text-accent uppercase tracking-wide w-40">Choose</th>
                        <th className="text-left px-4 py-3 text-xs text-accent uppercase tracking-wide">When</th>
                        <th className="text-left px-4 py-3 text-xs text-accent uppercase tracking-wide">Avoid When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row, i) => (
                        <tr key={i} className={`border-b border-neutral-800/60 ${i % 2 === 0 ? 'bg-neutral-950/40' : 'bg-neutral-900/20'}`}>
                          <td className="px-4 py-3 text-xs font-medium text-foreground">{row.need}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-accent">{row.choose}</td>
                          <td className="px-4 py-3 text-xs text-muted">{row.when}</td>
                          <td className="px-4 py-3 text-xs text-secondary">{row.avoid}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {section.id === 'cap-theorem' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {section.rows.map((row, i) => (
                    <GlassCard key={i}>
                      <p className="font-bold text-accent text-sm mb-2">{row.need}</p>
                      <p className="text-xs text-success font-semibold mb-1">Examples: {row.choose}</p>
                      <p className="text-xs text-muted mb-2">{row.when}</p>
                      {row.avoid && <p className="text-xs text-secondary">⚠️ {row.avoid}</p>}
                    </GlassCard>
                  ))}
                </div>
              )}
              {section.id === 'numbers' && (
                <div className="overflow-x-auto rounded-xl border border-neutral-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-900 border-b border-neutral-700">
                        <th className="text-left px-4 py-3 text-xs text-accent uppercase tracking-wide">Operation</th>
                        <th className="text-left px-4 py-3 text-xs text-accent uppercase tracking-wide w-28">Latency</th>
                        <th className="text-left px-4 py-3 text-xs text-accent uppercase tracking-wide">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row, i) => (
                        <tr key={i} className={`border-b border-neutral-800/60 ${i % 2 === 0 ? 'bg-neutral-950/40' : 'bg-neutral-900/20'}`}>
                          <td className="px-4 py-2.5 text-xs font-medium text-foreground">{row.need}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-yellow-400">{row.choose}</td>
                          <td className="px-4 py-2.5 text-xs text-muted">{row.when}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {section.id === 'estimation' && (
                <div className="overflow-x-auto rounded-xl border border-neutral-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-900 border-b border-neutral-700">
                        <th className="text-left px-4 py-3 text-xs text-accent uppercase tracking-wide">What to Estimate</th>
                        <th className="text-left px-4 py-3 text-xs text-accent uppercase tracking-wide">Formula</th>
                        <th className="text-left px-4 py-3 text-xs text-accent uppercase tracking-wide">Example</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row, i) => (
                        <tr key={i} className={`border-b border-neutral-800/60 ${i % 2 === 0 ? 'bg-neutral-950/40' : 'bg-neutral-900/20'}`}>
                          <td className="px-4 py-2.5 text-xs font-medium text-foreground">{row.need}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-accent">{row.choose}</td>
                          <td className="px-4 py-2.5 text-xs text-muted">{row.when}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {/* SD Interview Framework */}
          <GlassCard className="mt-4">
            <h4 className="font-heading font-semibold text-foreground mb-3">💡 System Design Interview Framework (60 min)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ['0–5 min: Clarify scope', 'Who are the users? Read/write ratio? Scale (DAU, QPS, data size)? Consistency vs availability? Latency SLA?'],
                ['5–15 min: Capacity estimation', 'QPS = DAU × actions / 86400. Storage = QPS × avg_size × time. Bandwidth = QPS × response_size.'],
                ['15–30 min: High-level design', 'Client → LB → API servers → Cache → DB → CDN. Draw the data flow. Don\'t get lost in details yet.'],
                ['30–45 min: Deep dive', 'Pick 1-2 hardest components. DB schema, sharding strategy, caching policy, consistency model.'],
                ['45–55 min: Scale & fault tolerance', 'How do you handle 10× traffic? What fails? Replication, failover, circuit breakers, rate limiting.'],
                ['55–60 min: Trade-offs', 'State what you\'d do differently at different scales. Show you know the trade-offs, not just one answer.'],
              ].map(([title, desc]) => (
                <div key={title} className="p-3 bg-neutral-900 rounded-lg">
                  <p className="text-xs font-bold text-accent mb-1">{title}</p>
                  <p className="text-xs text-muted">{desc}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* ── DATA ENGINEERING TAB ── */}
      {tab === 'de' && (
        <motion.div key="de" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* SQL Window Functions */}
          <h3 className="font-heading font-bold text-foreground mb-3">🪟 SQL Window Functions</h3>
          {DE_CHEAT.sql.map(cat => (
            <div key={cat.category} className="mb-6">
              <h4 className="text-sm font-semibold text-muted mb-2 px-1">{cat.category}</h4>
              <div className="overflow-x-auto rounded-xl border border-neutral-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-900 border-b border-neutral-700">
                      <th className="text-left px-4 py-2.5 text-xs text-accent uppercase tracking-wide w-64">Function / Clause</th>
                      <th className="text-left px-4 py-2.5 text-xs text-accent uppercase tracking-wide">Usage / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.entries.map((e, i) => (
                      <tr key={i} className={`border-b border-neutral-800/60 ${i % 2 === 0 ? 'bg-neutral-950/40' : 'bg-neutral-900/20'}`}>
                        <td className="px-4 py-2.5 font-mono text-xs text-accent">{e.func}</td>
                        <td className="px-4 py-2.5 text-xs text-muted">{e.use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* SQL Templates */}
          <GlassCard className="mb-6">
            <h4 className="font-heading font-semibold text-foreground mb-3">📝 SQL Templates</h4>
            <div className="space-y-3">
              {[
                {
                  label: 'Day-1 Retention',
                  code: `-- Day-1 Retention Rate
SELECT
    DATE(u.created_at)                AS cohort_day,
    COUNT(DISTINCT u.user_id)         AS cohort_size,
    COUNT(DISTINCT e.user_id)         AS retained,
    ROUND(COUNT(DISTINCT e.user_id) * 100.0 
          / COUNT(DISTINCT u.user_id), 2) AS retention_pct
FROM users u
LEFT JOIN events e
    ON  u.user_id = e.user_id
    AND DATE(e.event_at) = DATE(u.created_at) + INTERVAL '1 day'
GROUP BY 1
ORDER BY 1;`,
                },
                {
                  label: 'Deduplication (keep latest)',
                  code: `-- Keep the most recent record per key
WITH ranked AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY user_id
               ORDER BY updated_at DESC
           ) AS rn
    FROM events
)
SELECT * FROM ranked WHERE rn = 1;`,
                },
                {
                  label: '7-day Rolling Average',
                  code: `SELECT
    date,
    metric,
    AVG(metric) OVER (
        ORDER BY date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    )  AS rolling_7d_avg
FROM daily_metrics
ORDER BY date;`,
                },
                {
                  label: 'Funnel Analysis',
                  code: `SELECT
    COUNT(DISTINCT user_id)                                        AS step1_view,
    COUNT(DISTINCT CASE WHEN action='add_cart' THEN user_id END)   AS step2_cart,
    COUNT(DISTINCT CASE WHEN action='checkout' THEN user_id END)   AS step3_checkout,
    COUNT(DISTINCT CASE WHEN action='purchase' THEN user_id END)   AS step4_purchase
FROM events
WHERE DATE(event_at) = CURRENT_DATE - 7;`,
                },
              ].map(({ label, code }) => (
                <div key={label} className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800">
                    <span className="text-xs text-muted font-medium">{label}</span>
                    <CopyButton code={code} />
                  </div>
                  <pre className="p-3 text-xs text-green-300 overflow-x-auto font-mono leading-relaxed whitespace-pre">{code}</pre>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Spark */}
          <h3 className="font-heading font-bold text-foreground mb-3">⚡ PySpark Reference</h3>
          {DE_CHEAT.spark.map(cat => (
            <div key={cat.category} className="mb-4 overflow-x-auto rounded-xl border border-neutral-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-900 border-b border-neutral-700">
                    <th className="text-left px-4 py-2.5 text-xs text-accent uppercase tracking-wide w-64">{cat.category}</th>
                    <th className="text-left px-4 py-2.5 text-xs text-accent uppercase tracking-wide">Detail / Value</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.entries.map((e, i) => (
                    <tr key={i} className={`border-b border-neutral-800/60 ${i % 2 === 0 ? 'bg-neutral-950/40' : 'bg-neutral-900/20'}`}>
                      <td className="px-4 py-2.5 font-mono text-xs text-yellow-400">{e.func}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">{e.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* File Formats */}
          <h3 className="font-heading font-bold text-foreground mb-3 mt-6">📁 File Formats Comparison</h3>
          <div className="overflow-x-auto rounded-xl border border-neutral-800 mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-900 border-b border-neutral-700">
                  <th className="text-left px-4 py-2.5 text-xs text-accent uppercase tracking-wide">Format</th>
                  <th className="text-left px-4 py-2.5 text-xs text-accent uppercase tracking-wide">Encoding</th>
                  <th className="text-left px-4 py-2.5 text-xs text-accent uppercase tracking-wide">Compression</th>
                  <th className="text-left px-4 py-2.5 text-xs text-accent uppercase tracking-wide">Best For</th>
                  <th className="text-left px-4 py-2.5 text-xs text-accent uppercase tracking-wide">Avoid When</th>
                </tr>
              </thead>
              <tbody>
                {DE_CHEAT.fileFormats.map((f, i) => (
                  <tr key={i} className={`border-b border-neutral-800/60 ${i % 2 === 0 ? 'bg-neutral-950/40' : 'bg-neutral-900/20'}`}>
                    <td className="px-4 py-2.5 font-bold text-xs text-accent">{f.format}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{f.encoding}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">{f.compression}</td>
                    <td className="px-4 py-2.5 text-xs text-success">{f.bestFor}</td>
                    <td className="px-4 py-2.5 text-xs text-secondary">{f.avoid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AWS Quick Reference */}
          <h3 className="font-heading font-bold text-foreground mb-3">☁️ AWS Services Quick Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {DE_CHEAT.aws.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-bold text-accent text-sm">{s.service}</span>
                      <span className="text-muted text-xs ml-2">— {s.tagline}</span>
                    </div>
                    <span className="font-mono text-xs text-yellow-400 whitespace-nowrap ml-2">{s.pricing}</span>
                  </div>
                  <p className="text-xs text-success">{s.tip}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </PageContainer>
  );
}
