'use client';

import { useState } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { PageContainer, GlassCard } from '@/components/ui/components';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

interface MapNode {
  id: string;
  label: string;
  sub: string;
  lane: 'dsa' | 'system-design' | 'de' | 'behavioral';
  row: number;
  deps: string[];
}

const NODES: MapNode[] = [
  // DSA lane
  { id: 'dsa-arrays', label: 'Arrays & Hashing', sub: '10 problems', lane: 'dsa', row: 0, deps: [] },
  { id: 'dsa-two-ptr', label: 'Two Pointers', sub: '4 problems', lane: 'dsa', row: 1, deps: ['dsa-arrays'] },
  { id: 'dsa-sliding', label: 'Sliding Window', sub: '4 problems', lane: 'dsa', row: 2, deps: ['dsa-two-ptr'] },
  { id: 'dsa-binary', label: 'Binary Search', sub: '5 problems', lane: 'dsa', row: 3, deps: ['dsa-sliding'] },
  { id: 'dsa-trees', label: 'Trees', sub: '8 problems', lane: 'dsa', row: 4, deps: ['dsa-binary'] },
  { id: 'dsa-graphs', label: 'Graphs', sub: '8 problems', lane: 'dsa', row: 5, deps: ['dsa-trees'] },
  { id: 'dsa-dp', label: 'Dynamic Prog.', sub: '10 problems', lane: 'dsa', row: 6, deps: ['dsa-graphs'] },

  // System Design lane
  { id: 'sd-url', label: 'URL Shortener', sub: 'Beginner', lane: 'system-design', row: 0, deps: [] },
  { id: 'sd-cache', label: 'Cache System', sub: 'Beginner', lane: 'system-design', row: 1, deps: ['sd-url'] },
  { id: 'sd-feed', label: 'News Feed', sub: 'Intermediate', lane: 'system-design', row: 2, deps: ['sd-cache'] },
  { id: 'sd-chat', label: 'Chat System', sub: 'Intermediate', lane: 'system-design', row: 3, deps: ['sd-feed'] },
  { id: 'sd-search', label: 'Search Engine', sub: 'Advanced', lane: 'system-design', row: 4, deps: ['sd-chat'] },
  { id: 'sd-video', label: 'Video Platform', sub: 'Advanced', lane: 'system-design', row: 5, deps: ['sd-search'] },

  // DE lane
  { id: 'de-sql', label: 'SQL & Data Modeling', sub: 'Foundation', lane: 'de', row: 0, deps: [] },
  { id: 'de-spark', label: 'Spark Internals', sub: 'Foundation', lane: 'de', row: 1, deps: ['de-sql'] },
  { id: 'de-kafka', label: 'Kafka & Streaming', sub: 'Intermediate', lane: 'de', row: 2, deps: ['de-spark'] },
  { id: 'de-formats', label: 'File Formats', sub: 'Intermediate', lane: 'de', row: 3, deps: ['de-kafka'] },
  { id: 'de-aws', label: 'AWS Pipeline', sub: 'Advanced', lane: 'de', row: 4, deps: ['de-formats'] },
  { id: 'de-orchestr', label: 'Orchestration', sub: 'Advanced', lane: 'de', row: 5, deps: ['de-aws'] },

  // Behavioral lane
  { id: 'beh-star', label: 'STAR Framework', sub: 'Core', lane: 'behavioral', row: 0, deps: [] },
  { id: 'beh-lead', label: 'Leadership Stories', sub: 'Core', lane: 'behavioral', row: 1, deps: ['beh-star'] },
  { id: 'beh-conflict', label: 'Conflict Stories', sub: 'Core', lane: 'behavioral', row: 2, deps: ['beh-lead'] },
  { id: 'beh-impact', label: 'Impact/Delivery', sub: 'Advanced', lane: 'behavioral', row: 3, deps: ['beh-conflict'] },
];

const LANES: { id: MapNode['lane']; label: string; color: string; bg: string }[] = [
  { id: 'dsa', label: 'DSA', color: '#00d4ff', bg: 'rgba(0,212,255,0.06)' },
  { id: 'system-design', label: 'System Design', color: '#ff6b6b', bg: 'rgba(255,107,107,0.06)' },
  { id: 'de', label: 'Data Engineering', color: '#a855f7', bg: 'rgba(168,85,247,0.06)' },
  { id: 'behavioral', label: 'Behavioral', color: '#00ff88', bg: 'rgba(0,255,136,0.06)' },
];

// Horizontal layout constants
const LABEL_W = 140;
const COL_W = 155;
const NODE_W = 125;
const NODE_H = 58;
const LANE_H = 108;

const NODE_INFO: Record<string, { description: string; link: string; tips: string[] }> = {
  'dsa-arrays':   { description: 'Bedrock of DSA — hashing, prefix sums, frequency maps.', link: '/dsa', tips: ['HashMap: O(1) lookup', 'Prefix sum for range queries', 'Sort when order matters'] },
  'dsa-two-ptr':  { description: 'Eliminate O(n²) brute force with two moving indices on sorted/symmetric data.', link: '/dsa', tips: ['Works on sorted or symmetric input', 'One each end → converge inward', 'Fast/Slow variant for cycle detection'] },
  'dsa-sliding':  { description: 'Dynamic window over contiguous elements — track min/max/count.', link: '/dsa', tips: ['Expand right, shrink left on violation', 'HashMap tracks window state', 'Fixed vs variable window'] },
  'dsa-binary':   { description: 'Eliminate half the search space each step — O(log n).', link: '/dsa', tips: ['Requires sorted input', '"Minimise the maximum" → binary on answer', 'lo/hi template: while lo < hi'] },
  'dsa-trees':    { description: 'Traversals, BST properties, recursion patterns.', link: '/dsa', tips: ['Recursive DFS for most tree problems', 'BFS = level-order via queue', 'BST inorder → sorted array'] },
  'dsa-graphs':   { description: 'BFS for shortest path, DFS for connectivity, Union-Find for components.', link: '/dsa', tips: ['BFS: unweighted shortest path', 'Topo sort: DAG ordering', 'Union-Find: O(α) component merge'] },
  'dsa-dp':       { description: 'Memoize overlapping subproblems. Ask: what choice do I make at each state?', link: '/dsa', tips: ['Define state first', 'Top-down: recursion + memo', 'Bottom-up: fill table by dependency'] },
  'sd-url':       { description: 'Classic system design — hashing, storage, redirects, rate limiting.', link: '/system-design', tips: ['Base62 encode 6-char short ID', 'Redis for hot URL caching', 'Rate-limit by IP'] },
  'sd-cache':     { description: 'LRU/LFU, eviction policies, invalidation strategies.', link: '/system-design', tips: ['LRU = HashMap + DoublyLinkedList', 'Write-through vs write-back', 'Target >95% cache hit ratio'] },
  'sd-feed':      { description: 'Fan-out on write vs read, pagination, ranking algorithms.', link: '/system-design', tips: ['Fan-out write: push to followers', 'Fan-out read for celebrities', 'Redis sorted set for timeline'] },
  'sd-chat':      { description: 'WebSockets, message queues, delivery guarantees.', link: '/system-design', tips: ['WebSocket for real-time bidirectional', 'Kafka for message durability', 'Ack + retry for exactly-once delivery'] },
  'sd-search':    { description: 'Inverted index, ranking, distributed shards.', link: '/system-design', tips: ['Inverted index: term → doc list', 'TF-IDF for relevance scoring', 'Shard by document hash'] },
  'sd-video':     { description: 'CDN, chunked uploads, transcoding pipeline.', link: '/system-design', tips: ['S3 multipart for chunked upload', 'Transcode to multiple resolutions', 'CDN edge nodes for serving'] },
  'de-sql':       { description: 'Window functions, CTEs, query optimization techniques.', link: '/de-roadmap', tips: ['OVER(PARTITION BY) for window fns', 'CTE for readability & reuse', 'EXPLAIN before optimizing'] },
  'de-spark':     { description: 'RDDs, DataFrames, lazy evaluation, shuffle costs.', link: '/de-roadmap', tips: ['Narrow vs wide transformations', 'Avoid shuffles — use reduceByKey', 'Partition count = 2-3× cores'] },
  'de-kafka':     { description: 'Producers, topics, partitions, consumer groups, offsets.', link: '/de-roadmap', tips: ['Partition = unit of parallelism', 'Consumer group = parallel readers', 'Offset commit = delivery guarantee'] },
  'de-formats':   { description: 'Parquet, Avro, Delta Lake, Iceberg — know the trade-offs.', link: '/de-roadmap', tips: ['Parquet: columnar analytics', 'Avro: schema evolution + Kafka', 'Delta / Iceberg: ACID + time travel'] },
  'de-aws':       { description: 'S3 → Glue → Athena / Redshift — standard data lake pattern.', link: '/de-roadmap', tips: ['S3 = source of truth', 'Glue ETL + Data Catalog', 'Athena: serverless SQL on S3'] },
  'de-orchestr':  { description: 'Airflow DAGs, task dependencies, scheduling, retries.', link: '/de-roadmap', tips: ['DAG = directed acyclic graph', 'XCom for task-to-task data', 'Sensor operators for external waits'] },
  'beh-star':     { description: 'Situation → Task → Action → Result storytelling framework.', link: '/behavioral', tips: ['2 min max per story', 'Result must be quantified', 'Practice speaking, not reading'] },
  'beh-lead':     { description: 'Influence without authority — rallying teams, driving direction.', link: '/behavioral', tips: ['Show you drove direction, not just followed', 'LP: Earn Trust + Have Backbone', 'Conflict + resolution = strong leadership'] },
  'beh-conflict': { description: 'Disagree and commit — healthy debate, data-driven decisions.', link: '/behavioral', tips: ['Data-backed disagreement', 'Show you still executed after deciding', 'Mention what you learned'] },
  'beh-impact':   { description: 'Ownership, bias for action, high-bar delivery stories.', link: '/behavioral', tips: ['Metric: X% improvement / $Y saved', 'Show scope: cross-team impact', 'LP: Ownership + Bias for Action'] },
};

export default function ProgressMap() {
  const { data, isLoaded } = useProgress();
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const router = useRouter();

  if (!isLoaded) return null;

  // Determine node status based on progress data
  const getNodeStatus = (node: MapNode): 'done' | 'active' | 'locked' => {
    // Check if deps are done
    const depsOk = node.deps.every(dep => getNodeStatus(NODES.find(n => n.id === dep)!) === 'done');

    // Map nodes to actual progress
    let completed = false;
    if (node.lane === 'dsa') {
      // Check if enough problems solved overall (rough heuristic by position)
      const threshold = (node.row + 1) * 5;
      completed = data.dsa.solvedProblems.length >= threshold;
    } else if (node.lane === 'system-design') {
      const sysmMap: Record<string, string> = {
        'sd-url': 'url-shortener',
        'sd-cache': 'cache',
        'sd-feed': 'news-feed',
        'sd-chat': 'chat',
        'sd-search': 'search-engine',
        'sd-video': 'video-streaming',
      };
      const key = sysmMap[node.id];
      completed = key ? data.systemDesign.systems[key]?.status === 'Done' : false;
    } else if (node.lane === 'de') {
      const deMap: Record<string, string[]> = {
        'de-sql': ['sql-advanced', 'data-modeling'],
        'de-spark': ['apache-spark'],
        'de-kafka': ['kafka-streaming'],
        'de-formats': ['file-formats'],
        'de-aws': ['aws-services'],
        'de-orchestr': ['airflow-orchestration'],
      };
      const topics = deMap[node.id] || [];
      completed = topics.every(t => data.deRoadmap.completedTopics.includes(t));
    } else if (node.lane === 'behavioral') {
      const behMap: Record<string, string[]> = {
        'beh-star': ['challenge', 'failure'],
        'beh-lead': ['leadership', 'initiative'],
        'beh-conflict': ['conflict', 'disagreement'],
        'beh-impact': ['impact', 'achievement'],
      };
      const keys = behMap[node.id] || [];
      completed = keys.some(k =>
        Object.entries(data.behavioral.stories).some(([id, s]) => id.includes(k) && s.completed)
      );
    }

    if (completed) return 'done';
    if (depsOk) return 'active';
    return 'locked';
  };

  // Horizontal layout helpers
  const laneNodes = (laneId: MapNode['lane']) =>
    NODES.filter(n => n.lane === laneId).sort((a, b) => a.row - b.row);

  const maxCols = Math.max(...LANES.map(l => laneNodes(l.id).length));
  const SVG_W = LABEL_W + maxCols * COL_W + 20;
  const SVG_H = LANES.length * LANE_H + 24;

  const nodeX  = (col: number) => LABEL_W + col * COL_W + (COL_W - NODE_W) / 2;
  const nodeCX = (col: number) => LABEL_W + col * COL_W + COL_W / 2;
  const nodeY  = (li: number)  => li * LANE_H + 12 + (LANE_H - NODE_H) / 2;
  const nodeCY = (li: number)  => li * LANE_H + 12 + LANE_H / 2;

  const statusStyle = (status: 'done' | 'active' | 'locked', color: string) => {
    if (status === 'done')   return { fill: color + '22', stroke: color, textColor: color };
    if (status === 'active') return { fill: 'transparent', stroke: color, textColor: color };
    return { fill: 'transparent', stroke: '#2a2a3a', textColor: '#40405a' };
  };

  const selectedInfo   = selectedNode ? NODE_INFO[selectedNode.id] : null;
  const selectedLane   = selectedNode ? LANES.find(l => l.id === selectedNode.lane)! : null;
  const selectedStatus = selectedNode ? getNodeStatus(selectedNode) : null;

  const getLaneStats = (laneId: MapNode['lane']) => {
    const nodes = laneNodes(laneId);
    const done = nodes.filter(n => getNodeStatus(n) === 'done').length;
    return { done, total: nodes.length, pct: Math.round((done / nodes.length) * 100) };
  };

  const totalDone = NODES.filter(n => getNodeStatus(n) === 'done').length;
  const overallPct = Math.round((totalDone / NODES.length) * 100);

  return (
    <PageContainer title="Progress Map" description="Your FAANG prep journey — click any node to explore">
      {/* Completion overview */}
      <div className="mb-6 space-y-2.5 rounded-xl border border-neutral-800 bg-neutral-900/40 px-5 py-4">
        {/* Overall */}
        <div className="flex items-center gap-3 pb-2.5 border-b border-neutral-800">
          <span className="text-xs font-semibold text-muted w-32 flex-shrink-0">Overall</span>
          <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88]"
            />
          </div>
          <span className="text-xs font-bold text-foreground w-12 text-right">{totalDone}/{NODES.length}</span>
          <span className="text-sm font-bold text-[#00d4ff] w-10 text-right">{overallPct}%</span>
        </div>
        {/* Per-lane */}
        {LANES.map(lane => {
          const { done, total, pct } = getLaneStats(lane.id);
          return (
            <div key={lane.id} className="flex items-center gap-3">
              <span className="text-xs font-medium w-32 flex-shrink-0" style={{ color: lane.color }}>{lane.label}</span>
              <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: lane.color }}
                />
              </div>
              <span className="text-[11px] text-neutral-500 w-10 text-right">{done}/{total}</span>
              <span className="text-xs font-bold w-10 text-right" style={{ color: lane.color }}>{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        {LANES.map(lane => (
          <div key={lane.id} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lane.color }} />
            <span className="text-sm text-muted">{lane.label}</span>
          </div>
        ))}
        <div className="ml-auto flex gap-4">
          {[
            { label: 'Done',   border: '#00d4ff', fill: '#00d4ff22' },
            { label: 'Active', border: '#00d4ff', fill: 'transparent' },
            { label: 'Locked', border: '#2a2a3a', fill: 'transparent' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded border" style={{ background: s.fill, borderColor: s.border }} />
              <span className="text-xs text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <svg width={SVG_W} height={SVG_H} style={{ display: 'block' }}>
            <defs>
              {LANES.map(lane => (
                <marker key={`arr-${lane.id}`} id={`arrow-${lane.id}`}
                  markerWidth={8} markerHeight={6} refX={7} refY={3} orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill={lane.color} fillOpacity={0.7} />
                </marker>
              ))}
              <marker id="arrow-locked" markerWidth={8} markerHeight={6} refX={7} refY={3} orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#2a2a3a" />
              </marker>
            </defs>

            {/* Lane background stripes */}
            {LANES.map((lane, li) => (
              <rect key={`bg-${lane.id}`}
                x={0} y={li * LANE_H + 6}
                width={SVG_W - 4} height={LANE_H - 12}
                rx={8} fill={lane.bg}
              />
            ))}

            {/* Lane labels on the left */}
            {LANES.map((lane, li) => (
              <g key={`lbl-${lane.id}`}>
                <text x={LABEL_W - 14} y={nodeCY(li) - 4}
                  textAnchor="end" fill={lane.color}
                  fontSize={11} fontWeight={700} letterSpacing={0.8}>
                  {lane.label.toUpperCase()}
                </text>
                <text x={LABEL_W - 14} y={nodeCY(li) + 12}
                  textAnchor="end" fill={lane.color} fontSize={9} fillOpacity={0.45}>
                  {laneNodes(lane.id).length} steps
                </text>
              </g>
            ))}

            {/* Horizontal arrows within each lane */}
            {LANES.map((lane, li) => {
              const nodes = laneNodes(lane.id);
              return nodes.slice(0, -1).map((node, i) => {
                const nextNode = nodes[i + 1];
                const status = getNodeStatus(node);
                const nextStatus = getNodeStatus(nextNode);
                const active = status === 'done' || nextStatus === 'active';
                const x1 = nodeX(node.row) + NODE_W + 2;
                const x2 = nodeX(nextNode.row) - 2;
                const cy = nodeCY(li);
                return (
                  <line key={`arr-${node.id}`}
                    x1={x1} y1={cy} x2={x2} y2={cy}
                    stroke={active ? lane.color : '#2a2a3a'}
                    strokeOpacity={active ? 0.55 : 0.25}
                    strokeWidth={1.5}
                    markerEnd={active ? `url(#arrow-${lane.id})` : 'url(#arrow-locked)'}
                  />
                );
              });
            })}

            {/* Nodes */}
            {LANES.map((lane, li) =>
              laneNodes(lane.id).map(node => {
                const status = getNodeStatus(node);
                const style = statusStyle(status, lane.color);
                const x = nodeX(node.row);
                const y = nodeY(li);
                const isHov = hoveredNode === node.id;
                const isSel = selectedNode?.id === node.id;

                return (
                  <g key={node.id}
                    onClick={() => setSelectedNode(isSel ? null : node)}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ cursor: status === 'locked' ? 'not-allowed' : 'pointer' }}
                  >
                    {/* Selected glow */}
                    {isSel && (
                      <rect x={x - 3} y={y - 3} width={NODE_W + 6} height={NODE_H + 6}
                        rx={9} fill={lane.color} fillOpacity={0.12}
                        stroke={lane.color} strokeWidth={1.5} strokeOpacity={0.5}
                      />
                    )}
                    <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={7}
                      fill={style.fill}
                      stroke={isHov || isSel ? lane.color : style.stroke}
                      strokeWidth={isHov || isSel ? 2 : 1.5}
                    />
                    {/* Step number */}
                    <text x={x + 8} y={y + 14} fill={style.textColor} fontSize={9} fillOpacity={0.45}>
                      {String(node.row + 1).padStart(2, '0')}
                    </text>
                    {/* Status icon */}
                    {status === 'done' && (
                      <text x={x + NODE_W - 12} y={y + 14} fill={lane.color} fontSize={10}>✓</text>
                    )}
                    {status === 'active' && (
                      <circle cx={x + NODE_W - 10} cy={y + 10} r={4} fill={lane.color}>
                        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {status === 'locked' && (
                      <text x={x + NODE_W - 14} y={y + 15} fill="#40405a" fontSize={10}>🔒</text>
                    )}
                    {/* Label */}
                    <text x={x + NODE_W / 2} y={y + 32} textAnchor="middle"
                      fill={style.textColor} fontSize={10.5} fontWeight={600}>
                      {node.label}
                    </text>
                    {/* Sub */}
                    <text x={x + NODE_W / 2} y={y + 47} textAnchor="middle"
                      fill={style.textColor} fontSize={9} fillOpacity={0.55}>
                      {node.sub}
                    </text>
                  </g>
                );
              })
            )}
          </svg>
        </div>
        <p className="text-xs text-muted mt-3 text-center">
          Click any node to view details and tips · Pulsing = available next · ✓ = completed · 🔒 = complete prerequisites first
        </p>
      </GlassCard>

      {/* Node Detail Panel */}
      <AnimatePresence>
        {selectedNode && selectedInfo && selectedLane && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >
            <GlassCard>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ backgroundColor: selectedLane.color + '22', color: selectedLane.color }}>
                      {selectedLane.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      selectedStatus === 'done'   ? 'bg-success/20 text-success' :
                      selectedStatus === 'active' ? 'bg-accent/20 text-accent' :
                      'bg-neutral-700 text-muted'
                    }`}>
                      {selectedStatus === 'done' ? '✓ Completed' :
                       selectedStatus === 'active' ? '⚡ Up Next' : '🔒 Locked'}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-xl text-foreground">{selectedNode.label}</h3>
                  <p className="text-sm text-muted mt-1">{selectedInfo.description}</p>
                </div>
                <button onClick={() => setSelectedNode(null)}
                  className="text-muted hover:text-foreground ml-4 flex-shrink-0 mt-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-3">Key Insights</p>
                  <ul className="space-y-2">
                    {selectedInfo.tips.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span style={{ color: selectedLane.color }}>→</span>
                        <span className="text-foreground">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col justify-center gap-3">
                  <button
                    onClick={() => router.push(selectedInfo.link)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: selectedLane.color + '20',
                      color: selectedLane.color,
                      border: `1px solid ${selectedLane.color}55`,
                    }}
                  >
                    Go to {selectedLane.label} section →
                  </button>
                  {selectedStatus === 'locked' && (
                    <p className="text-xs text-muted text-center">
                      Complete prerequisites first: {selectedNode.deps.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
