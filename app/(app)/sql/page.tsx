'use client';

import { useState, type ReactNode } from 'react';
import React from 'react';
import { PageContainer, GlassCard } from '@/components/ui/components';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ChevronRight, Lightbulb, AlertTriangle, Target } from 'lucide-react';

// ── Shared primitive components ────────────────────────────────────────────────

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="relative group my-3">
      <pre className="bg-[#0d1117] border border-neutral-800 rounded-lg p-4 text-xs text-[#e6edf3] overflow-x-auto leading-relaxed font-mono whitespace-pre">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded bg-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity border border-neutral-700"
        title="Copy code"
      >
        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-neutral-400" />}
      </button>
    </div>
  );
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 p-3 bg-[#0a1f14] border border-[#00ff8830] rounded-lg my-3 text-sm">
      <Lightbulb className="w-4 h-4 text-[#00ff88] mt-0.5 flex-shrink-0" />
      <div className="text-[#a7f3d0] leading-relaxed">{children}</div>
    </div>
  );
}

function Warn({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 p-3 bg-[#1f1200] border border-[#ff990030] rounded-lg my-3 text-sm">
      <AlertTriangle className="w-4 h-4 text-[#ff9900] mt-0.5 flex-shrink-0" />
      <div className="text-[#fed7aa] leading-relaxed">{children}</div>
    </div>
  );
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-xs font-bold text-[#00d4ff] mt-6 mb-2 uppercase tracking-widest">{children}</h3>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-3 rounded-lg border border-neutral-800">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-neutral-900 border-b border-neutral-800">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-3 py-2.5 text-[#00d4ff] font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-b border-neutral-900 ${i % 2 === 0 ? 'bg-[#0a0a12]' : 'bg-[#0d1117]'}`}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-neutral-300">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InterviewBox({ q, children }: { q: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-2 border border-[#a855f730] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 p-3 text-left bg-[#130920] hover:bg-[#1a0b2e] transition-colors"
      >
        <Target className="w-3.5 h-3.5 text-[#c084fc] flex-shrink-0" />
        <span className="text-sm font-medium text-[#d8b4fe]">{q}</span>
        <ChevronRight className={`w-3.5 h-3.5 text-[#a855f7] ml-auto transition-transform flex-shrink-0 ${open ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="p-4 bg-[#0c0618] border-t border-[#a855f720] text-sm">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Nav config ─────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'cheatsheet',     label: 'Cheat Sheet',                       icon: '📋', group: null                   },
  { id: 'row-rank',       label: 'ROW_NUMBER / RANK / NTILE',         icon: '🔢', group: 'Window Functions'      },
  { id: 'lag-lead',       label: 'LAG / LEAD / FIRST & LAST VALUE',   icon: '↔️', group: 'Window Functions'      },
  { id: 'running-totals', label: 'Running Totals & Moving Avg',       icon: '📈', group: 'Window Functions'      },
  { id: 'cte',            label: 'CTEs vs Subqueries vs Temp Tables', icon: '📦', group: 'CTEs & Structure'      },
  { id: 'explain',        label: 'EXPLAIN ANALYZE & Query Plans',     icon: '🔍', group: 'Query Optimization'    },
  { id: 'indexes',        label: 'Composite, Covering & Partial',     icon: '⚡', group: 'Query Optimization'    },
  { id: 'partition',      label: 'PARTITION BY Patterns',             icon: '🗂️', group: 'Query Optimization'    },
  { id: 'merge',          label: 'MERGE / UPSERT & SCD Types',        icon: '🔄', group: 'Advanced Patterns'     },
  { id: 'de-queries',     label: 'Retention, Funnel & DAU/MAU',       icon: '🎯', group: 'DE Interview Queries'  },
] as const;

type TopicId = typeof NAV[number]['id'];
const GROUPS = ['Window Functions', 'CTEs & Structure', 'Query Optimization', 'Advanced Patterns', 'DE Interview Queries'];

// ── Topic content ──────────────────────────────────────────────────────────────

function Cheatsheet() {
  return (
    <div>
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">📋 Cheat Sheet — Quick Revision</h2>
      <p className="text-muted text-sm mb-5">Last-30-minutes-before-interview quick reference. All critical patterns on one page.</p>

      <H3>Window Function Quick Reference</H3>
      <DataTable
        headers={['Function', 'Purpose', 'Key Behavior']}
        rows={[
          ['ROW_NUMBER()', 'Unique sequential rank', 'No ties — always unique. Dedup, pagination.'],
          ['RANK()', 'Rank with gaps', '1,1,3 — tied rows same rank, next value skips.'],
          ['DENSE_RANK()', 'Rank no gaps', '1,1,2 — no gaps. Top-N including all ties.'],
          ['NTILE(n)', 'Split into n buckets', 'Returns 1..n. Percentile / AB test groups.'],
          ['LAG(col,n,def)', 'Previous row value', 'Default if no prior row. Day-over-day change.'],
          ['LEAD(col,n,def)', 'Next row value', 'Access n rows ahead. Session gap detection.'],
          ['FIRST_VALUE(col)', 'First in partition', 'Default frame OK. First purchase, first event.'],
          ['LAST_VALUE(col)', 'Last in partition', '⚠️ MUST add ROWS BETWEEN ... UNBOUNDED FOLLOWING.'],
          ['SUM() + ROWS BETWEEN', 'Cumulative sum', 'UNBOUNDED PRECEDING AND CURRENT ROW.'],
          ['AVG() + ROWS n PRECEDING', 'Moving average', '6 PRECEDING AND CURRENT ROW = 7-day rolling.'],
        ]}
      />

      <H3>Frame Clause Reference</H3>
      <DataTable
        headers={['Frame', 'Meaning']}
        rows={[
          ['ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW', 'Cumulative from start to current row'],
          ['ROWS BETWEEN 6 PRECEDING AND CURRENT ROW', 'Rolling 7 rows (current + 6 prior)'],
          ['ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING', 'Entire partition (use for LAST_VALUE)'],
          ['RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW', 'Default when ORDER BY present — logical boundary'],
        ]}
      />

      <H3>CTE Template</H3>
      <CodeBlock code={`WITH orders_summary AS (
  SELECT user_id, COUNT(*) AS cnt, SUM(amount) AS spend
  FROM orders WHERE status = 'completed' GROUP BY user_id
),
user_segments AS (
  SELECT user_id,
    CASE WHEN spend > 1000 THEN 'VIP' WHEN spend > 100 THEN 'Regular' ELSE 'Casual' END AS seg
  FROM orders_summary
)
SELECT u.name, s.seg, o.cnt
FROM users u JOIN orders_summary o USING(user_id) JOIN user_segments s USING(user_id);`} />

      <H3>Top-N Per Group (Most-Asked Pattern)</H3>
      <CodeBlock code={`-- Use DENSE_RANK when ties should all be included
WITH ranked AS (
  SELECT *, DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS dr
  FROM employees
)
SELECT * FROM ranked WHERE dr <= 3;

-- Use ROW_NUMBER when exactly N rows needed
WITH deduped AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) AS rn
  FROM user_records
)
SELECT * FROM deduped WHERE rn = 1;`} />

      <H3>MoM Growth % Template</H3>
      <CodeBlock code={`WITH monthly AS (
  SELECT DATE_TRUNC('month', order_date) AS month, SUM(revenue) AS rev
  FROM orders GROUP BY 1
)
SELECT month, rev,
  LAG(rev) OVER (ORDER BY month) AS prev_month,
  ROUND(100.0 * (rev - LAG(rev) OVER (ORDER BY month))
    / NULLIF(LAG(rev) OVER (ORDER BY month), 0), 1) AS mom_pct
FROM monthly;`} />

      <H3>30-Day Retention Template</H3>
      <CodeBlock code={`WITH cohort AS (
  SELECT user_id, DATE_TRUNC('week', MIN(created_at)) AS cohort_week
  FROM users GROUP BY user_id
)
SELECT
  c.cohort_week,
  COUNT(DISTINCT c.user_id)                          AS cohort_size,
  COUNT(DISTINCT e.user_id)                          AS retained,
  ROUND(100.0 * COUNT(DISTINCT e.user_id)
    / NULLIF(COUNT(DISTINCT c.user_id), 0), 1)       AS retention_pct
FROM cohort c
LEFT JOIN events e
  ON c.user_id = e.user_id
  AND DATE(e.event_time) = DATE(c.cohort_week + INTERVAL '30 days')
GROUP BY c.cohort_week ORDER BY 1;`} />

      <H3>DAU / MAU Stickiness</H3>
      <CodeBlock code={`WITH dau AS (
  SELECT DATE(event_time) AS dt, COUNT(DISTINCT user_id) AS dau FROM events GROUP BY 1
),
mau AS (
  SELECT DATE_TRUNC('month', event_time) AS month, COUNT(DISTINCT user_id) AS mau FROM events GROUP BY 1
)
SELECT d.dt, d.dau, m.mau,
  ROUND(100.0 * d.dau / NULLIF(m.mau, 0), 1) AS stickiness_pct
FROM dau d JOIN mau m ON DATE_TRUNC('month', d.dt) = m.month;`} />

      <H3>Funnel Analysis</H3>
      <CodeBlock code={`WITH funnel AS (
  SELECT
    COUNT(DISTINCT CASE WHEN step='view'     THEN user_id END) AS p1,
    COUNT(DISTINCT CASE WHEN step='cart'     THEN user_id END) AS p2,
    COUNT(DISTINCT CASE WHEN step='checkout' THEN user_id END) AS p3,
    COUNT(DISTINCT CASE WHEN step='purchase' THEN user_id END) AS p4
  FROM funnel_events WHERE event_date >= CURRENT_DATE - 30
)
SELECT p1, p2, ROUND(100.0*p2/NULLIF(p1,0),1) AS p1_p2_pct,
       p3, ROUND(100.0*p3/NULLIF(p2,0),1) AS p2_p3_pct,
       p4, ROUND(100.0*p4/NULLIF(p3,0),1) AS p3_p4_pct FROM funnel;`} />

      <H3>SCD Type 2 — MERGE Pattern</H3>
      <CodeBlock code={`-- Step 1: Expire changed rows
UPDATE dim_customer
SET is_current = FALSE, expiry_date = CURRENT_DATE - 1
WHERE customer_id IN (
  SELECT s.customer_id FROM staging s
  JOIN dim_customer d ON s.customer_id = d.customer_id AND d.is_current
  WHERE s.city != d.city
);
-- Step 2: Insert new versions
INSERT INTO dim_customer (customer_id, name, city, is_current, effective_date, expiry_date)
SELECT s.customer_id, s.name, s.city, TRUE, CURRENT_DATE, '9999-12-31'
FROM staging s
LEFT JOIN dim_customer d ON s.customer_id = d.customer_id AND d.is_current
WHERE d.customer_id IS NULL OR s.city != d.city;`} />

      <H3>Index Quick Reference</H3>
      <DataTable
        headers={['Index Type', 'When to Use', 'Syntax']}
        rows={[
          ['Composite', 'Multi-column WHERE / ORDER BY', 'CREATE INDEX ON t(a,b,c) — left-prefix rule'],
          ['Covering', 'All queried cols in index', 'CREATE INDEX ON t(a) INCLUDE(b,c)'],
          ['Partial', 'Filter on subset of rows', "CREATE INDEX ON t(a) WHERE status='active'"],
          ['Unique', 'Enforce uniqueness + speed', 'CREATE UNIQUE INDEX ON t(email)'],
        ]}
      />

      <H3>EXPLAIN Key Terms</H3>
      <DataTable
        headers={['Node', 'Meaning', 'Action']}
        rows={[
          ['Seq Scan', 'Full table scan', 'Add index on filter column'],
          ['Index Only Scan', 'All data from index', '✅ Best — add INCLUDE if needed'],
          ['Hash Join', 'Hash table from smaller side', 'Increase work_mem for large tables'],
          ['Nested Loop', 'O(n×m)', 'Fine for small tables — bad for large'],
          ['rows=1 actual=50000', 'Stale statistics', 'Run ANALYZE table'],
        ]}
      />
    </div>
  );
}

function TopicRowRank() {
  return (
    <div>
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">🔢 ROW_NUMBER, RANK, DENSE_RANK & NTILE</h2>
      <p className="text-muted text-sm mb-5">The most asked window functions in DE interviews. Differences between them trip up most candidates.</p>

      <H3>Syntax</H3>
      <CodeBlock code={`SELECT
  employee_id,
  department,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC)  AS rn,
  RANK()       OVER (PARTITION BY department ORDER BY salary DESC)  AS rnk,
  DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC)  AS dns,
  NTILE(4)     OVER (PARTITION BY department ORDER BY salary DESC)  AS quartile
FROM employees;`} />

      <H3>Key Differences</H3>
      <DataTable
        headers={['Function', 'Ties?', 'Gaps?', 'Output (3-way tie)', 'Use Case']}
        rows={[
          ['ROW_NUMBER()', 'Arbitrary order for ties', 'No gaps, always unique', '1, 2, 3, 4', 'Dedup, pagination, sampling'],
          ['RANK()', 'Same rank for ties', 'Gaps after ties', '1, 1, 1, 4', 'Competition — skip positions after tie'],
          ['DENSE_RANK()', 'Same rank for ties', 'No gaps', '1, 1, 1, 2', 'Top-N per group — include all ties'],
          ['NTILE(4)', 'Evenly distributed', 'N buckets 1..N', '1, 1, 2, 2', 'Percentile groups, A/B testing'],
        ]}
      />

      <Tip>Interview rule: When the question says &quot;top 3 salaries&quot; use DENSE_RANK (multiple people can share a top-3 salary). When it says &quot;return exactly 3 rows&quot; use ROW_NUMBER.</Tip>

      <H3>Classic: Top-N Per Group</H3>
      <InterviewBox q="Find the top 3 highest-paid employees per department">
        <CodeBlock code={`WITH ranked AS (
  SELECT
    employee_id, department, salary,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dr
  FROM employees
)
SELECT employee_id, department, salary
FROM ranked
WHERE dr <= 3;`} />
        <Tip>DENSE_RANK includes ALL employees who earn a top-3 salary (even if it means more than 3 rows). Using ROW_NUMBER arbitrarily excludes tied candidates — a common but wrong answer.</Tip>
      </InterviewBox>

      <InterviewBox q="De-duplicate rows: keep only the latest record per user">
        <CodeBlock code={`WITH deduped AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY updated_at DESC
    ) AS rn
  FROM user_records
)
SELECT * FROM deduped WHERE rn = 1;`} />
        <Tip>This is the standard dedup pattern in ETL pipelines. Use ROW_NUMBER (not RANK/DENSE_RANK) because you need exactly 1 row per user, regardless of ties.</Tip>
      </InterviewBox>

      <InterviewBox q="Assign users to spending quartiles for A/B segmentation">
        <CodeBlock code={`SELECT
  user_id,
  total_spend,
  NTILE(4) OVER (ORDER BY total_spend DESC) AS spend_quartile
  -- Quartile 1 = top 25% spenders, 4 = bottom 25%
FROM (
  SELECT user_id, SUM(amount) AS total_spend FROM orders GROUP BY user_id
) t;`} />
      </InterviewBox>

      <InterviewBox q="Rank stores by revenue within each region, then get rank-1 only">
        <CodeBlock code={`WITH store_revenue AS (
  SELECT region, store_id, SUM(revenue) AS total_rev
  FROM sales GROUP BY 1, 2
),
ranked AS (
  SELECT *,
    RANK() OVER (PARTITION BY region ORDER BY total_rev DESC) AS rnk
  FROM store_revenue
)
SELECT region, store_id, total_rev
FROM ranked WHERE rnk = 1;`} />
      </InterviewBox>

      <H3>NULLS Handling</H3>
      <CodeBlock code={`-- Always specify NULLS FIRST/LAST — behavior differs across databases
ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC NULLS LAST)
DENSE_RANK() OVER (ORDER BY revenue ASC  NULLS FIRST)

-- Redshift/BigQuery/Spark: NULLS LAST is usually default for DESC
-- PostgreSQL: NULLS FIRST is default for DESC — opposite of most!`} />
      <Warn>Omitting NULLS FIRST/LAST is a silent bug. PostgreSQL puts NULLs first for DESC ordering; Redshift and BigQuery put them last. Always be explicit in interview answers — it shows senior-level awareness.</Warn>

      <H3>Frame Clause (ROWS vs RANGE)</H3>
      <CodeBlock code={`-- ROWS: physical row count (faster, predictable)
SUM(sales) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)  -- 7-day rolling

-- RANGE: logical value range
SUM(sales) OVER (ORDER BY date RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW)

-- Default frames:
-- With ORDER BY present:    RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
-- Without ORDER BY:         ROWS  BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`} />
    </div>
  );
}

function TopicLagLead() {
  return (
    <div>
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">↔️ LAG, LEAD, FIRST_VALUE & LAST_VALUE</h2>
      <p className="text-muted text-sm mb-5">Offset functions — access values from neighboring rows in the same window. Essential for time-series analysis.</p>

      <H3>Syntax</H3>
      <CodeBlock code={`-- LAG: value from a previous row
LAG(column, offset, default_if_null) OVER (PARTITION BY ... ORDER BY ...)

-- LEAD: value from a future row
LEAD(column, offset, default_if_null) OVER (PARTITION BY ... ORDER BY ...)

-- FIRST_VALUE: first value in the window frame
FIRST_VALUE(column) OVER (PARTITION BY ... ORDER BY ... ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)

-- LAST_VALUE: last value — MUST set frame explicitly!
LAST_VALUE(column) OVER (
  PARTITION BY ... ORDER BY ...
  ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING
)`} />
      <Warn>LAST_VALUE without an explicit frame returns the CURRENT ROW&apos;s value (not the last in partition) because the default frame ends at CURRENT ROW. This is the most common window function bug in production.</Warn>

      <H3>Day-over-Day Revenue Change</H3>
      <CodeBlock code={`SELECT
  event_date,
  daily_revenue,
  LAG(daily_revenue, 1, 0) OVER (ORDER BY event_date)                            AS prev_day,
  daily_revenue - LAG(daily_revenue, 1, 0) OVER (ORDER BY event_date)            AS delta,
  ROUND(
    100.0 * (daily_revenue - LAG(daily_revenue) OVER (ORDER BY event_date))
    / NULLIF(LAG(daily_revenue) OVER (ORDER BY event_date), 0)
  , 1)                                                                            AS pct_change
FROM daily_revenue_summary
ORDER BY event_date;`} />
      <Tip>Wrap the LAG denominator with NULLIF(..., 0) to avoid division-by-zero on the first row where LAG returns NULL (or 0 as the default).</Tip>

      <H3>Month-over-Month Growth</H3>
      <CodeBlock code={`WITH monthly AS (
  SELECT DATE_TRUNC('month', order_date) AS month, SUM(revenue) AS rev
  FROM orders GROUP BY 1
)
SELECT
  month, rev,
  LAG(rev) OVER (ORDER BY month)                               AS prev_month,
  ROUND(
    100.0 * (rev - LAG(rev) OVER (ORDER BY month))
    / NULLIF(LAG(rev) OVER (ORDER BY month), 0)
  , 1)                                                         AS mom_pct
FROM monthly;`} />

      <H3>First Purchase Detection</H3>
      <CodeBlock code={`SELECT
  user_id, order_date, amount,
  FIRST_VALUE(order_date) OVER (
    PARTITION BY user_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS first_order_date,
  CASE
    WHEN order_date = FIRST_VALUE(order_date) OVER (
      PARTITION BY user_id ORDER BY order_date
    ) THEN 'First Purchase'
    ELSE 'Repeat'
  END AS order_type
FROM orders;`} />

      <H3>Carry-Forward (IGNORE NULLS)</H3>
      <CodeBlock code={`-- Fill forward NULL gaps with last known value
-- Supported in: BigQuery, Snowflake, Spark SQL, Redshift (partial)

LAST_VALUE(status IGNORE NULLS) OVER (
  PARTITION BY user_id
  ORDER BY event_time
  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
)

-- LAG skipping NULLs:
LAG(status, 1) IGNORE NULLS OVER (PARTITION BY user_id ORDER BY event_time)`} />
      <Tip>PostgreSQL does not natively support IGNORE NULLS. Use a workaround with a subquery and MAX FILTER or an array agg approach. Redshift, BigQuery, and Spark all support IGNORE NULLS natively.</Tip>

      <H3>Interview Problems</H3>
      <InterviewBox q="Calculate day-over-day revenue change per product">
        <CodeBlock code={`SELECT
  product_id, sale_date, revenue,
  LAG(revenue) OVER (PARTITION BY product_id ORDER BY sale_date) AS prev_day,
  revenue - LAG(revenue) OVER (PARTITION BY product_id ORDER BY sale_date) AS delta
FROM daily_product_sales;`} />
      </InterviewBox>

      <InterviewBox q="Detect new user sessions (gap > 30 min between events)">
        <CodeBlock code={`SELECT
  user_id, event_time,
  LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) AS prev_event,
  event_time - LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) AS gap,
  CASE
    WHEN event_time - LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time)
      > INTERVAL '30 minutes' OR LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) IS NULL
    THEN 1 ELSE 0
  END AS is_session_start
FROM events;`} />
      </InterviewBox>

      <InterviewBox q="Find users who churned (no activity for 30 days after last event)">
        <CodeBlock code={`WITH last_activity AS (
  SELECT user_id, MAX(event_time) AS last_seen FROM events GROUP BY user_id
)
SELECT user_id, last_seen,
  CURRENT_DATE - DATE(last_seen) AS days_since_last_activity,
  CASE WHEN CURRENT_DATE - DATE(last_seen) > 30 THEN 'Churned' ELSE 'Active' END AS status
FROM last_activity;`} />
      </InterviewBox>
    </div>
  );
}

function TopicRunningTotals() {
  return (
    <div>
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">📈 Running Totals & Moving Averages</h2>
      <p className="text-muted text-sm mb-5">Cumulative aggregations and sliding-window analytics — critical for time-series KPIs in DE roles.</p>

      <H3>Cumulative Sum (Running Total)</H3>
      <CodeBlock code={`-- Revenue accumulated from start to each date
SELECT
  order_date, revenue,
  SUM(revenue) OVER (
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS cumulative_revenue
FROM daily_revenue;

-- Per-user cumulative spend (partitioned)
SELECT
  user_id, order_date, amount,
  SUM(amount) OVER (
    PARTITION BY user_id
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS user_cumulative_spend
FROM orders;`} />

      <H3>N-Day Moving Average</H3>
      <CodeBlock code={`SELECT
  event_date, daily_active_users,
  -- 7-day rolling average
  ROUND(AVG(daily_active_users) OVER (
    ORDER BY event_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW   -- current + 6 prior = 7 rows
  ), 1) AS dau_7d_avg,
  -- 30-day rolling average
  ROUND(AVG(daily_active_users) OVER (
    ORDER BY event_date
    ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
  ), 1) AS dau_30d_avg
FROM daily_metrics;`} />
      <Tip>ROWS BETWEEN 6 PRECEDING AND CURRENT ROW = 7 data points. If some days have no data row (calendar gaps), you need a date spine first. Use generate_series (PostgreSQL) or a calendar table to fill gaps before applying the window.</Tip>

      <H3>YTD Revenue (Resets Each Year)</H3>
      <CodeBlock code={`SELECT
  sale_date, revenue,
  SUM(revenue) OVER (
    PARTITION BY DATE_PART('year', sale_date)    -- resets on Jan 1
    ORDER BY sale_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS ytd_revenue
FROM daily_sales;`} />

      <H3>ROWS vs RANGE — Comparison</H3>
      <DataTable
        headers={['Aspect', 'ROWS', 'RANGE']}
        rows={[
          ['Boundary type', 'Physical row count', 'Logical value range (ORDER BY value)'],
          ['Behavior with ties', 'Deterministic (physical position)', 'All rows with same ORDER BY value in same frame'],
          ['Performance', 'Faster (simpler)', 'Slower (value comparison)'],
          ['Best for', 'Rolling N-row windows', 'Date range windows with INTERVAL'],
          ['Example', 'ROWS BETWEEN 6 PRECEDING AND CURRENT ROW', "RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW"],
        ]}
      />
      <Warn>RANGE with INTERVAL only works on DATE/TIMESTAMP columns. It silently errors or behaves unexpectedly on INTEGER columns. Prefer ROWS for numeric sequences.</Warn>

      <H3>Cumulative Percentage of Total</H3>
      <CodeBlock code={`SELECT
  order_date, revenue,
  SUM(revenue) OVER (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumul,
  SUM(revenue) OVER ()                                                               AS total,
  ROUND(100.0 *
    SUM(revenue) OVER (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
    / NULLIF(SUM(revenue) OVER (), 0)
  , 1) AS cumul_pct
FROM daily_revenue;`} />

      <InterviewBox q="7-day rolling average of DAU per product">
        <CodeBlock code={`SELECT
  product_id, event_date, dau,
  ROUND(AVG(dau) OVER (
    PARTITION BY product_id
    ORDER BY event_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ), 1) AS dau_7d_rolling
FROM product_daily_active
ORDER BY product_id, event_date;`} />
      </InterviewBox>

      <InterviewBox q="Running total of orders per user, grouped by year">
        <CodeBlock code={`SELECT
  user_id, order_date, order_id,
  SUM(1) OVER (
    PARTITION BY user_id, DATE_PART('year', order_date)
    ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS nth_order_this_year
FROM orders;`} />
      </InterviewBox>
    </div>
  );
}

function TopicCTE() {
  return (
    <div>
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">📦 CTEs vs Subqueries vs Temp Tables</h2>
      <p className="text-muted text-sm mb-5">Knowing when to use each structure is a senior DE signal. Each has different performance and readability implications.</p>

      <H3>Comparison at a Glance</H3>
      <DataTable
        headers={['Aspect', 'CTE', 'Subquery', 'Temp Table']}
        rows={[
          ['Readability', '✅ Named, reusable', '⚠️ Can nest deeply', '✅ Well-named'],
          ['Reuse in same query', '✅ Multiple references', '❌ Must repeat', '✅ Yes'],
          ['Performance (PG)', '⚠️ May materialize as fence', '✅ Inlined by planner', '✅ Materialized once'],
          ['Can add index', '❌ No', '❌ No', '✅ Yes'],
          ['Recursive queries', '✅ WITH RECURSIVE', '❌ No', '❌ No'],
          ['Cross-query reuse', '❌ Single statement', '❌ Single statement', '✅ Full session'],
          ['Best for', 'Readability, recursion', 'Simple scalar/filter', 'Expensive intermediates'],
        ]}
      />

      <H3>Multiple CTEs</H3>
      <CodeBlock code={`WITH
orders_summary AS (
  SELECT user_id, COUNT(*) AS order_cnt, SUM(amount) AS total_spend
  FROM orders GROUP BY user_id
),
user_segments AS (
  SELECT user_id,
    CASE WHEN total_spend > 1000 THEN 'VIP'
         WHEN total_spend > 100  THEN 'Regular'
         ELSE 'Casual'
    END AS segment
  FROM orders_summary
)
SELECT u.name, s.segment, o.order_cnt
FROM users u
JOIN orders_summary o USING(user_id)
JOIN user_segments  s USING(user_id);`} />

      <H3>Recursive CTE — Org Hierarchy</H3>
      <CodeBlock code={`WITH RECURSIVE org_tree AS (
  -- Anchor: CEO / root nodes (no manager)
  SELECT employee_id, name, manager_id, 0 AS depth, name AS path
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- Recursive step: join each employee to their found manager
  SELECT e.employee_id, e.name, e.manager_id, ot.depth + 1,
    ot.path || ' -> ' || e.name
  FROM employees e
  JOIN org_tree ot ON e.manager_id = ot.employee_id
)
SELECT * FROM org_tree ORDER BY path;`} />
      <Tip>Recursive CTEs also work for date spine generation: start from a base date and UNION ALL next_date + 1 until reaching the target. Very useful for filling calendar gaps before windowing functions.</Tip>

      <H3>Temp Table (PostgreSQL / Redshift)</H3>
      <CodeBlock code={`-- PostgreSQL
CREATE TEMP TABLE active_users AS
SELECT user_id, COUNT(*) AS sessions
FROM user_sessions
WHERE session_date >= CURRENT_DATE - 90
GROUP BY user_id;

-- Add an index — temp tables support this unlike CTEs
CREATE INDEX ON active_users(user_id);

-- Use in multiple downstream queries (session-scoped)
SELECT u.name, a.sessions
FROM users u JOIN active_users a USING(user_id);

-- Spark SQL equivalent: CACHE or CREATE TEMP VIEW
CREATE OR REPLACE TEMP VIEW active_users AS SELECT ...;
spark.catalog.cacheTable("active_users")  -- Python API`} />
      <Warn>Redshift temp tables don&apos;t support CREATE INDEX. Define DISTKEY / SORTKEY at creation time: CREATE TEMP TABLE t (user_id INT) DISTKEY(user_id) SORTKEY(user_id).</Warn>

      <H3>Correlated vs Non-Correlated Subqueries</H3>
      <CodeBlock code={`-- Non-correlated: runs ONCE independently
SELECT * FROM orders
WHERE user_id IN (SELECT user_id FROM vip_users);   -- single execution

-- Correlated: runs ONCE PER ROW of outer query — O(n) executions!
SELECT o.*,
  (SELECT COUNT(*) FROM returns r WHERE r.order_id = o.order_id) AS return_count
FROM orders o;           -- ⚠️ runs once per order row

-- Rewrite correlated subquery as LEFT JOIN (always prefer this):
SELECT o.*, COALESCE(r.cnt, 0) AS return_count
FROM orders o
LEFT JOIN (
  SELECT order_id, COUNT(*) AS cnt FROM returns GROUP BY order_id
) r ON o.order_id = r.order_id;`} />

      <InterviewBox q="When would you choose a temp table over a CTE?">
        <div className="text-neutral-300 space-y-2 text-sm">
          <p><span className="text-[#00d4ff] font-semibold">Temp table when:</span></p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-neutral-400">
            <li>The intermediate result is very large and referenced 3+ times</li>
            <li>You need to add an index to speed up downstream joins</li>
            <li>You want to inspect intermediate results with SELECT ...</li>
            <li>The same intermediate data is needed across multiple SQL statements in a session</li>
          </ul>
          <p><span className="text-[#00d4ff] font-semibold">CTE when:</span></p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-neutral-400">
            <li>Single query, readability is the goal</li>
            <li>Recursive traversal (org charts, date spines)</li>
            <li>PostgreSQL 12+: CTEs are inlined by default (like subqueries) — no fencing overhead</li>
          </ul>
        </div>
      </InterviewBox>
    </div>
  );
}

function TopicExplain() {
  return (
    <div>
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">🔍 EXPLAIN ANALYZE & Query Plans</h2>
      <p className="text-muted text-sm mb-5">Reading query plans is a power skill. &quot;How would you diagnose a slow query?&quot; is asked in every senior DE interview.</p>

      <H3>Commands</H3>
      <CodeBlock code={`-- EXPLAIN: shows estimated plan, does NOT execute the query
EXPLAIN SELECT * FROM orders WHERE user_id = 123;

-- EXPLAIN ANALYZE: executes the query, shows actual vs estimated
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;

-- Most useful: ANALYZE + BUFFERS (shows cache hits/misses)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT user_id, COUNT(*) FROM orders GROUP BY user_id;`} />

      <H3>Sample Plan Output</H3>
      <CodeBlock code={`Gather  (cost=1000.00..12345.67 rows=500 width=40)
  ->  Hash Join  (cost=800.00..11000.00 rows=500 width=40)
        Hash Cond: (o.user_id = u.id)
        ->  Seq Scan on orders o  (cost=0.00..5000.00 rows=100000 width=32)
              Filter: (status = 'completed')
              Rows Removed by Filter: 75000
        ->  Hash  (cost=200.00..200.00 rows=1000 width=20)
              ->  Index Scan on users u  (cost=0.00..200.00 rows=1000 width=20)
                    Index Cond: (created_at > '2024-01-01')
Planning Time: 0.5 ms
Execution Time: 348.2 ms`} />

      <H3>Key Nodes & What to Look For</H3>
      <DataTable
        headers={['Node', 'Meaning', 'When Problematic', 'Fix']}
        rows={[
          ['Seq Scan', 'Full table scan', 'On large tables (>100K rows)', 'Add index on filter/join column'],
          ['Index Scan', 'Uses B-tree, fetches heap', 'Not always — depends on selectivity', 'Fine for <10% of rows'],
          ['Index Only Scan', 'All data in index, no heap', 'Never — this is best case', '✅ Add INCLUDE to covering index'],
          ['Bitmap Heap Scan', 'Batches scattered heap reads', 'High cost with low selectivity', 'Increase work_mem or add better index'],
          ['Hash Join', 'Hash table from smaller side', 'Large hash = spills to disk', 'Increase work_mem, check DISTKEY in Redshift'],
          ['Nested Loop', 'O(n×m) iteration', 'On large outer tables', 'Force Hash Join or add index on inner side'],
          ['Merge Join', 'Both inputs sorted on key', 'High setup cost on unsorted data', 'Use when data is pre-sorted'],
        ]}
      />

      <H3>Reading cost= and rows=</H3>
      <DataTable
        headers={['Field', 'Meaning', 'Action']}
        rows={[
          ['cost=X..Y', 'Startup cost .. total cost (arbitrary units)', 'Lower total cost = better plan'],
          ['rows=N', 'Planner estimate of output rows', 'Big gap from actual rows? Run ANALYZE'],
          ['width=N', 'Average bytes per output row', 'Large width + many rows = memory concern'],
          ['actual time=X..Y', 'Actual ms for first..all rows', 'ANALYZE only — true wall time'],
          ['Rows Removed by Filter: N', 'Rows read but discarded after scan', 'High = inefficient — want index to push filter down'],
          ['loops=N', 'How many times node executed', 'loops=1000 means Nested Loop running 1000 x'],
        ]}
      />

      <H3>Common Problems & Fixes</H3>
      <CodeBlock code={`-- Problem 1: Seq Scan on large table
Seq Scan on orders  (cost=0.00..500000.00 rows=250000 width=40)
  Filter: (user_id = 12345)
-- Fix:
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Problem 2: Stale statistics (planner estimates 1 row, actual 50000)
Index Scan on orders (rows=1 ... actual rows=50000)
-- Fix:
ANALYZE orders;          -- update statistics
VACUUM ANALYZE orders;   -- if table has many dead tuples too

-- Problem 3: Correlated subquery in SELECT (O(n) executions)
-- Look for: SubPlan node appearing inside a Seq Scan
-- Fix: rewrite as LEFT JOIN (see CTE topic)`} />

      <Tip>In Redshift, use EXPLAIN (no ANALYZE) and look for DS_BCAST_INNER (one side broadcast to all nodes — means no DISTKEY match) or DS_DIST_BOTH (both sides redistributed over network) as signs of expensive data movement.</Tip>

      <InterviewBox q="Walk me through how you would diagnose and fix a slow SQL query">
        <div className="text-neutral-300 space-y-2 text-sm">
          <p className="text-[#00d4ff] font-semibold mb-2">Systematic approach (say this in order):</p>
          <div className="space-y-1.5">
            {[
              'Run EXPLAIN (ANALYZE, BUFFERS) to get actual vs estimated row counts and execution time per node.',
              'Look for Seq Scan on large tables — check if a useful index on the filter/join column is missing.',
              'Compare rows= (estimate) vs actual rows= — large mismatch means stale stats → run ANALYZE.',
              'Check for Nested Loop on large tables — may need to force Hash Join or add index on the inner table.',
              'Look for "Rows Removed by Filter: N" — this means data is read but discarded post-scan (missing index).',
              'Identify correlated subqueries (SubPlan nodes) and rewrite as JOIN.',
              'For Redshift: check DISTKEY alignment between joining tables, and SORTKEY match with WHERE predicates.',
            ].map((step, i) => (
              <p key={i}><span className="text-[#00d4ff] font-semibold">{i + 1}.</span> {step}</p>
            ))}
          </div>
        </div>
      </InterviewBox>
    </div>
  );
}

function TopicIndexes() {
  return (
    <div>
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">⚡ Composite, Covering & Partial Indexes</h2>
      <p className="text-muted text-sm mb-5">Indexes are the #1 lever for query performance. Senior DE candidates know not just when to add them, but when NOT to.</p>

      <H3>Index Types Overview</H3>
      <DataTable
        headers={['Type', 'Syntax', 'Best For', 'Trade-off']}
        rows={[
          ['B-tree (default)', 'CREATE INDEX ON t(col)', 'Equality, range, ORDER BY', 'Overhead on every write'],
          ['Composite', 'CREATE INDEX ON t(a,b,c)', 'Multi-column WHERE / ORDER BY', 'Column order is critical — left-prefix rule'],
          ['Covering', 'CREATE INDEX ON t(a) INCLUDE(b,c)', 'Index-only scans', 'More storage per index row'],
          ['Partial', "CREATE INDEX ON t(a) WHERE status='active'", 'Filtered subset only', 'Only helps queries matching the WHERE'],
          ['Unique', 'CREATE UNIQUE INDEX ON t(email)', 'Constraint + equality speed', 'Extra constraint check per insert/update'],
          ['Hash (PG)', 'CREATE INDEX USING HASH ON t(col)', 'Equality only', 'No range queries, no ORDER BY'],
        ]}
      />

      <H3>Composite Index — The Left-Prefix Rule</H3>
      <CodeBlock code={`-- Query patterns: WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC

-- Optimal composite index:
CREATE INDEX idx_orders ON orders(user_id, status, created_at DESC);

-- This index serves:
--   WHERE user_id = 42                              ✅  (left prefix)
--   WHERE user_id = 42 AND status = 'active'        ✅  (left prefix + 2nd col)
--   WHERE user_id = 42 ORDER BY created_at DESC     ⚠️  (skips status — partial use)
--   WHERE status = 'active'                         ❌  (missing left prefix user_id)
--   WHERE created_at > '2024-01-01'                 ❌  (not a prefix)`} />
      <Warn>The left-prefix rule: index on (a, b, c) efficiently serves queries for a, (a, b), and (a, b, c) — but NOT b alone or (b, c). This is the #1 most-tested index concept in DE interviews.</Warn>

      <H3>Covering Index</H3>
      <CodeBlock code={`-- Without covering index: Index Scan + heap fetch for all selected columns
SELECT amount, status FROM orders WHERE user_id = 42;
-- Plan: Index Scan using idx on user_id, then heap fetch for amount, status

-- With covering index (PostgreSQL INCLUDE):
CREATE INDEX idx_orders_covering ON orders(user_id) INCLUDE(amount, status);
-- Plan: Index Only Scan — no heap access at all!

-- BigQuery equivalent: CLUSTER BY also acts as covering-like optimization
-- Redshift: SORTKEY columns are automatically "covered" in sort order queries`} />
      <Tip>A covering index eliminates the heap fetch after the index lookup. For a high-frequency query on a large table, this can reduce query time from 100ms to sub-millisecond by eliminating all random I/O.</Tip>

      <H3>Partial Index</H3>
      <CodeBlock code={`-- Only index rows matching a condition — tiny, fast
-- Useful when most queries filter on a specific subset

-- Only 2% of orders are 'pending' — index just those
CREATE INDEX idx_pending_orders ON orders(user_id, created_at)
  WHERE status = 'pending';

-- Non-deleted users only
CREATE INDEX idx_active_users ON users(email)
  WHERE deleted_at IS NULL;

-- High-priority events only
CREATE INDEX idx_high_priority ON tasks(assigned_to, due_date)
  WHERE priority = 'high' AND completed = FALSE;`} />

      <H3>When Indexes HURT</H3>
      <DataTable
        headers={['Scenario', 'Why It Hurts', 'Better Approach']}
        rows={[
          ['High-write tables (events, logs)', 'Every insert/update must maintain all indexes — write slowdown', 'Drop indexes, bulk load, then rebuild'],
          ['Low-cardinality column (boolean, gender)', 'Not selective — planner may ignore index and Seq Scan anyway', 'Use partial index instead'],
          ['Small tables (<5K rows)', 'Seq scan is faster than random index I/O for small data', "Don't index — let planner choose Seq Scan"],
          ['Too many indexes on one table', 'Storage bloat, vacuum overhead, write amplification', 'Audit with pg_stat_user_indexes, drop unused'],
          ['Wrong index column order', "Query can't use left-prefix — index ignored", 'Check query patterns, reorder columns'],
        ]}
      />

      <H3>Redshift: DISTKEY & SORTKEY</H3>
      <CodeBlock code={`-- Redshift uses distribution + sort strategies instead of B-tree indexes

-- DISTKEY: which column to hash-distribute rows across nodes
CREATE TABLE orders (
  order_id   BIGINT,
  user_id    INT     DISTKEY,   -- co-locate with users table (same DISTKEY)
  amount     DECIMAL
) DISTSTYLE KEY;
-- DISTSTYLE options: KEY (default hash), EVEN (uniform), ALL (broadcast small dims)

-- SORTKEY: pre-sort rows on disk (like a clustered index)
CREATE TABLE events (
  event_id   BIGINT,
  event_date DATE    ENCODE az64,
  user_id    INT
)
SORTKEY(event_date);  -- queries: WHERE event_date BETWEEN ... are extremely fast

-- Compound SORTKEY:  most queries use user_id first, then created_at
COMPOUND SORTKEY(user_id, created_at)

-- INTERLEAVED SORTKEY: balanced for queries using any combination of columns
INTERLEAVED SORTKEY(user_id, product_id, event_date)
-- Trade-off: slower VACUUM, slower loads — use for read-heavy analytical tables`} />
    </div>
  );
}

function TopicPartition() {
  return (
    <div>
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">🗂️ PARTITION BY Design Patterns</h2>
      <p className="text-muted text-sm mb-5">Storage partitioning (not the window function) is how DE pipelines scale to petabytes. Partition pruning = the difference between 100TB scans and 10MB scans.</p>

      <Tip>Note: &quot;PARTITION BY&quot; in window functions (ROW_NUMBER OVER PARTITION BY dept) groups rows for calculation. Here we cover storage-level table partitioning that splits data across separate physical segments.</Tip>

      <H3>Why Partition — Benefits</H3>
      <DataTable
        headers={['Benefit', 'How It Works']}
        rows={[
          ['Partition pruning', 'Query engine skips irrelevant partitions — 1 month of data from a 5-year table'],
          ['Cheap deletes', 'DROP PARTITION is instant vs DELETE which scans all rows'],
          ['Parallel processing', 'Spark/Glue processes each partition independently'],
          ['Data lifecycle management', 'Archive/expire old partitions cheaply with ALTER TABLE DROP PARTITION'],
          ['Incremental loads', 'Append new partition daily without touching old ones'],
        ]}
      />

      <H3>PostgreSQL — Range Partitioning</H3>
      <CodeBlock code={`-- Declare parent partitioned table
CREATE TABLE orders (
  order_id   BIGINT,
  user_id    INT,
  order_date DATE NOT NULL,
  amount     DECIMAL
) PARTITION BY RANGE(order_date);

-- Create yearly child partitions
CREATE TABLE orders_2024 PARTITION OF orders
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE orders_2025 PARTITION OF orders
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Default partition catches out-of-range rows
CREATE TABLE orders_default PARTITION OF orders DEFAULT;

-- Query automatically prunes to orders_2025:
EXPLAIN SELECT * FROM orders WHERE order_date >= '2025-03-01';
-- Shows: Seq Scan on orders_2025 (orders_2024 pruned away)`} />

      <H3>Hive-Style Partitioning on S3 (Athena / Glue)</H3>
      <CodeBlock code={`-- S3 directory structure acts as virtual partitions:
s3://my-bucket/events/
  year=2025/
    month=03/
      day=15/
        part-00000.parquet
        part-00001.parquet

-- Athena CREATE TABLE — partition column SEPARATE from data schema
CREATE EXTERNAL TABLE events (
  event_id   BIGINT,
  user_id    INT,
  event_type STRING
)
PARTITIONED BY (year STRING, month STRING, day STRING)
STORED AS PARQUET
LOCATION 's3://my-bucket/events/';

-- Athena: register new partitions
MSCK REPAIR TABLE events;    -- scans S3, adds all missing partitions (slow for large tables)
-- Or: add partitions individually (faster for new data):
ALTER TABLE events ADD PARTITION (year='2025', month='03', day='15')
  LOCATION 's3://my-bucket/events/year=2025/month=03/day=15/';

-- Query WITH partition pruning (scans only day=15 data):
SELECT * FROM events WHERE year='2025' AND month='03' AND day='15';
-- Query WITHOUT partition pruning (FULL TABLE SCAN = expensive!):
SELECT * FROM events WHERE event_type = 'click';  -- never filter on non-partition col alone`} />
      <Warn>Not filtering on partition columns in Athena causes a full table scan — you get charged for EVERY byte read. Always include year, month, day in WHERE clause, or at minimum use WHERE year= and month= for monthly analysis.</Warn>

      <H3>BigQuery — Native Partitioning + Clustering</H3>
      <CodeBlock code={`-- DATE partitioned (auto-creates daily partitions)
CREATE OR REPLACE TABLE project.dataset.events
PARTITION BY DATE(event_time)
CLUSTER BY user_id, event_type   -- further sorting within partitions
AS SELECT * FROM staging.events;

-- Partition expiry (auto-delete old data)
ALTER TABLE project.dataset.events
SET OPTIONS(partition_expiration_days = 365);

-- Query with partition filter:
SELECT * FROM project.dataset.events
WHERE DATE(event_time) = '2025-03-15'   -- partition pruned
  AND user_id = 12345;                  -- cluster benefit`} />

      <H3>Spark / Delta Lake Partitioning</H3>
      <CodeBlock code={`# Write partitioned data with PySpark
df.write.partitionBy("year", "month", "day") \
  .format("parquet") \
  .mode("overwrite") \
  .save("s3://my-bucket/events/")

# Delta Lake: partition + Z-order (like clustering within partition)
df.write.format("delta") \
  .partitionBy("date") \
  .save("s3://my-bucket/delta/events/")

# Optimize with Z-ordering for multi-column queries within partitions
from delta.tables import DeltaTable
delta = DeltaTable.forPath(spark, "s3://my-bucket/delta/events/")
delta.optimize().where("date='2025-03-15'").executeZOrderBy("user_id", "product_id")`} />

      <H3>Anti-Patterns</H3>
      <DataTable
        headers={['Anti-Pattern', 'Problem', 'Fix']}
        rows={[
          ['Partitioning on user_id', 'Millions of tiny partitions — metadata OOM in Glue/Hive', 'Partition by date; sort/cluster by user_id'],
          ['Too many tiny partitions', 'Listing overhead, planner confusion, slow metadata ops', 'Coalesce small partitions; batch hour-level into day-level'],
          ['No partition column in WHERE', 'Full table scan in Athena — expensive', 'Always filter on partition columns for analytical queries'],
          ['Overwriting old partitions on reprocess', 'Risk of data loss if job fails mid-write', 'Use atomic partition swap: write to temp prefix, then MSCK REPAIR'],
          ['Heavily skewed partitions', 'One partition 100x larger than others — Spark OOM', 'Add secondary partition or use salting technique'],
        ]}
      />
    </div>
  );
}

function TopicMerge() {
  return (
    <div>
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">🔄 MERGE / UPSERT & SCD Type 1/2</h2>
      <p className="text-muted text-sm mb-5">Slowly Changing Dimensions are fundamental to dimensional modeling. SCD types are asked in every DE and analytics engineering interview.</p>

      <H3>SCD Types Overview</H3>
      <DataTable
        headers={['Type', 'What Happens to Old Value', 'History Preserved', 'Complexity']}
        rows={[
          ['Type 0', 'Never changes — fixed', 'N/A', 'None — append-only reference'],
          ['Type 1', 'Overwrite in place — old value lost', 'No', 'Simple UPDATE or UPSERT'],
          ['Type 2', 'New row added, old row expired', 'Full history', 'is_current + effective/expiry dates'],
          ['Type 3', 'Previous value in separate column (prev_city)', 'One level only', 'Extra prev_* columns'],
          ['Type 4', 'Separate history table', 'Full, in separate table', 'Complex, keeps dim clean'],
          ['Type 6', 'Hybrid Type 1+2+3', 'Full + current denorm', 'Most complex, used in Kimball DWH'],
        ]}
      />

      <H3>SCD Type 1 — Overwrite (UPSERT)</H3>
      <CodeBlock code={`-- PostgreSQL: INSERT ... ON CONFLICT DO UPDATE
INSERT INTO dim_customer (customer_id, name, city, updated_at)
VALUES (123, 'Alice', 'NYC', NOW())
ON CONFLICT (customer_id)
DO UPDATE SET
  name       = EXCLUDED.name,
  city       = EXCLUDED.city,
  updated_at = EXCLUDED.updated_at;

-- Redshift: no ON CONFLICT — use DELETE + INSERT in transaction
BEGIN;
DELETE FROM dim_customer WHERE customer_id IN (SELECT customer_id FROM staging_customer);
INSERT INTO dim_customer SELECT * FROM staging_customer;
COMMIT;

-- BigQuery: MERGE (most modern approach)
MERGE INTO dim_customer AS tgt
USING staging_customer AS src
ON tgt.customer_id = src.customer_id
WHEN MATCHED THEN
  UPDATE SET tgt.city = src.city, tgt.updated_at = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN
  INSERT (customer_id, name, city, updated_at) VALUES(src.customer_id, src.name, src.city, CURRENT_TIMESTAMP);`} />

      <H3>SCD Type 2 — Full History</H3>
      <CodeBlock code={`-- Dim table design for SCD Type 2:
CREATE TABLE dim_customer (
  surrogate_key  SERIAL PRIMARY KEY,     -- never use natural key as PK in Type 2
  customer_id    INT      NOT NULL,       -- natural/business key (NOT unique)
  name           VARCHAR,
  city           VARCHAR,
  is_current     BOOLEAN  DEFAULT TRUE,
  effective_date DATE     DEFAULT CURRENT_DATE,
  expiry_date    DATE     DEFAULT '9999-12-31'
);

-- Step 1: Expire changed rows (set is_current=FALSE)
UPDATE dim_customer
SET
  is_current   = FALSE,
  expiry_date  = CURRENT_DATE - 1
WHERE customer_id IN (
  SELECT s.customer_id
  FROM staging s
  JOIN dim_customer d ON s.customer_id = d.customer_id AND d.is_current = TRUE
  WHERE s.city != d.city              -- only expire rows where value actually changed
);

-- Step 2: Insert new current rows
INSERT INTO dim_customer (customer_id, name, city, is_current, effective_date, expiry_date)
SELECT s.customer_id, s.name, s.city, TRUE, CURRENT_DATE, '9999-12-31'
FROM staging s
LEFT JOIN dim_customer d ON s.customer_id = d.customer_id AND d.is_current = TRUE
WHERE d.customer_id IS NULL          -- brand new customer
   OR s.city != d.city;              -- changed customer (new version)`} />

      <Tip>SCD Type 2 always requires expiry_date on the old record to be set to effective_date - 1 day (so there&apos;s no overlap). The convention uses &apos;9999-12-31&apos; as the open-ended expiry for current rows — enables date-range joins like WHERE effective_date &lt;= target_date AND expiry_date &gt;= target_date.</Tip>

      <H3>Delta Lake MERGE API (Common at FAANG)</H3>
      <CodeBlock code={`# PySpark — DeltaTable.merge() — most used in FAANG DE pipelines
from delta.tables import DeltaTable

dim_table = DeltaTable.forPath(spark, 's3://warehouse/dim_customer/')

(dim_table.alias('tgt')
  .merge(
    staging_df.alias('src'),
    'tgt.customer_id = src.customer_id AND tgt.is_current = true'
  )
  .whenMatchedUpdate(
    condition = 'src.city != tgt.city',
    set = {
      'is_current':   'false',
      'expiry_date':  'date_sub(current_date(), 1)',
    }
  )
  .whenNotMatchedInsert(
    values = {
      'customer_id':    'src.customer_id',
      'name':           'src.name',
      'city':           'src.city',
      'is_current':     'true',
      'effective_date': 'current_date()',
      'expiry_date':    "'9999-12-31'",
    }
  )
  .execute()
)

# Note: Delta MERGE doesn't handle the "expire old + insert new" in one pass
# You need two passes: 1) expire changed rows, 2) insert new versions
# Or use a two-action MERGE with a helper source`} />

      <H3>SCD Type 2 Querying — Point-in-Time Lookup</H3>
      <CodeBlock code={`-- Get customer's city as it was on 2024-06-01
SELECT customer_id, name, city
FROM dim_customer
WHERE customer_id = 123
  AND effective_date <= '2024-06-01'
  AND expiry_date    >= '2024-06-01';

-- Join fact table to dim at correct point in time
SELECT f.order_id, f.order_date, d.city AS city_at_order_time
FROM fact_orders f
JOIN dim_customer d
  ON f.customer_id = d.customer_id
  AND f.order_date BETWEEN d.effective_date AND d.expiry_date;`} />
      <Warn>SCD Type 2 queries are slow unless indexed. Add an index on (customer_id, is_current) for current-row lookups, and (customer_id, effective_date, expiry_date) for point-in-time joins.</Warn>
    </div>
  );
}

function TopicDEQueries() {
  return (
    <div>
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">🎯 Retention Cohorts, Funnel Analysis & DAU/MAU</h2>
      <p className="text-muted text-sm mb-5">The analytical SQL patterns asked in every FAANG DE / Analytics Engineering interview. Know these cold — including edge cases.</p>

      <H3>30-Day User Retention</H3>
      <CodeBlock code={`-- Q: % of users who signed up each week and returned on day 30

WITH cohort AS (
  -- First activity = cohort start date
  SELECT
    user_id,
    DATE_TRUNC('week', MIN(event_time)) AS cohort_week
  FROM events
  GROUP BY user_id
),
retained AS (
  -- Users who had any event exactly on day 30 (narrow: same day)
  SELECT DISTINCT c.user_id, c.cohort_week
  FROM cohort c
  JOIN events e
    ON c.user_id = e.user_id
    AND DATE(e.event_time) = DATE(c.cohort_week + INTERVAL '30 days')
)
SELECT
  c.cohort_week,
  COUNT(DISTINCT c.user_id)                                          AS cohort_size,
  COUNT(DISTINCT r.user_id)                                          AS retained,
  ROUND(100.0 * COUNT(DISTINCT r.user_id)
    / NULLIF(COUNT(DISTINCT c.user_id), 0), 1)                       AS retention_pct
FROM cohort c
LEFT JOIN retained r USING(user_id)
GROUP BY c.cohort_week
ORDER BY cohort_week;`} />
      <Tip>Common follow-up: &quot;What if the retention window should be &apos;any activity between day 28 and 32&apos;?&quot; — change the JOIN to: AND DATE(e.event_time) BETWEEN cohort_week + 28 AND cohort_week + 32. This is called &quot;bounded retention&quot; vs &quot;exact day retention&quot;.</Tip>

      <H3>Rolling N-Day Retention</H3>
      <CodeBlock code={`WITH first_day AS (
  SELECT user_id, MIN(DATE(event_time)) AS day0 FROM events GROUP BY user_id
),
day_n AS (
  SELECT DISTINCT e.user_id
  FROM events e
  JOIN first_day f ON e.user_id = f.user_id
  WHERE DATE(e.event_time) >= f.day0 + INTERVAL '30 days'   -- active after day 30
    AND DATE(e.event_time) <  f.day0 + INTERVAL '37 days'   -- within a 7-day window
)
SELECT
  COUNT(DISTINCT f.user_id)                                      AS total_users,
  COUNT(DISTINCT d.user_id)                                      AS day30_retained,
  ROUND(100.0 * COUNT(DISTINCT d.user_id) / COUNT(DISTINCT f.user_id), 1) AS retention_pct
FROM first_day f
LEFT JOIN day_n d USING(user_id);`} />

      <H3>Funnel Analysis with Conversion Rates</H3>
      <CodeBlock code={`-- Step-by-step funnel: view → cart → checkout → purchase
WITH funnel AS (
  SELECT
    COUNT(DISTINCT CASE WHEN step = 'product_view' THEN user_id END) AS p1_view,
    COUNT(DISTINCT CASE WHEN step = 'add_to_cart'  THEN user_id END) AS p2_cart,
    COUNT(DISTINCT CASE WHEN step = 'checkout'     THEN user_id END) AS p3_checkout,
    COUNT(DISTINCT CASE WHEN step = 'purchase'     THEN user_id END) AS p4_purchase
  FROM funnel_events
  WHERE event_date >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT
  p1_view,
  p2_cart,
    ROUND(100.0 * p2_cart     / NULLIF(p1_view, 0), 1)    AS view_to_cart_pct,
  p3_checkout,
    ROUND(100.0 * p3_checkout / NULLIF(p2_cart, 0), 1)    AS cart_to_checkout_pct,
  p4_purchase,
    ROUND(100.0 * p4_purchase / NULLIF(p3_checkout, 0), 1) AS checkout_to_purchase_pct,
  ROUND(100.0 * p4_purchase   / NULLIF(p1_view, 0), 1)    AS overall_conversion_pct
FROM funnel;`} />

      <H3>DAU / WAU / MAU — Stickiness</H3>
      <CodeBlock code={`WITH dau AS (
  SELECT DATE(event_time) AS dt, COUNT(DISTINCT user_id) AS dau
  FROM events GROUP BY 1
),
mau AS (
  SELECT DATE_TRUNC('month', event_time) AS month, COUNT(DISTINCT user_id) AS mau
  FROM events GROUP BY 1
),
wau AS (
  SELECT DATE_TRUNC('week', event_time) AS week, COUNT(DISTINCT user_id) AS wau
  FROM events GROUP BY 1
)
SELECT
  d.dt,
  d.dau,
  w.wau,
  m.mau,
  ROUND(100.0 * d.dau / NULLIF(m.mau, 0), 1) AS dau_mau_ratio,  -- stickiness
  ROUND(100.0 * d.dau / NULLIF(w.wau, 0), 1) AS dau_wau_ratio
FROM dau d
JOIN mau m ON DATE_TRUNC('month', d.dt) = m.month
JOIN wau w ON DATE_TRUNC('week',  d.dt) = w.week
ORDER BY d.dt;`} />
      <Tip>DAU/MAU ratio (stickiness) &gt; 20% is considered good for consumer apps. Facebook achieved ~60%. This ratio indicates how often monthly users actually return daily — a key product health metric.</Tip>

      <H3>Longest Consecutive Login Streak</H3>
      <CodeBlock code={`-- The date-minus-row-number trick: consecutive dates get the same grp value
WITH user_dates AS (
  SELECT DISTINCT user_id, DATE(event_time) AS login_date FROM events
),
with_group AS (
  SELECT
    user_id,
    login_date,
    -- Subtracting row_number from a date gives a constant for consecutive days
    login_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date)::int)
      AS grp
  FROM user_dates
),
streaks AS (
  SELECT user_id, grp, COUNT(*) AS streak_len
  FROM with_group GROUP BY user_id, grp
)
SELECT user_id, MAX(streak_len) AS longest_streak
FROM streaks
GROUP BY user_id
ORDER BY longest_streak DESC;`} />
      <Tip>The date-minus-row-number trick is a classic SQL interview pattern. Consecutive dates form the same (date - rownum) group because both values increment by 1 together. Memorize this — it appears in StrataScratch, LeetCode Hard SQL, and real FAANG interviews.</Tip>

      <H3>Month-over-Month Retained Users</H3>
      <CodeBlock code={`-- Users who were active in BOTH this month AND previous month
WITH monthly_active AS (
  SELECT DISTINCT user_id, DATE_TRUNC('month', event_time) AS month
  FROM events
)
SELECT
  a.month,
  COUNT(DISTINCT a.user_id)  AS current_mau,
  COUNT(DISTINCT b.user_id)  AS retained_from_prior_month,
  ROUND(100.0 * COUNT(DISTINCT b.user_id)
    / NULLIF(COUNT(DISTINCT prev.user_id), 0), 1) AS mom_retention_pct
FROM monthly_active a
LEFT JOIN monthly_active b
  ON a.user_id = b.user_id
  AND b.month = a.month - INTERVAL '1 month'
LEFT JOIN monthly_active prev ON prev.month = a.month - INTERVAL '1 month'
GROUP BY a.month
ORDER BY a.month;`} />

      <InterviewBox q="How would you build a user engagement score using SQL?">
        <CodeBlock code={`-- Composite engagement score: recency + frequency + events
WITH user_metrics AS (
  SELECT
    user_id,
    COUNT(DISTINCT DATE(event_time))             AS days_active_30d,
    COUNT(*)                                     AS total_events_30d,
    MAX(event_time)                              AS last_seen,
    CURRENT_DATE - DATE(MAX(event_time))         AS days_since_last_activity
  FROM events
  WHERE event_time >= CURRENT_DATE - 30
  GROUP BY user_id
),
scored AS (
  SELECT *,
    -- Recency score: 0..40 (more recent = higher)
    40 - LEAST(days_since_last_activity * 2, 40) AS recency_score,
    -- Frequency score: 0..35 (more days active = higher)
    LEAST(days_active_30d * 5, 35)               AS frequency_score,
    -- Volume score: 0..25
    LEAST(total_events_30d / 10, 25)             AS volume_score
  FROM user_metrics
)
SELECT user_id, recency_score + frequency_score + volume_score AS engagement_score
FROM scored ORDER BY engagement_score DESC;`} />
      </InterviewBox>
    </div>
  );
}

// ── Content registry ───────────────────────────────────────────────────────────

const CONTENT: Record<TopicId, () => React.ReactElement> = {
  'cheatsheet':     Cheatsheet,
  'row-rank':       TopicRowRank,
  'lag-lead':       TopicLagLead,
  'running-totals': TopicRunningTotals,
  'cte':            TopicCTE,
  'explain':        TopicExplain,
  'indexes':        TopicIndexes,
  'partition':      TopicPartition,
  'merge':          TopicMerge,
  'de-queries':     TopicDEQueries,
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SQLMasteryPage() {
  const [activeTopic, setActiveTopic] = useState<TopicId>('cheatsheet');

  const grouped = GROUPS.map(g => ({
    name: g,
    items: NAV.filter(n => n.group === g),
  }));

  const ActiveContent = CONTENT[activeTopic];

  return (
    <PageContainer title="SQL Mastery" description="Window Functions · CTEs · Query Optimization · DE Interview Patterns">
      <div className="flex gap-6">

        {/* ── LEFT NAV PANE ─────────────────────────────────────────────── */}
        <div className="w-56 flex-shrink-0 space-y-5">

          {/* Cheat Sheet — highlighted special tab */}
          <button
            onClick={() => setActiveTopic('cheatsheet')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-sm font-bold ${
              activeTopic === 'cheatsheet'
                ? 'bg-[#00ff8825] border border-[#00ff8860] text-[#00ff88]'
                : 'bg-[#0a1f14] border border-[#00ff8825] text-[#4ade80] hover:border-[#00ff8850] hover:bg-[#0d2518]'
            }`}
          >
            <span>📋</span>
            <span>Cheat Sheet</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[#00ff8820] text-[#00ff88] font-normal">Quick</span>
          </button>

          {/* Grouped topic sections */}
          {grouped.map(group => (
            <div key={group.name}>
              <p className="text-[9px] uppercase tracking-widest text-muted px-1 mb-1.5 font-bold">{group.name}</p>
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTopic(item.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-all ${
                      activeTopic === item.id
                        ? 'bg-[#00d4ff18] border border-[#00d4ff40] text-[#00d4ff] font-semibold text-xs'
                        : 'text-neutral-400 hover:text-foreground hover:bg-neutral-800 text-xs'
                    }`}
                  >
                    <span className="flex-shrink-0 w-4">{item.icon}</span>
                    <span className="leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Progress tracker */}
          <div className="pt-4 border-t border-neutral-800">
            <p className="text-[9px] uppercase tracking-widest text-muted mb-2 font-bold">Topics</p>
            <p className="text-xs text-neutral-500">{NAV.filter(n => n.group !== null).length} subtopics + cheat sheet</p>
          </div>
        </div>

        {/* ── RIGHT CONTENT PANE ──────────────────────────────────────────── */}
        <motion.div
          key={activeTopic}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
          className="flex-1 min-w-0"
        >
          <GlassCard>
            <ActiveContent />
          </GlassCard>
        </motion.div>

      </div>
    </PageContainer>
  );
}
