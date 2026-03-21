'use client';

import { useState } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { PageContainer, GlassCard } from '@/components/ui/components';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Filter, Code2, HelpCircle, BookOpen, X, Copy, Check, Zap, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Per-topic enrichment: code examples + interview Q&A ─── */
interface LeetCodeProblem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  hint: string;
}
interface TopicDetail {
  codeExamples: { label: string; lang: string; code: string }[];
  interviewQA: { q: string; a: string }[];
  cheatSheet: { key: string; value: string }[];
  leetcodeProblems?: LeetCodeProblem[];
}

const TOPIC_DETAILS: Record<string, TopicDetail> = {
  'sql-mastery': {
    codeExamples: [
      {
        label: 'Window Functions — Retention & Deduplication',
        lang: 'sql',
        code: `-- Day-30 Retention (always LEFT JOIN to keep non-retained users)
WITH cohort AS (
  SELECT user_id, MIN(DATE(event_at)) AS cohort_day
  FROM events GROUP BY user_id
),
retained AS (
  SELECT DISTINCT e.user_id
  FROM events e
  JOIN cohort c ON e.user_id = c.user_id
  WHERE DATE(e.event_at) = c.cohort_day + INTERVAL '30 days'
)
SELECT c.cohort_day,
       COUNT(DISTINCT c.user_id)  AS cohort_size,
       COUNT(DISTINCT r.user_id)  AS retained_30d,
       ROUND(COUNT(DISTINCT r.user_id) * 100.0
             / COUNT(DISTINCT c.user_id), 2) AS retention_pct
FROM cohort c
LEFT JOIN retained r ON c.user_id = r.user_id
GROUP BY 1 ORDER BY 1;

-- Deduplication (keep latest row per user)
WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY user_id ORDER BY updated_at DESC
  ) AS rn
  FROM user_events
)
SELECT * FROM ranked WHERE rn = 1;`,
      },
      {
        label: 'Running 7-Day Rolling Average',
        lang: 'sql',
        code: `SELECT
  date,
  daily_revenue,
  AVG(daily_revenue) OVER (
    ORDER BY date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) AS rolling_7d_avg,
  SUM(daily_revenue) OVER (
    ORDER BY date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS cumulative_revenue
FROM daily_metrics
ORDER BY date;`,
      },
      {
        label: 'Funnel Analysis',
        lang: 'sql',
        code: `SELECT
  COUNT(DISTINCT user_id) AS step1_view,
  COUNT(DISTINCT CASE WHEN action='add_to_cart' THEN user_id END) AS step2_cart,
  COUNT(DISTINCT CASE WHEN action='checkout'    THEN user_id END) AS step3_checkout,
  COUNT(DISTINCT CASE WHEN action='purchase'    THEN user_id END) AS step4_purchase,
  ROUND(
    COUNT(DISTINCT CASE WHEN action='purchase' THEN user_id END) * 100.0
    / NULLIF(COUNT(DISTINCT user_id), 0), 2
  ) AS overall_conversion_pct
FROM events
WHERE event_date >= CURRENT_DATE - 30;`,
      },
    ],
    interviewQA: [
      { q: 'What is the difference between ROW_NUMBER, RANK, and DENSE_RANK?', a: 'ROW_NUMBER always assigns unique sequential numbers (1,2,3). RANK gives the same rank to ties but skips numbers (1,1,3). DENSE_RANK has no gaps (1,1,2). Use DENSE_RANK for top-N-per-group; ROW_NUMBER for deduplication where you need exactly one row per partition.' },
      { q: 'How do you calculate Day-30 retention without over-counting?', a: 'Use a LEFT JOIN (not INNER JOIN) from the cohort table to retained events on exactly day+30. INNER JOIN silently drops non-retained users and inflates your retention rate. Always count DISTINCT user_ids, not rows.' },
      { q: 'What is the difference between ROWS BETWEEN and RANGE BETWEEN in window functions?', a: 'ROWS BETWEEN counts physical rows (exact). RANGE BETWEEN groups tied ORDER BY values — RANGE CURRENT ROW includes ALL rows with the same ORDER BY value as a single "current" group. For time-series calculations always use ROWS — it is more predictable.' },
      { q: 'How would you compute the median without a built-in MEDIAN function?', a: 'Use PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY col) if available. Otherwise: assign ROW_NUMBER ascending and descending, then SELECT the row(s) where both row numbers are equal (odd count) or differ by 1 (even count) and average them.' },
      { q: 'How do you find the Nth highest salary in SQL?', a: 'Use DENSE_RANK: WITH ranked AS (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rk FROM employees) SELECT salary FROM ranked WHERE rk = N. Never use LIMIT N OFFSET N-1 — it breaks on ties and is not portable.' },
      { q: 'What is a correlated subquery and why can it be slow?', a: 'A correlated subquery references a column from the outer query, so it re-executes once per outer row — O(n) inner queries. Always rewrite as a JOIN or CTE. EXPLAIN will show a Nested Loop with a high row estimate for the inner node.' },
      { q: 'How do you write a query for the longest consecutive login streak?', a: 'Subtract ROW_NUMBER() from the date — rows with consecutive dates get the same constant value. Then GROUP BY user_id, that constant and COUNT(*) gives the streak length. Example: DATE(login_at) - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY DATE(login_at)) AS grp.' },
      { q: 'What is the difference between a CTE and a temp table?', a: 'CTEs are inline, readable, and in PostgreSQL 12+ the optimiser inlines them like subqueries. Temp tables materialise on disk with their own statistics and can be indexed — use them when you reference a large intermediate result 3+ times or need an index on an intermediate column.' },
      { q: 'What does EXPLAIN ANALYZE tell you and how do you use it?', a: 'EXPLAIN (ANALYZE, BUFFERS) shows actual vs estimated row counts, execution time per node, and buffer hits. A Seq Scan on a large table means a missing index. Mismatch between rows= estimate and actual rows means stale statistics — fix with ANALYZE tablename.' },
      { q: 'What is SCD Type 2 and how would you implement it?', a: 'SCD Type 2 tracks history: when a dimension attribute changes, expire the old row (set is_current=false, expiry_date=today) and insert a new row with is_current=true. Use a MERGE statement for upserts. Always add a composite index on (entity_id, is_current) to avoid full scans when looking up the current record.' },
    ],
    cheatSheet: [
      { key: 'ROW_NUMBER()', value: 'Unique sequential — use for deduplication' },
      { key: 'DENSE_RANK()', value: 'No gaps after ties — use for top-N classification' },
      { key: 'LAG(col, n, default)', value: 'Previous row value — use for day-over-day change' },
      { key: 'ROWS BETWEEN 6 PRECEDING…', value: '7-day rolling window' },
      { key: 'LEFT JOIN for retention', value: 'INNER JOIN silently drops non-retained users' },
      { key: 'DATE_TRUNC(\'month\', ts)', value: 'Used for cohort grouping' },
    ],
    leetcodeProblems: [
      /* ── FAANG / Hard Must-Know ─────────────────────────────── */
      { id: 185, title: 'Department Top Three Salaries', difficulty: 'Hard', category: 'Window Functions', hint: 'DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) — keep rank ≤ 3' },
      { id: 262, title: 'Trips and Users', difficulty: 'Hard', category: 'Aggregation', hint: 'Exclude banned users with NOT IN; rate = SUM(status!="completed")/COUNT(*), ROUND to 2 dp' },
      { id: 601, title: 'Human Traffic of Stadium', difficulty: 'Hard', category: 'Window Functions', hint: 'id − ROW_NUMBER() trick gives same constant for consecutive rows; filter people ≥ 100' },
      { id: 615, title: 'Average Salary Departments VS Company', difficulty: 'Hard', category: 'Aggregation', hint: 'Compare dept monthly avg vs global monthly avg; CASE WHEN → Higher/Lower/Same' },
      { id: 569, title: 'Median Employee Salary', difficulty: 'Hard', category: 'Window Functions', hint: 'ROW_NUMBER() ASC & DESC per dept; median rows where |asc_rn − desc_rn| ≤ 1' },
      { id: 571, title: 'Find Median Given Frequency of Numbers', difficulty: 'Hard', category: 'Window Functions', hint: 'Cumulative freq ≥ total/2 AND cum_freq − freq < total/2 — identifies the median bucket' },
      { id: 579, title: 'Find Cumulative Salary of an Employee', difficulty: 'Hard', category: 'Window Functions', hint: 'SUM 3-month sliding window with LAG; exclude the max month per employee (ongoing month)' },
      { id: 1336, title: 'Number of Transactions per Visit', difficulty: 'Hard', category: 'CTEs', hint: 'Recursive CTE 0..MAX to generate all counts; LEFT JOIN actual transaction counts per visit' },
      { id: 1767, title: 'Find the Subtasks That Did Not Execute', difficulty: 'Hard', category: 'CTEs', hint: 'Recursive CTE generates subtask_id 1..n for each task; LEFT JOIN executed table, keep NULL' },
      { id: 1097, title: 'Game Play Analysis V', difficulty: 'Hard', category: 'Window Functions', hint: 'LEAD(event_date,1) OVER PARTITION BY player; next_day = first_login + 1 → retained' },
      { id: 1225, title: 'Report Contiguous Dates', difficulty: 'Hard', category: 'CTEs', hint: 'UNION failed/succeeded with type label; date − ROW_NUMBER() = constant for consecutive same-type rows' },
      /* ── Window Functions ─────────────────────────────────────── */
      { id: 178, title: 'Rank Scores', difficulty: 'Medium', category: 'Window Functions', hint: 'DENSE_RANK() OVER (ORDER BY score DESC) — no gaps in ranking even on ties' },
      { id: 177, title: 'Nth Highest Salary', difficulty: 'Medium', category: 'Window Functions', hint: 'DENSE_RANK or SELECT DISTINCT salary ORDER BY DESC LIMIT 1 OFFSET N−1' },
      { id: 180, title: 'Consecutive Numbers', difficulty: 'Medium', category: 'Window Functions', hint: 'LAG(num) and LAG(num,2) — all three equal → consecutive; or id − ROW_NUMBER constant group' },
      { id: 1321, title: 'Restaurant Growth', difficulty: 'Medium', category: 'Window Functions', hint: 'SUM(amount) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) — skip first 6 days' },
      { id: 1204, title: 'Last Person to Fit in the Bus', difficulty: 'Medium', category: 'Window Functions', hint: 'SUM(weight) OVER (ORDER BY turn) running total; last row where cumulative ≤ 1000' },
      { id: 550, title: 'Game Play Analysis IV', difficulty: 'Medium', category: 'Window Functions', hint: 'First login per player; fraction who came back exactly on first_login + 1, ROUND 2 dp' },
      { id: 512, title: 'Game Play Analysis II', difficulty: 'Easy', category: 'Window Functions', hint: 'FIRST_VALUE(device_id) OVER (PARTITION BY player_id ORDER BY event_date ASC)' },
      { id: 1454, title: 'Active Users', difficulty: 'Medium', category: 'Window Functions', hint: 'DENSE_RANK per user; date − rank = same constant for consecutive login days — need 5' },
      { id: 1393, title: 'Capital Gain Loss', difficulty: 'Medium', category: 'Aggregation', hint: 'SUM(CASE WHEN operation="Sell" THEN price ELSE -price END) GROUP BY stock_name' },
      /* ── Aggregation & Grouping ──────────────────────────────── */
      { id: 182, title: 'Duplicate Emails', difficulty: 'Easy', category: 'Aggregation', hint: 'SELECT email FROM Person GROUP BY email HAVING COUNT(*) > 1' },
      { id: 570, title: 'Managers with at Least 5 Direct Reports', difficulty: 'Medium', category: 'Aggregation', hint: 'GROUP BY managerId HAVING COUNT(*) >= 5; JOIN Employees again to surface manager name' },
      { id: 596, title: 'Classes More Than 5 Students', difficulty: 'Easy', category: 'Aggregation', hint: 'SELECT class FROM Courses GROUP BY class HAVING COUNT(student) >= 5' },
      { id: 1633, title: 'Percentage of Users Attended a Contest', difficulty: 'Easy', category: 'Aggregation', hint: 'ROUND(COUNT(user_id) * 100 / total_users, 2); total via cross-joined subquery' },
      { id: 1934, title: 'Confirmation Rate', difficulty: 'Medium', category: 'Aggregation', hint: "ROUND(AVG(action='confirmed'), 2) — LEFT JOIN Signups to keep users with zero confirmations" },
      { id: 511, title: 'Game Play Analysis I', difficulty: 'Easy', category: 'Aggregation', hint: 'SELECT player_id, MIN(event_date) AS first_login FROM Activity GROUP BY player_id' },
      { id: 1693, title: 'Daily Leads and Partners', difficulty: 'Easy', category: 'Aggregation', hint: 'COUNT(DISTINCT lead_id), COUNT(DISTINCT partner_id) GROUP BY date_id, make_id' },
      { id: 1907, title: 'Count Salary Categories', difficulty: 'Medium', category: 'Aggregation', hint: 'UNION ALL three conditional COUNTs; cross join a category scaffold to preserve zero-count rows' },
      /* ── JOINs & Subqueries ──────────────────────────────────── */
      { id: 175, title: 'Combine Two Tables', difficulty: 'Easy', category: 'Joins', hint: 'LEFT JOIN Address ON Person.personId — NULL address columns when no matching row' },
      { id: 183, title: 'Customers Who Never Order', difficulty: 'Easy', category: 'Joins', hint: 'LEFT JOIN Orders WHERE Orders.customerId IS NULL — or NOT IN subquery' },
      { id: 181, title: 'Employees Earning More Than Their Managers', difficulty: 'Easy', category: 'Joins', hint: 'Self-join: e1 JOIN e2 ON e1.managerId=e2.id WHERE e1.salary > e2.salary' },
      { id: 197, title: 'Rising Temperature', difficulty: 'Easy', category: 'Joins', hint: 'Self-join WHERE DATEDIFF(w2.recordDate, w1.recordDate)=1 AND w2.temperature > w1.temperature' },
      { id: 626, title: 'Exchange Seats', difficulty: 'Medium', category: 'Joins', hint: 'CASE: odd id → id+1 (if not last), even id → id-1; swap adjacent seat pairs' },
      { id: 1045, title: 'Customers Who Bought All Products', difficulty: 'Medium', category: 'Joins', hint: 'GROUP BY customer_id HAVING COUNT(DISTINCT product_key) = (SELECT COUNT(*) FROM Product)' },
      { id: 196, title: 'Delete Duplicate Emails', difficulty: 'Easy', category: 'Joins', hint: 'DELETE p1 FROM Person p1 JOIN Person p2 ON p1.email=p2.email WHERE p1.id > p2.id' },
      { id: 1158, title: 'Market Analysis I', difficulty: 'Medium', category: 'Joins', hint: 'LEFT JOIN Orders (WHERE YEAR=2019) to Users; COUNT(order_id) AS orders_in_2019' },
      { id: 184, title: 'Department Highest Salary', difficulty: 'Medium', category: 'Joins', hint: 'JOIN to a (SELECT deptId, MAX(salary)) subquery — or DENSE_RANK per dept, keep rk=1' },
      { id: 1965, title: 'Employees With Missing Information', difficulty: 'Easy', category: 'Joins', hint: 'UNION two NOT IN queries: missing in Salaries + missing in Employees; ORDER BY id' },
      /* ── String & Date ───────────────────────────────────────── */
      { id: 1667, title: 'Fix Names in a Table', difficulty: 'Easy', category: 'String', hint: 'CONCAT(UPPER(LEFT(name,1)), LOWER(SUBSTRING(name,2))) AS name — ORDER BY user_id' },
      { id: 1527, title: 'Patients With a Condition', difficulty: 'Easy', category: 'String', hint: "LIKE 'DIAB1%' OR LIKE '% DIAB1%' — space prefix catches a condition in the middle" },
      { id: 1890, title: 'The Latest Login in 2020', difficulty: 'Easy', category: 'Date', hint: 'MAX(time_stamp) GROUP BY user_id WHERE YEAR(time_stamp)=2020' },
      { id: 1141, title: 'User Activity for the Past 30 Days I', difficulty: 'Easy', category: 'Date', hint: 'WHERE activity_date BETWEEN X−29 AND X; COUNT(DISTINCT user_id) GROUP BY activity_date' },
    ],
  },
  'python-data': {
    codeExamples: [
      {
        label: 'Paginated API → Parquet → S3 (Production ETL)',
        lang: 'python',
        code: `import requests, boto3, logging
import pandas as pd
from io import BytesIO
from tenacity import retry, stop_after_attempt, wait_exponential

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=30))
def fetch_page(url, params):
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    return r.json()

def extract_all(base_url, api_key, date):
    records, cursor = [], None
    while True:
        params = {"api_key": api_key, "date": date, "cursor": cursor}
        data = fetch_page(base_url, params)
        records.extend(data["items"])
        log.info(f"Fetched {len(records)} records so far")
        cursor = data.get("next_cursor")
        if not cursor:
            break
    return pd.DataFrame(records)

def load_to_s3(df, bucket, key):
    buf = BytesIO()
    df.to_parquet(buf, index=False, engine="pyarrow")
    buf.seek(0)
    boto3.client("s3").put_object(Bucket=bucket, Key=key, Body=buf.getvalue())
    log.info(f"Uploaded {len(df)} rows to s3://{bucket}/{key}")

if __name__ == "__main__":
    date = "2025-03-19"
    df = extract_all("https://api.example.com/events", "SECRET", date)
    df["ingested_at"] = pd.Timestamp.utcnow()
    load_to_s3(df, "my-data-lake", f"bronze/events/date={date}/data.parquet")`,
      },
      {
        label: 'Chunked CSV Processing (RAM-efficient)',
        lang: 'python',
        code: `import pandas as pd

processed_rows = 0
chunks = []

for chunk in pd.read_csv("large_file.csv", chunksize=100_000,
                          dtype={"user_id": "int64", "amount": "float32"}):
    # Vectorized filter — no Python loop
    chunk = chunk[chunk["amount"] > 0]
    chunk["date"] = pd.to_datetime(chunk["created_at"]).dt.date
    chunks.append(chunk)
    processed_rows += len(chunk)

df = pd.concat(chunks, ignore_index=True)
df.to_parquet("output.parquet", index=False)
print(f"Processed {processed_rows:,} rows")`,
      },
    ],
    interviewQA: [
      { q: 'How do you process a 50 GB CSV file in a Lambda with 512 MB memory?', a: 'Stream from S3 using pandas read_csv(chunksize=100_000) or smart_open for line-by-line reading with a generator. Process each chunk, write incremental Parquet output to S3. Never load the full file — Lambda caps at 512 MB–10 GB RAM.' },
      { q: 'What is the difference between apply() and vectorized Pandas operations?', a: 'apply(func, axis=1) iterates row-by-row in Python — O(n) Python function calls. Vectorized operations (df["col"] + 1, df.str.lower()) run in compiled C via NumPy — 100–1000× faster. Always prefer built-in Pandas/NumPy over apply() on large DataFrames.' },
      { q: 'How do you handle API rate limiting in a data pipeline?', a: 'Use exponential backoff with jitter: catch HTTP 429, wait 2^attempt + random(0,1) seconds, retry up to N times. The tenacity library provides @retry(stop=stop_after_attempt(5), wait=wait_exponential(min=2, max=60)). Track a request counter with time.sleep to proactively stay under rate limits.' },
      { q: 'What is the difference between pd.merge() and pd.concat()?', a: 'merge() performs SQL-style joins on key columns (left/right/inner/outer). concat() stacks DataFrames along an axis — either appending rows (axis=0) or columns (axis=1) without key-matching. Use concat for stacking same-schema tables, merge for joining on a key.' },
      { q: 'How do you read only specific columns from a large Parquet file?', a: 'pd.read_parquet(path, columns=["col1","col2"]) uses PyArrow column projection — reads only those column chunks from disk, skipping all others. Combined with filters=[("date","=","2025-01-01")] for predicate pushdown, you can scan a fraction of a TB-scale file.' },
      { q: 'How do you write a Python function that is safe to run multiple times without creating duplicates?', a: 'Make it idempotent: write to a deterministic partitioned S3 key (e.g., output/date=2025-01-01/), and use mode="overwrite" or DELETE+INSERT in the database before writing. Check for _SUCCESS marker files before re-running. Delta MERGE is the cleanest option for upsert idempotency.' },
      { q: 'What is the difference between a generator and a list comprehension?', a: 'A list comprehension materialises all results in memory immediately — O(n) memory. A generator (yield) produces one item at a time — O(1) memory regardless of dataset size. Use generators for streaming large files, lazy pipelines, and anywhere you process data one record at a time.' },
      { q: 'How do you profile slow Python code?', a: 'Use cProfile for function-level profiling: python -m cProfile -s cumulative script.py | head -20. Use line_profiler (@profile decorator) for line-by-line timing. For Pandas: df.memory_usage(deep=True) to spot object columns. For I/O-bound code, check if you are making sequential requests that could be parallelised with concurrent.futures.' },
      { q: 'How would you write a type-safe Python function for an ETL?', a: 'Use type hints and dataclasses for schema enforcement: @dataclass class Event: user_id: int; amount: float. Use pydantic for runtime validation at system boundaries (API responses, config files). For DataFrames, pandera provides schema-level assertions: pa.DataFrameSchema({"col": pa.Column(int, pa.Check.gt(0))}).validate(df).' },
      { q: 'What is the GIL in Python and does it affect data pipelines?', a: 'The Global Interpreter Lock (GIL) prevents true multi-threading for CPU-bound Python. For CPU-bound work (Pandas transforms, parsing), use multiprocessing.Pool — each process has its own GIL. For I/O-bound work (API calls, S3 reads), threading or asyncio work fine because the GIL is released during I/O waits.' },
    ],
    cheatSheet: [
      { key: 'pd.read_parquet(filters=...)', value: 'Predicate pushdown — reads only matching row groups' },
      { key: 'pd.read_csv(chunksize=N)', value: 'Process large files in N-row chunks without loading all into RAM' },
      { key: '@retry(stop=stop_after_attempt(3))', value: 'tenacity: auto-retry with exponential backoff' },
      { key: 'dtype={"col": "int32"}', value: 'Specify dtypes to prevent silent object-column inference' },
      { key: 'requests.Session()', value: 'Connection pooling for many sequential API calls' },
    ],
  },
  'apache-spark': {
    codeExamples: [
      {
        label: 'PySpark Performance Tuning — Broadcast Join + AQE',
        lang: 'python',
        code: `from pyspark.sql import SparkSession
from pyspark.sql.functions import broadcast, col, to_date

spark = (
    SparkSession.builder
    .appName("OptimizedETL")
    .config("spark.sql.adaptive.enabled", "true")           # AQE — auto-tune shuffle partitions
    .config("spark.sql.adaptive.coalescePartitions.enabled", "true")
    .config("spark.sql.autoBroadcastJoinThreshold", "50m")  # broadcast tables < 50 MB
    .config("spark.sql.shuffle.partitions", "200")          # starting point; AQE adjusts
    .getOrCreate()
)

# Read with partition pruning (filter on partition column)
events = (
    spark.read.parquet("s3://bucket/events/")
    .filter("event_date = '2025-03-19'")   # prunes all other S3 prefixes
    .select("user_id", "event_type", "amount")
)

# Small dim table — broadcast to avoid shuffle
users = spark.read.parquet("s3://bucket/users/")  # << 50 MB

# Broadcast join eliminates shuffle of 'events'
result = events.join(broadcast(users), "user_id") \\
    .groupBy("event_type", "country") \\
    .agg({"amount": "sum", "user_id": "count"}) \\
    .withColumnRenamed("sum(amount)", "total_revenue") \\
    .withColumnRenamed("count(user_id)", "event_count")

# Write partitioned Parquet (coalesce to avoid tiny files)
result.coalesce(10) \\
    .write.partitionBy("event_type") \\
    .mode("overwrite") \\
    .parquet("s3://bucket/output/daily_summary/")

spark.stop()`,
      },
      {
        label: 'Delta Lake MERGE (Upsert)',
        lang: 'python',
        code: `from delta.tables import DeltaTable
from pyspark.sql.functions import current_timestamp

# Target Delta table path
TARGET = "s3://bucket/delta/users/"

# Incoming changes (could be from CDC or Kafka)
updates_df = spark.read.parquet("s3://bucket/staging/user_updates/")

target = DeltaTable.forPath(spark, TARGET)

# MERGE — upsert: update existing, insert new
target.alias("t").merge(
    updates_df.alias("s"),
    "t.user_id = s.user_id"
).whenMatchedUpdate(set={
    "email":      "s.email",
    "name":       "s.name",
    "updated_at": "s.updated_at",
}).whenNotMatchedInsertAll().execute()

# OPTIMIZE + ZORDER for faster future queries
spark.sql(f"OPTIMIZE delta.\`{TARGET}\` ZORDER BY (user_id)")

# Time travel — query yesterday's snapshot
df_yesterday = (
    spark.read.format("delta")
    .option("versionAsOf", 5)
    .load(TARGET)
)`,
      },
      {
        label: 'Spark Structured Streaming (Kinesis → S3)',
        lang: 'python',
        code: `from pyspark.sql.functions import from_json, col, window
from pyspark.sql.types import StructType, StringType, LongType

schema = StructType() \\
    .add("user_id", LongType()) \\
    .add("event_type", StringType()) \\
    .add("ts", LongType())

# Read from Kinesis as a streaming source
raw = (
    spark.readStream
    .format("kinesis")
    .option("streamName", "user-events")
    .option("region", "us-east-1")
    .option("startingPosition", "LATEST")
    .load()
)

parsed = raw.select(
    from_json(col("data").cast("string"), schema).alias("d")
).select("d.*")

# Windowed aggregation — 1-min tumbling windows
agg = (
    parsed
    .withWatermark("ts", "5 minutes")  # handle up to 5-min late data
    .groupBy(window("ts", "1 minute"), "event_type")
    .count()
)

# Write micro-batches to S3 as Parquet
query = (
    agg.writeStream
    .outputMode("append")
    .format("parquet")
    .option("checkpointLocation", "s3://bucket/checkpoints/kinesis-agg/")
    .option("path", "s3://bucket/streaming/event_counts/")
    .trigger(processingTime="1 minute")
    .start()
)
query.awaitTermination()`,
      },
    ],
    interviewQA: [
      { q: 'What is the difference between repartition() and coalesce()?', a: 'repartition(N) does a full shuffle to exactly N evenly-sized partitions — use to increase count or fix skew. coalesce(N) merges adjacent partitions without a shuffle — only for decreasing count. coalesce is faster when reducing; repartition is required when increasing partition count.' },
      { q: 'When does Spark perform a shuffle and why is it expensive?', a: 'Shuffle happens on wide transformations: groupBy, join (except broadcast), repartition, distinct. Spark writes intermediate data to disk on each executor, then transfers it over the network to target executors. This disk I/O + network cost is 10–100× slower than narrow transformations and is the #1 Spark bottleneck.' },
      { q: 'How does AQE (Adaptive Query Execution) improve Spark jobs?', a: 'AQE (Spark 3+) re-plans stages at runtime using actual shuffle statistics. It auto-coalesces shuffle partitions (default 200 → actual needed), switches Sort-Merge Joins to Broadcast Joins when one side is small, and handles skew by splitting large partitions automatically.' },
      { q: 'How do you handle data skew in Spark joins?', a: 'Identify via Spark UI Tasks tab — one task runs 10× longer than the median. Fixes: (1) Broadcast join if the small table is under 50 MB. (2) Salting — add random 0–9 suffix to the skewed key, explode the small table by 0–9, join on composite key. (3) AQE: spark.sql.adaptive.skewJoin.enabled=true handles it automatically.' },
      { q: 'What is lazy evaluation in Spark and why does it matter?', a: 'Spark builds a DAG of transformations (map, filter, groupBy) without executing them. Execution only starts when an action is called (collect, count, write). This lets the Catalyst optimizer see the full plan and apply optimisations like predicate pushdown and broadcast join detection before running anything.' },
      { q: 'What is the difference between cache() and persist()?', a: 'cache() is shorthand for persist(StorageLevel.MEMORY_AND_DISK). persist() lets you choose the storage level: MEMORY_ONLY (fastest, may spill), MEMORY_AND_DISK (safe fallback), DISK_ONLY (slow, saves RAM). Use persist when you reference a DataFrame 2+ times in a job to avoid recomputing it from scratch on each action.' },
      { q: 'How do you debug an OOM (out of memory) error in a Spark job?', a: 'Check Spark UI Executors tab for GC time > 10% and spill (memory/disk). Common fixes: (1) Increase executor memory: --executor-memory 8g. (2) Reduce parallelism: lower shuffle.partitions. (3) Use broadcast join to avoid shuffle. (4) Persist intermediate DataFrames to disk. (5) Check for cartesian products — a missing join condition blows up to O(n²) rows.' },
      { q: 'What is the Catalyst optimizer in Spark?', a: 'Catalyst is Spark SQL engine that transforms your logical plan through four phases: Analysis (resolve column names), Logical Optimization (predicate pushdown, constant folding), Physical Planning (choose join strategy), and Code Generation (compile to JVM bytecode). This is why Spark SQL is often faster than the RDD API — Catalyst can optimise SQL that the RDD API cannot.' },
      { q: 'When would you use mapPartitions over map in Spark?', a: 'mapPartitions(func) calls func once per partition with an iterator of all rows — ideal for expensive setup like opening a DB connection, loading an ML model, or creating an HTTP session. map(func) calls func once per row, so expensive setup repeats N times. Use mapPartitions to amortise connection cost across a partition.' },
      { q: 'What is a Spark stage vs a task?', a: 'A stage is a set of transformations that can run without a shuffle — separated from other stages by shuffle boundaries (groupBy, join). A task is one unit of work within a stage running on one partition on one executor. If you have 200 partitions and 1 stage, Spark creates 200 tasks. Skew = one task finishes in 10 min while 199 finish in 10 sec.' },
    ],
    cheatSheet: [
      { key: 'spark.sql.adaptive.enabled=true', value: 'AQE — auto-adjust shuffle partitions at runtime' },
      { key: 'broadcast(df)', value: 'Eliminate shuffle for small-table joins (< 50 MB)' },
      { key: 'coalesce(N)', value: 'Reduce partitions without shuffle (for decreasing only)' },
      { key: 'OPTIMIZE + ZORDER', value: 'Delta: compact files + co-locate related data' },
      { key: 'withWatermark("ts","5 min")', value: 'Streaming: tolerate up to 5-min late events' },
      { key: 'checkpointLocation', value: 'Required for fault-tolerant streaming — resume from last offset' },
    ],
  },
  'apache-airflow': {
    codeExamples: [
      {
        label: 'Production Airflow DAG — Spark on EMR',
        lang: 'python',
        code: `from datetime import datetime, timedelta
from airflow import DAG
from airflow.providers.amazon.aws.operators.emr import EmrAddStepsOperator, EmrStepSensor
from airflow.providers.amazon.aws.operators.glue import GlueJobOperator
from airflow.providers.amazon.aws.sensors.s3 import S3KeySensor

default_args = {
    "owner": "de-team",
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    "on_failure_callback": lambda ctx: send_alert(ctx),  # Slack/PD alert
}

with DAG(
    dag_id="daily_user_events_pipeline",
    schedule="0 3 * * *",      # 3am UTC daily
    start_date=datetime(2025, 1, 1),
    catchup=False,              # don't backfill missed runs
    default_args=default_args,
    tags=["production", "events"],
) as dag:

    # Wait for upstream source data
    wait_for_source = S3KeySensor(
        task_id="wait_for_raw_events",
        bucket_name="my-data-lake",
        bucket_key="raw/events/{{ ds }}/_SUCCESS",
        poke_interval=60,
        timeout=3600,
        mode="reschedule",     # release worker slot while waiting
    )

    # Glue ETL: Bronze → Silver
    bronze_to_silver = GlueJobOperator(
        task_id="bronze_to_silver",
        job_name="events-bronze-to-silver",
        script_args={"--date": "{{ ds }}", "--env": "prod"},
        aws_conn_id="aws_default",
    )

    # EMR Spark: Silver → Gold aggregation
    spark_gold = EmrAddStepsOperator(
        task_id="submit_spark_gold",
        job_flow_id="{{ var.value.EMR_CLUSTER_ID }}",
        steps=[{
            "Name": "gold-aggregation",
            "ActionOnFailure": "CONTINUE",
            "HadoopJarStep": {
                "Jar": "command-runner.jar",
                "Args": [
                    "spark-submit", "--deploy-mode", "cluster",
                    "s3://scripts/gold_aggregation.py",
                    "--date", "{{ ds }}"
                ],
            },
        }],
    )

    wait_for_spark = EmrStepSensor(
        task_id="wait_for_spark_gold",
        job_flow_id="{{ var.value.EMR_CLUSTER_ID }}",
        step_id="{{ ti.xcom_pull('submit_spark_gold')[0] }}",
        poke_interval=30,
    )

    wait_for_source >> bronze_to_silver >> spark_gold >> wait_for_spark`,
      },
    ],
    interviewQA: [
      { q: 'What is the difference between execution_date and data_interval_start?', a: 'data_interval_start is the START of the data window (e.g., 2025-03-19 00:00). The scheduler runs the DAG AFTER the interval closes — a daily DAG at 3am processes the previous day. execution_date was the Airflow 1.x name; data_interval_start is the Airflow 2.x standard.' },
      { q: 'How do you ensure idempotency in an Airflow pipeline?', a: 'Write to a partition keyed by execution date, overwrite (not append) on re-run. For Redshift: DELETE WHERE date = "{{ ds }}" before INSERT. For S3: write to a temp prefix, validate, then atomic rename to production. Never append without deduplication — backfills will create duplicates.' },
      { q: 'What is catchup=False and when should you use it?', a: 'catchup=False prevents Airflow from creating DAG runs for all missed dates between start_date and today on first deploy. A DAG with start_date 6 months ago and catchup=True immediately creates 180 runs. Use catchup=False in production. Enable only for explicit controlled backfills.' },
      { q: 'What is the difference between a Sensor poke mode and reschedule mode?', a: 'poke mode: the sensor task holds a worker slot the entire time it waits — wastes a slot for hours. reschedule mode: the sensor releases the worker slot between checks and re-queues itself — far more efficient. Always use mode="reschedule" for sensors that wait longer than a few minutes.' },
      { q: 'How do you pass data between Airflow tasks?', a: 'Use XCom (cross-communication): ti.xcom_push(key="path", value=s3_path) in one task, ti.xcom_pull(task_ids="upstream", key="path") in the next. XCom is stored in the Airflow metadata DB — keep it small (< 48 KB, never DataFrames). For large data, pass an S3 URI or database reference, not the data itself.' },
      { q: 'What is trigger_rule and when would you use ALL_DONE?', a: 'trigger_rule controls when a downstream task runs. Default is ALL_SUCCESS (run only if all upstream tasks succeeded). ALL_DONE runs even if upstream tasks failed — useful for cleanup/notification tasks that must run regardless of pipeline success. ONE_SUCCESS runs after the first upstream success (fan-in patterns).' },
      { q: 'How do you implement a backfill for 30 days of historical data?', a: 'Set catchup=True temporarily, or use: airflow dags backfill --start-date 2025-01-01 --end-date 2025-01-31 my_dag. Ensure your tasks are idempotent (overwrite, not append). Consider --max-active-runs 3 to throttle parallelism and avoid overloading the data source or downstream database.' },
      { q: 'How does the Airflow scheduler work?', a: 'The scheduler reads all DAG files from the dags/ folder on a configurable interval, parses them, and serialises them to the metadata DB. It then checks which DAG runs are due, creates TaskInstances, and sends them to the executor (Celery/Kubernetes). Parsing too many large DAG files slows the scheduler — use lazy imports and avoid top-level API calls in DAG files.' },
      { q: 'How do you handle a failing upstream DAG dependency?', a: 'Use ExternalTaskSensor to wait for an upstream DAG to succeed before starting. Set execution_delta or execution_date_fn to align intervals. Combined with mode="reschedule" to avoid holding worker slots. Set timeout=3600 and poke_interval=60 — if the upstream is more than 1 hour late, fail and alert rather than waiting indefinitely.' },
      { q: 'How do you parameterise a DAG to run in different environments?', a: 'Use Airflow Variables (Variable.get("env")) or os.environ for environment-specific config. Use Airflow Connections for credentials — never hard-code secrets in DAG files. For templated values use Jinja: {{ var.value.s3_bucket }}. For complex config use Airflow Params (DAG-level or run-level) and pass them as dag_run.conf.' },
    ],
    cheatSheet: [
      { key: 'mode="reschedule"', value: 'Sensor releases worker while waiting (vs poke which holds it)' },
      { key: 'trigger_rule=ALL_DONE', value: 'Run even if upstream tasks failed (use for cleanup)' },
      { key: '{{ ds }}', value: 'Jinja template: execution date as YYYY-MM-DD string' },
      { key: 'catchup=False', value: 'Prevent backfilling missed runs on first deployment' },
      { key: 'XCom', value: 'Pass small values between tasks — never use for DataFrames (< 48KB limit)' },
    ],
  },
  'kafka-streaming': {
    codeExamples: [
      {
        label: 'Kafka Producer — Exactly-Once (Python)',
        lang: 'python',
        code: `from confluent_kafka import Producer, KafkaError
import json, time

conf = {
    "bootstrap.servers": "broker1:9092,broker2:9092",
    "acks": "all",                      # all ISR must acknowledge
    "enable.idempotence": True,         # exactly-once per partition
    "retries": 10,
    "max.in.flight.requests.per.connection": 5,  # max for idempotence
    "batch.size": 32768,                # 32 KB — wait before send
    "linger.ms": 10,                    # wait 10ms for batching
    "compression.type": "snappy",
}

producer = Producer(conf)

def delivery_callback(err, msg):
    if err:
        print(f"DELIVERY FAILED: {err}  topic={msg.topic()}")
    else:
        print(f"Delivered to {msg.topic()}[{msg.partition()}] offset {msg.offset()}")

events = [{"user_id": 1, "action": "purchase", "amount": 49.99}]

for event in events:
    producer.produce(
        topic="user-events",
        key=str(event["user_id"]).encode(),  # determines partition
        value=json.dumps(event).encode(),
        callback=delivery_callback,
    )
    producer.poll(0)  # trigger callbacks without blocking

producer.flush()  # wait for all in-flight messages to deliver`,
      },
      {
        label: 'Kafka Consumer — Manual Offset Commit',
        lang: 'python',
        code: `from confluent_kafka import Consumer, KafkaError

conf = {
    "bootstrap.servers": "broker1:9092",
    "group.id": "etl-consumer-group",
    "auto.offset.reset": "earliest",
    "enable.auto.commit": False,        # manual commit for exactly-once
    "max.poll.interval.ms": 300000,     # 5 min — increase for slow processing
}

consumer = Consumer(conf)
consumer.subscribe(["user-events"])

try:
    while True:
        msg = consumer.poll(timeout=1.0)
        if msg is None:
            continue
        if msg.error():
            if msg.error().code() == KafkaError._PARTITION_EOF:
                continue
            raise KafkaError(msg.error())

        # Process message
        data = json.loads(msg.value())
        process_event(data)

        # Commit only after successful processing
        consumer.commit(asynchronous=False)  # synchronous = guaranteed

except KeyboardInterrupt:
    pass
finally:
    consumer.close()`,
      },
    ],
    interviewQA: [
      { q: 'What is the difference between at-most-once, at-least-once, and exactly-once semantics?', a: 'At-most-once: commit offset before processing — message may be lost if consumer crashes. At-least-once: commit after processing — message may be reprocessed on crash. Exactly-once: idempotent producer + transactional consumer commit — no loss, no duplicates. Requires enable.idempotence=true and the Kafka Transactions API end-to-end.' },
      { q: 'How do you prevent a Kafka hot partition?', a: 'Hot partitions occur when all messages route to the same partition (e.g., using "status" as the key — only 3 values). Fix: use high-cardinality keys (user_id, order_id). If no natural key, use null for round-robin. Monitor per-partition consumer lag — a hot partition grows while others stay at 0.' },
      { q: 'What happens during a Kafka consumer group rebalance?', a: 'Rebalance triggers when a consumer joins, leaves, or crashes. By default it is stop-the-world — all consumers pause. Cooperative rebalancing (Kafka 2.4+) only revokes/reassigns affected partitions, others keep processing. Minimise rebalances: set long session.timeout.ms for batch consumers, use static group membership.' },
      { q: 'What is log compaction in Kafka and when would you use it?', a: 'Log compaction retains only the latest message per key — older duplicate keys are purged. Use it for changelog topics (user profile updates, CDC) where you need the latest state per entity, not the full history. Set cleanup.policy=compact. Unlike retention-by-time, compaction never deletes any key that exists — only older versions of that key.' },
      { q: 'How do consumer groups work in Kafka?', a: 'Each partition is assigned to exactly one consumer within a group — consumers in the same group share the load. Consumers in different groups each receive a full copy of every message — this is the fan-out pattern. Increasing consumers beyond the number of partitions does not help — idle consumers beyond partition count are wasted.' },
      { q: 'What is the difference between Kafka and Kinesis?', a: 'Kafka: open-source, self-managed (or Confluent managed), 1 MB/s per partition, pull-based consumer, retention by time/size, replayable. Kinesis: AWS-managed, 1 MB/s or 1000 RPS per shard, pull-based (polling) or push (Enhanced Fan-Out at 2 MB/s/consumer), max 7-day retention, simpler ops. Use Kafka for complex routing/transformations; Kinesis for simple AWS-native pipelines.' },
      { q: 'When would you use Kinesis Firehose vs Kinesis Data Streams?', a: 'Data Streams: real-time, custom consumer code, sub-second latency, replay up to 7 days — use when you need custom processing or low latency. Firehose: fully managed S3/Redshift/ES delivery, minimum 60-second buffer, no custom consumer needed — use for simple load-to-S3/Redshift pipelines where 1-min latency is acceptable.' },
      { q: 'What is the role of a Kafka broker?', a: 'A broker is a Kafka server that stores partitions and serves read/write requests. Each partition has one leader broker (handles all writes) and N-1 follower brokers (replicate the leader). Producers write to the leader, consumers read from the leader (or followers with rack-aware config). If the leader fails, a follower is elected leader by the controller.' },
      { q: 'How do you set message retention in Kafka?', a: 'Per-topic: kafka-configs.sh --alter --entity-type topics --entity-name my-topic --add-config retention.ms=604800000 (7 days). Cluster default: log.retention.hours=168. For size-based: retention.bytes= per partition. For compacted topics: min.cleanable.dirty.ratio and segment.ms control compaction frequency.' },
      { q: 'How do you decide the number of partitions for a Kafka topic?', a: 'Rule of thumb: max(throughput / 10 MB per partition per consumer). Start with more partitions than you think you need — you can increase partitions but never decrease without re-creating the topic, which breaks key ordering. More partitions = more parallelism but also more leader elections on failure and more file handles on brokers.' },
    ],
    cheatSheet: [
      { key: 'acks=all + enable.idempotence=true', value: 'Exactly-once producer guarantee' },
      { key: 'enable.auto.commit=false', value: 'Manual offset control — commit after processing' },
      { key: '1 shard = 1 MB/s write (Kinesis)', value: 'Scale by adding shards; use high-cardinality partition key' },
      { key: 'Enhanced fan-out', value: 'Kinesis: 2 MB/s dedicated per consumer — no sharing overhead' },
      { key: 'Firehose buffer: 60s or 1MB', value: 'Minimum 1-min S3 latency — not for real-time requirements' },
    ],
  },
  'delta-lake': {
    codeExamples: [
      {
        label: 'Delta Lake — Full CRUD + VACUUM + ZORDER',
        lang: 'python',
        code: `from delta.tables import DeltaTable
import pyspark.sql.functions as F

PATH = "s3://bucket/delta/orders/"

# ── WRITE ── (first time creates the table)
orders_df.write.format("delta").mode("overwrite") \\
    .partitionBy("order_date") \\
    .save(PATH)

# ── MERGE (upsert + soft-delete) ──
target = DeltaTable.forPath(spark, PATH)
target.alias("t").merge(
    updates_df.alias("s"),
    "t.order_id = s.order_id"
).whenMatchedUpdate(
    condition="s.status = 'cancelled'",
    set={"status": "s.status", "updated_at": "s.updated_at"}
).whenMatchedUpdateAll() \\
 .whenNotMatchedInsertAll() \\
 .execute()

# ── DELETE ── (GDPR: remove a specific user)
target.delete("user_id = 'user_12345'")

# ── TIME TRAVEL ──
df_v3 = spark.read.format("delta").option("versionAsOf", 3).load(PATH)
df_jan = spark.read.format("delta") \\
    .option("timestampAsOf", "2025-01-01") \\
    .load(PATH)

# ── OPTIMIZE + ZORDER ── (compact + co-locate data)
spark.sql(f"""
    OPTIMIZE delta.\`{PATH}\`
    ZORDER BY (user_id, order_date)
""")

# ── VACUUM ── (remove files older than 7 days)
DeltaTable.forPath(spark, PATH).vacuum(retentionHours=168)

# ── HISTORY ──
target.history().select("version", "timestamp", "operation").show()`,
      },
    ],
    interviewQA: [
      { q: 'How does Delta Lake provide ACID transactions on S3?', a: 'Delta maintains a _delta_log/ directory. Every DML writes a JSON commit file listing files added/removed. Table state = union of all commits. Concurrent writers use optimistic concurrency: both write, the second checks for conflicts and retries. Entirely in userspace — S3 itself has no transaction primitives.' },
      { q: 'What is ZORDER and when should you use it?', a: 'ZORDER BY (col1, col2) re-sorts data files so rows with similar column values land in the same Parquet file, enabling data skipping (skip files where col min/max does not match your WHERE clause). Most impactful for high-cardinality filter columns (user_id, date) on large tables. Combine with OPTIMIZE to compact small files first.' },
      { q: 'When should you use Delta vs Iceberg vs Hudi?', a: 'Delta: Databricks/Spark-native, best MERGE performance, OPTIMIZE+ZORDER. Iceberg: multi-engine (Athena+Spark+Trino+Flink), partition evolution without rewrites, AWS-preferred. Hudi: high-frequency streaming upserts and GDPR point-deletes at petabyte scale (Uber/LinkedIn use case). All three support ACID and time travel.' },
      { q: 'What is the Delta transaction log (_delta_log)?', a: 'A sequence of JSON files (000000.json, 000001.json…) each describing one atomic commit: files added, files removed, schema changes. Periodic checkpoint files (Parquet) summarise all commits to that point for faster reads. DO NOT manually delete _delta_log/ — that permanently corrupts the table.' },
      { q: 'How does time travel work in Delta Lake?', a: 'Delta preserves old data files until VACUUM removes them. You can query prior states: VERSION AS OF N for a specific commit version, or TIMESTAMP AS OF "2025-01-01" for a point-in-time snapshot. Default retention for time travel is 30 days (configurable). Use it for audit, ML dataset versioning, and recovering from bad writes.' },
      { q: 'What is VACUUM and when should running it matter?', a: 'VACUUM removes data files that are no longer part of the current table state and are older than the retention threshold (default 7 days / 168 hours). Without VACUUM, deleted/overwritten files accumulate on S3 indefinitely. Never VACUUM with retentionHours < 168 unless spark.databricks.delta.retentionDurationCheck.enabled=false, or time travel breaks.' },
      { q: 'How does Delta Lake handle schema evolution?', a: 'By default Delta enforces schema — writing a DataFrame with a new column throws AnalysisException. Enable evolution: .option("mergeSchema", "true") on write adds new columns. .option("overwriteSchema", "true") replaces the schema entirely. Use schema evolution for additive changes; avoid dropping/renaming columns without a migration plan.' },
      { q: 'What is optimistic concurrency control in Delta Lake?', a: 'Both concurrent writers proceed independently. When the second writer commits, it reads the transaction log and checks if any conflicting operations happened since it read the table. If there is a conflict (overlapping partitions modified), the transaction is retried. If no conflict, it commits. This is why concurrent writes to different partitions rarely conflict.' },
      { q: 'What is the difference between MERGE INTO and INSERT OVERWRITE?', a: 'INSERT OVERWRITE replaces an entire partition or table — simple but destructive. MERGE INTO matches rows by key and can UPDATE matched rows, INSERT non-matched rows, and DELETE matched rows — all in one atomic operation. MERGE is for CDC (change data capture) and upserts; INSERT OVERWRITE is for full partition refreshes.' },
      { q: 'How do you handle concurrent writes to the same Delta table?', a: 'Delta uses optimistic concurrency with partition-level conflict detection. Writes to different partitions rarely conflict. For non-partitioned tables or same-partition concurrent writes, only one succeeds and the other retries. To minimise conflicts: partition data by date and ensure each job writes to its own partition only (partition isolation pattern).' },
    ],
    cheatSheet: [
      { key: '_delta_log/', value: 'Transaction log directory — DO NOT delete manually' },
      { key: 'VACUUM(retentionHours=168)', value: 'Delete unreferenced files older than 7 days' },
      { key: 'OPTIMIZE … ZORDER BY', value: 'Compact files + co-locate data for faster filter queries' },
      { key: 'VERSION AS OF N', value: 'Time travel to a specific version (for audit/ML reproducibility)' },
      { key: '.whenMatchedUpdateAll()', value: 'MERGE: update all columns from source when key matches' },
    ],
  },
  'system-design-de': {
    codeExamples: [
      {
        label: 'Back-of-Envelope Estimation Template',
        lang: 'text',
        code: `Given: 100M DAU, 10 events/user/day, 90-day retention

── WRITE ──
Events/day  = 100M × 10 = 1B events/day
Events/sec  = 1B / 86,400 ≈ 11,600 QPS (avg), 35,000 QPS (peak 3×)
Event size  = 500 bytes each
Ingest rate = 11,600 × 500 B ≈ 5.8 MB/s average

── STORAGE ──
Raw/day     = 1B × 500 B = 500 GB/day
Parquet (8× compression) = 62 GB/day
90-day raw  = 45 TB
90-day Parq = 5.6 TB
S3 cost     = 5.6 TB × $0.023/GB = ~$130/month

── KAFKA ──
Shards needed = ceil(5.8 MB/s / 1 MB/s per shard) = 6 shards
Replicas (3×) = 17.4 MB/s ingest bandwidth needed cluster-wide

── ATHENA ──
Cost per query = GB scanned × $5/1000 GB
1 TB scan = $5 | With Parquet + partitions: 10 GB scan = $0.05/query

── REDSHIFT ──
Daily load: 62 GB Parquet, 2 nodes ra3.xlplus $1.086/hr = $52/day`,
      },
    ],
    interviewQA: [
      { q: 'How would you design an event tracking system for 100M DAU?', a: 'SDK (mobile/web) → API Gateway (no auth, fire-and-forget, validates schema) → Kinesis Data Streams (11K QPS avg). Consumer 1: Lambda validates + enriches → Firehose → S3 Parquet partitioned by date (Bronze). Consumer 2: Flink/Spark Streaming → Redis for real-time leaderboards. Daily Spark: Bronze→Silver (dedup, type-cast)→Gold (aggregates for BI). Glue Catalog makes Gold queryable by Athena and Redshift Spectrum.' },
      { q: 'How would you implement GDPR right-to-delete in a data lake?', a: 'Three strategies: (1) Hudi delete API — removes record keys across all S3 partitions without full file rewrites. (2) Iceberg positional delete files — logical deletion at read time, no data file rewrite. (3) Pseudonymisation — encrypt user_id with a per-user key at ingest; deletion = destroy the key (data remains but is unreadable). Audit with CloudTrail + S3 Object Lock for compliance evidence.' },
      { q: 'How do you ensure exactly-once processing end-to-end in a streaming pipeline?', a: 'Three independent layers: (1) Source: Kinesis sequence number / Kafka offset as idempotency key — never re-read committed offsets. (2) Processing: Flink two-phase commit sink — commits output only after checkpoint succeeds. (3) Sink: write to deterministic S3 path (date+batch_id), use MERGE not INSERT into Delta/Iceberg to handle retries without duplicates.' },
      { q: 'What is the difference between Lambda and Kappa architecture?', a: 'Lambda: two separate paths — a batch layer (accurate, slow) and a speed layer (approximate, fast) — merged at query time. Complex: you maintain two codebases producing the same output. Kappa: single streaming path handles everything with replayable storage (Kafka). Simpler to maintain but requires streaming to match batch accuracy. Most modern DE shops are moving to Kappa on top of Kafka + object storage.' },
      { q: 'How would you handle late-arriving data in a streaming pipeline?', a: 'Use watermarks: withWatermark("event_time", "5 minutes") tells the engine to wait up to 5 min for late events before closing a window. Events later than the watermark threshold are dropped (or routed to a corrections topic). For batch: partition by event date and re-run the partition when late data arrives — Delta MERGE handles dedup on re-run.' },
      { q: 'What is the Medallion architecture (Bronze/Silver/Gold)?', a: 'Bronze: raw ingested data — no transforms, append-only, keep forever for debugging and reprocessing. Silver: cleaned, deduplicated, type-cast, business-rule-validated data — the source of truth. Gold: pre-aggregated, business-metric tables optimised for BI queries. Each layer is an independent Delta/Iceberg table with its own SLA and ownership.' },
      { q: 'What is a feature store and why is it needed?', a: 'A feature store is a shared repository for ML features that serves both offline training (batch reads from Parquet) and online inference (low-latency key-value reads from Redis/DynamoDB). Without it, each ML team re-computes the same features independently, creating inconsistencies between training and serving (train-serve skew). Examples: Databricks Feature Store, Feast, Tecton.' },
      { q: 'How would you design a data pipeline with a 1-hour SLA?', a: 'SLA = data available in Gold within 1 hour of event. Design: Kinesis (< 1 min) → Lambda validates (< 30 sec) → Firehose 5-min buffer → S3 Bronze (5–6 min from event). Hourly Glue/Spark job: S3 trigger or EventBridge schedule at HH:05 → Silver → Gold (target < 50 min). Alert at 45 min with CloudWatch alarm on job start time — gives 15 min reaction window before SLA breach.' },
      { q: 'How would you monitor data quality in a production pipeline?', a: 'Three layers: (1) Schema validation at ingest — Great Expectations or dbt tests on column types, nullability, range checks. (2) Freshness monitoring — alert if Silver table last updated > 2× the expected frequency. (3) Statistical drift — compare row counts, null rates, and metric distributions between today and a rolling baseline. Route failed records to a dead-letter queue for investigation, never silently drop them.' },
      { q: 'How would you design a real-time leaderboard for 100M users?', a: 'Write events to Kafka. Flink aggregates scores in 1-min tumbling windows. Results written to Redis Sorted Sets (ZADD user_id score): ZRANGEBYSCORE gives top-N in O(log N + M). For pagination: ZREVRANGE leaderboard 0 99 for top 100. Use Redis Cluster for sharding across users. Periodically sync to DynamoDB/PostgreSQL for durable storage. For global leaderboards at petabyte scale: pre-aggregate by region, merge top-N from each shard.' },
    ],
    cheatSheet: [
      { key: 'QPS = DAU × actions / 86400', value: 'Always estimate QPS before drawing architecture' },
      { key: 'Parquet = ~8× compression vs CSV', value: '$5/TB Athena → $0.05/10 GB Parquet scan' },
      { key: 'Kinesis: 1 MB/s or 1000 RPS per shard', value: 'ceil(ingest_MBps / 1) shards needed' },
      { key: 'Cache 20% hot data', value: '80/20 rule: 20% keys get 80% of traffic' },
      { key: 'FAANG SLA tiers', value: 'Real-time: <1s | Near-real-time: 1-60s | Batch: hours' },
    ],
  },
};

/* ─── Per-subtopic resource links (keyed by exact subtopic name) ──────── */
const SUBTOPIC_RESOURCES: Record<string, { label: string; channel: string; url: string }[]> = {
  'ROW_NUMBER / RANK / DENSE_RANK / NTILE': [
    { label: 'Ranking Functions (Interview Problems)', channel: 'Ankit Bansal', url: 'https://www.youtube.com/watch?v=xMWEVFC4FOk' },
    { label: 'RANK / DENSE_RANK / ROW_NUMBER / LEAD / LAG', channel: 'TechTFQ', url: 'https://www.youtube.com/@techTFQ' },
  ],
  'LAG / LEAD / FIRST_VALUE / LAST_VALUE': [
    { label: 'LAG & LEAD Deep Dive', channel: 'Ankit Bansal', url: 'https://www.youtube.com/watch?v=speKIs60TRs' },
  ],
  'Running totals, moving averages, cumulative sums': [
    { label: 'Complex SQL Interview Playlist', channel: 'Ankit Bansal', url: 'https://www.youtube.com/@ankitbansal6' },
  ],
  'CTEs vs subqueries vs temp tables — when to use each': [
    { label: 'Medium Complex SQL Playlist', channel: 'Ankit Bansal', url: 'https://www.youtube.com/@ankitbansal6' },
    { label: 'CTE vs Subquery — Performance Breakdown', channel: 'TechTFQ', url: 'https://www.youtube.com/@techTFQ' },
  ],
  'EXPLAIN ANALYZE, query plans, index vs seq scans': [
    { label: 'PostgreSQL Query Optimization', channel: 'TechTFQ', url: 'https://www.youtube.com/@techTFQ' },
  ],
  'Composite indexes, covering indexes, partial indexes': [
    { label: 'SQL Indexing Deep Dive', channel: 'TechTFQ', url: 'https://www.youtube.com/@techTFQ' },
  ],
  'PARTITION BY on large tables — storage design patterns': [
    { label: 'Table Partitioning for Large-Scale Data', channel: 'TechTFQ', url: 'https://www.youtube.com/@techTFQ' },
  ],
  'MERGE / UPSERT patterns — SCD Type 1 & 2': [
    { label: 'MERGE Statement & SCD Concepts', channel: 'TechTFQ', url: 'https://www.youtube.com/@techTFQ' },
  ],
  'SQL for DE interviews: retention, funnel, DAU/MAU': [
    { label: '50+ SQL Interview Problems Playlist', channel: 'Ankit Bansal', url: 'https://www.youtube.com/@ankitbansal6' },
    { label: 'Interactive SQL Practice (DAU/MAU, Retention, Funnel)', channel: 'DataLemur', url: 'https://datalemur.com' },
  ],

  /* ── Python for Data Engineering ─────────────────────────────────── */
  'Pandas: groupby, merge, pivot_table, melt, apply': [
    { label: 'pandas groupby explained', channel: 'Data School', url: 'https://www.youtube.com/watch?v=qy0fDqoMJx8' },
    { label: 'How to merge DataFrames in pandas', channel: 'Data School', url: 'https://www.youtube.com/watch?v=iYWKfUOtGaw' },
    { label: 'Pandas Full Tutorial Playlist', channel: 'Corey Schafer', url: 'https://www.youtube.com/playlist?list=PL-osiE80TeTsWmV9i9c58mdDCSskIFdDS' },
  ],
  'Pandas performance: vectorization vs loops, chunked reads': [
    { label: 'Pandas Tutorials (vectorization, apply, chunking)', channel: 'Corey Schafer', url: 'https://www.youtube.com/playlist?list=PL-osiE80TeTsWmV9i9c58mdDCSskIFdDS' },
  ],
  'List comprehensions, generators, itertools, functools': [
    { label: 'Python Comprehensions Explained', channel: 'Corey Schafer', url: 'https://www.youtube.com/watch?v=3dt4OGnU5sM' },
    { label: 'Python Generators — How to Use Them', channel: 'Corey Schafer', url: 'https://www.youtube.com/watch?v=bD05uGo_sVI' },
  ],
  'File I/O: CSV/JSON/Parquet with pandas & pyarrow': [
    { label: 'Pandas Read/Write Files (CSV, JSON, Parquet)', channel: 'Corey Schafer', url: 'https://www.youtube.com/playlist?list=PL-osiE80TeTsWmV9i9c58mdDCSskIFdDS' },
  ],
  'REST API calls with requests: pagination, rate limiting': [
    { label: 'Python requests Library Tutorial', channel: 'Corey Schafer', url: 'https://www.youtube.com/watch?v=tb8gHvYlCFs' },
  ],
  'Error handling patterns: retries, backoff, dead-letter queues': [
    { label: 'Python Exception Handling Tutorial', channel: 'Corey Schafer', url: 'https://www.youtube.com/watch?v=NIWwJbo-9_8' },
  ],
  'Logging, argparse, environment variables (.env)': [
    { label: 'Python Logging Tutorial', channel: 'Corey Schafer', url: 'https://www.youtube.com/watch?v=-ARI4Cz-awo' },
  ],
  'Write a full ETL script: API → Pandas → Parquet → S3': [
    { label: 'Pandas Playlist — ETL Patterns End-to-End', channel: 'Corey Schafer', url: 'https://www.youtube.com/playlist?list=PL-osiE80TeTsWmV9i9c58mdDCSskIFdDS' },
  ],

  /* ── Data Modeling ───────────────────────────────────────────────── */
  'Star Schema: fact tables, dimension tables, grain': [
    { label: 'Intro to dbt — covers Kimball & Star Schema', channel: 'Kahan Data Solutions', url: 'https://www.youtube.com/watch?v=5rNquRnNb4E' },
    { label: 'Star Schema & Dimensional Modeling', channel: 'Kahan Data Solutions', url: 'https://www.youtube.com/@KahanDataSolutions' },
  ],
  'Snowflake Schema vs Star Schema trade-offs': [
    { label: 'Star vs Snowflake Schema', channel: 'Kahan Data Solutions', url: 'https://www.youtube.com/@KahanDataSolutions' },
  ],
  'SCD Type 1 (overwrite), Type 2 (versioned), Type 3 (prev value)': [
    { label: 'Slowly Changing Dimensions (SCD Types)', channel: 'Kahan Data Solutions', url: 'https://www.youtube.com/@KahanDataSolutions' },
    { label: 'SCD Type 2 with dbt snapshots', channel: 'dbt Labs', url: 'https://www.youtube.com/@dbtlabs' },
  ],
  'Fact table types: transactional, periodic, accumulating': [
    { label: 'Fact Table Types Explained', channel: 'Kahan Data Solutions', url: 'https://www.youtube.com/@KahanDataSolutions' },
  ],
  'Inmon (3NF) vs Kimball (dimensional) — when each applies': [
    { label: 'Inmon vs Kimball — Data Warehouse Design', channel: 'Kahan Data Solutions', url: 'https://www.youtube.com/@KahanDataSolutions' },
  ],
  'Data Vault 2.0: Hubs, Links, Satellites': [
    { label: 'Data Vault 2.0 Architecture', channel: 'Kahan Data Solutions', url: 'https://www.youtube.com/@KahanDataSolutions' },
  ],
  'Schema design from scratch: e-commerce, ride-sharing': [
    { label: 'Schema Design — Real-World Examples', channel: 'Kahan Data Solutions', url: 'https://www.youtube.com/@KahanDataSolutions' },
  ],

  /* ── AWS Fundamentals ────────────────────────────────────────────── */
  'S3: buckets, prefixes, versioning, lifecycle policies': [
    { label: 'AWS S3 Deep Dive', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'IAM: roles, policies, assume-role, least privilege': [
    { label: 'AWS IAM Roles & Policies', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'EC2: instance types, security groups, key pairs': [
    { label: 'AWS EC2 for Data Engineers', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'VPC: subnets, NAT gateway, VPC endpoints': [
    { label: 'VPC Networking for Data Pipelines', channel: 'ByteByteGo', url: 'https://www.youtube.com/@ByteByteGo' },
  ],
  'CloudWatch: log groups, metrics, alarms for pipelines': [
    { label: 'CloudWatch Monitoring for Pipelines', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'AWS CLI: s3 cp, s3 sync, glue, cloudwatch commands': [
    { label: 'AWS CLI Full Guide', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'SAA-C03 core concepts (optional but recommended)': [
    { label: 'AWS Solutions Architect Associate Prep', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],

  /* ── Apache Spark ────────────────────────────────────────────────── */
  'Architecture: Driver, Executors, DAG, Stages, Tasks': [
    { label: 'Anatomy of a Spark Cluster (Driver/Executor/DAG)', channel: 'DataTalksClub', url: 'https://www.youtube.com/watch?v=68CipcZt7ZA' },
    { label: 'Spark Architecture Deep Dive', channel: 'BigDataSumit', url: 'https://www.youtube.com/@BigDataSumit' },
  ],
  'RDD vs DataFrame vs Dataset — when to use which': [
    { label: 'Introduction to Spark + RDD/DataFrame', channel: 'DataTalksClub', url: 'https://www.youtube.com/watch?v=FhaqbEOuQ8U' },
    { label: 'RDD vs DataFrame vs Dataset', channel: 'BigDataSumit', url: 'https://www.youtube.com/@BigDataSumit' },
  ],
  'Transformations vs Actions: lazy evaluation model': [
    { label: 'Spark Lazy Evaluation Explained', channel: 'BigDataSumit', url: 'https://www.youtube.com/@BigDataSumit' },
    { label: 'Spark Fundamentals — Official', channel: 'Databricks', url: 'https://www.youtube.com/@Databricks' },
  ],
  'Narrow (map/filter) vs Wide (groupBy/join) transformations': [
    { label: 'GroupBy in Spark (shuffle & wide transforms)', channel: 'DataTalksClub', url: 'https://www.youtube.com/watch?v=9qrDsY_2COo' },
    { label: 'Narrow vs Wide Transformations', channel: 'BigDataSumit', url: 'https://www.youtube.com/@BigDataSumit' },
  ],
  'Reading/writing Parquet, Delta, Iceberg from S3': [
    { label: 'Spark with Delta Lake on S3', channel: 'Databricks', url: 'https://www.youtube.com/@Databricks' },
  ],
  'Partitioning: repartition() vs coalesce()': [
    { label: 'repartition vs coalesce in PySpark', channel: 'BigDataSumit', url: 'https://www.youtube.com/@BigDataSumit' },
  ],
  'Broadcast joins: autoBroadcastJoinThreshold': [
    { label: 'Joins in Spark (incl. broadcast join)', channel: 'DataTalksClub', url: 'https://www.youtube.com/watch?v=lu7TrqAWuH4' },
    { label: 'Broadcast Join Optimization', channel: 'BigDataSumit', url: 'https://www.youtube.com/@BigDataSumit' },
  ],
  'Shuffle tuning: shuffle.partitions, AQE (Spark 3)': [
    { label: 'Spark AQE & Shuffle Tuning', channel: 'Databricks', url: 'https://www.youtube.com/@Databricks' },
    { label: 'Adaptive Query Execution (AQE) Deep Dive', channel: 'BigDataSumit', url: 'https://www.youtube.com/@BigDataSumit' },
  ],
  'Caching: cache() vs persist(), storage levels': [
    { label: 'Spark cache() vs persist() & Storage Levels', channel: 'BigDataSumit', url: 'https://www.youtube.com/@BigDataSumit' },
  ],
  'Spark on AWS EMR: submit, cluster configs, Spot': [
    { label: 'Spark on EMR — Cluster & Spot Config', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'Spark Structured Streaming: sources, watermarks, triggers': [
    { label: 'Structured Streaming — Watermarks & Triggers', channel: 'BigDataSumit', url: 'https://www.youtube.com/@BigDataSumit' },
    { label: 'Spark Streaming on Databricks', channel: 'Databricks', url: 'https://www.youtube.com/@Databricks' },
  ],
  'Spark SQL: views, UDFs, Hive & Glue Catalog compat': [
    { label: 'Spark SQL & UDFs with Glue Catalog', channel: 'BigDataSumit', url: 'https://www.youtube.com/@BigDataSumit' },
  ],
  'Performance debugging: Spark UI, GC, OOM diagnosis': [
    { label: 'Spark UI & Performance Tuning', channel: 'BigDataSumit', url: 'https://www.youtube.com/@BigDataSumit' },
    { label: 'Debugging Spark Applications', channel: 'Databricks', url: 'https://www.youtube.com/@Databricks' },
  ],
  'Databricks Delta Live Tables (DLT) basics': [
    { label: 'Delta Live Tables (DLT) Introduction', channel: 'Databricks', url: 'https://www.youtube.com/@Databricks' },
  ],

  /* ── Apache Airflow ──────────────────────────────────────────────── */
  'DAGs, Operators, Tasks, Executors, XComs': [
    { label: 'Introduction to Airflow DAGs & Operators', channel: 'DataTalksClub', url: 'https://www.youtube.com/watch?v=0yK7LXwYeD0' },
    { label: 'Airflow Core Concepts — DAGs, XComs', channel: 'Marc Lamberti', url: 'https://www.youtube.com/@marclamberti' },
  ],
  'Scheduling: cron, data_interval_start, catchup': [
    { label: 'Airflow Scheduling & Catchup Strategy', channel: 'Marc Lamberti', url: 'https://www.youtube.com/@marclamberti' },
  ],
  'Operators: PythonOperator, BashOperator, GlueJobOperator': [
    { label: 'Airflow Operators Deep Dive', channel: 'Marc Lamberti', url: 'https://www.youtube.com/@marclamberti' },
    { label: 'Airflow with AWS Glue & EMR Operators', channel: 'Astronomer', url: 'https://www.youtube.com/@astronomerio' },
  ],
  'Task dependencies: >>, trigger_rule, branching': [
    { label: 'Airflow Task Dependencies & Trigger Rules', channel: 'Marc Lamberti', url: 'https://www.youtube.com/@marclamberti' },
  ],
  'Dynamic DAGs: dag_factory, variable-driven pipelines': [
    { label: 'Dynamic DAGs in Airflow', channel: 'Marc Lamberti', url: 'https://www.youtube.com/@marclamberti' },
  ],
  'Error handling: retries, on_failure_callback, SLAs': [
    { label: 'Airflow Error Handling, Retries & SLAs', channel: 'Marc Lamberti', url: 'https://www.youtube.com/@marclamberti' },
  ],
  'Sensors: S3KeySensor, ExternalTaskSensor, HttpSensor': [
    { label: 'Airflow Sensors Tutorial', channel: 'Marc Lamberti', url: 'https://www.youtube.com/@marclamberti' },
  ],
  'AWS MWAA: setup, environment class, S3 DAG bucket': [
    { label: 'Managed Airflow (MWAA) on AWS', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'Best practices: idempotency, atomicity, backfill safety': [
    { label: 'Airflow Best Practices — Idempotency & Atomicity', channel: 'Marc Lamberti', url: 'https://www.youtube.com/@marclamberti' },
    { label: 'Production Airflow Patterns', channel: 'Astronomer', url: 'https://www.youtube.com/@astronomerio' },
  ],
  'Testing DAGs locally: pytest-airflow, unit testing tasks': [
    { label: 'Testing Airflow DAGs with pytest', channel: 'Marc Lamberti', url: 'https://www.youtube.com/@marclamberti' },
  ],

  /* ── dbt ─────────────────────────────────────────────────────────── */
  'dbt project structure: models, sources, seeds, snapshots': [
    { label: 'Intro to dbt — First Project Walkthrough', channel: 'Kahan Data Solutions', url: 'https://www.youtube.com/watch?v=5rNquRnNb4E' },
    { label: 'dbt Project Structure & Models', channel: 'dbt Labs', url: 'https://www.youtube.com/@dbtlabs' },
  ],
  'Materialization: table, view, incremental, ephemeral': [
    { label: 'dbt Materializations Explained', channel: 'Kahan Data Solutions', url: 'https://www.youtube.com/@KahanDataSolutions' },
    { label: 'dbt Materializations — Official Guide', channel: 'dbt Labs', url: 'https://www.youtube.com/@dbtlabs' },
  ],
  'Incremental models: unique_key, is_incremental(), merge strategy': [
    { label: 'dbt Incremental Models Deep Dive', channel: 'Kahan Data Solutions', url: 'https://www.youtube.com/@KahanDataSolutions' },
    { label: 'Incremental Materializations in dbt', channel: 'dbt Labs', url: 'https://www.youtube.com/@dbtlabs' },
  ],
  'dbt tests: not_null, unique, accepted_values, relationships': [
    { label: 'dbt Tests — Data Quality Assertions', channel: 'Kahan Data Solutions', url: 'https://www.youtube.com/@KahanDataSolutions' },
    { label: 'dbt Testing Tutorial', channel: 'dbt Labs', url: 'https://www.youtube.com/@dbtlabs' },
  ],
  'Custom generic tests and singular tests': [
    { label: 'Custom & Singular Tests in dbt', channel: 'Kahan Data Solutions', url: 'https://www.youtube.com/@KahanDataSolutions' },
  ],
  'dbt docs: generate, serve, lineage DAG visualization': [
    { label: 'dbt Docs & Lineage DAG', channel: 'Kahan Data Solutions', url: 'https://www.youtube.com/@KahanDataSolutions' },
  ],
  'Jinja macros: ref(), source(), var(), env_var()': [
    { label: 'Jinja & Macros in dbt', channel: 'Kahan Data Solutions', url: 'https://www.youtube.com/@KahanDataSolutions' },
    { label: 'dbt Jinja + Macros Official Guide', channel: 'dbt Labs', url: 'https://www.youtube.com/@dbtlabs' },
  ],
  'dbt adapters: Redshift, Snowflake, Athena configs': [
    { label: 'dbt Adapters Configuration Guide', channel: 'dbt Labs', url: 'https://www.youtube.com/@dbtlabs' },
  ],
  'dbt Cloud vs dbt Core: CI/CD, Slim CI, job scheduling': [
    { label: 'dbt Cloud vs Core — CI/CD & Slim CI', channel: 'Kahan Data Solutions', url: 'https://www.youtube.com/@KahanDataSolutions' },
    { label: 'dbt Cloud Setup & Scheduling', channel: 'dbt Labs', url: 'https://www.youtube.com/@dbtlabs' },
  ],

  /* ── Data Warehousing ────────────────────────────────────────────── */
  'Redshift architecture: leader node, compute nodes, MPP': [
    { label: 'AWS Redshift Architecture Deep Dive', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'Distribution styles: EVEN, KEY, ALL — choosing correctly': [
    { label: 'Redshift Distribution Styles (EVEN/KEY/ALL)', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'Sort keys: compound vs interleaved, when to use each': [
    { label: 'Redshift Sort Keys — Compound vs Interleaved', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'COPY command: S3 → Redshift, manifest files, parallelism': [
    { label: 'Redshift COPY Command from S3', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'Redshift Spectrum: query S3 Iceberg/Parquet from SQL': [
    { label: 'Redshift Spectrum Tutorial', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'Redshift RA3: managed storage, AQUA query accelerator': [
    { label: 'Redshift RA3 & AQUA Overview', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'Redshift tuning: ANALYZE, VACUUM, system tables': [
    { label: 'Redshift Performance Tuning & VACUUM', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'BigQuery: partitioned tables, clustering, slot pricing': [
    { label: 'BigQuery Partitioning, Clustering & Cost', channel: 'Google Cloud Tech', url: 'https://www.youtube.com/@googlecloudtech' },
  ],
  'BigQuery BI Engine, materialized views, INFORMATION_SCHEMA': [
    { label: 'BigQuery BI Engine & Materialized Views', channel: 'Google Cloud Tech', url: 'https://www.youtube.com/@googlecloudtech' },
  ],
  'DWH cost optimization: formats, caching, compression': [
    { label: 'Data Warehouse Cost Optimization', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],

  /* ── Kafka & Streaming ───────────────────────────────────────────── */
  'Kafka internals: topics, partitions, segments, log compaction': [
    { label: 'Apache Kafka 101 (Full Playlist)', channel: 'Confluent', url: 'https://www.youtube.com/playlist?list=PLa7VYi0yPIH0KbnJQcMv5N9iW8HkZHztH' },
    { label: 'What is Kafka? — DE Zoomcamp', channel: 'DataTalksClub', url: 'https://www.youtube.com/watch?v=zPLZUDPi4AY' },
  ],
  'Producers: acks=0/1/all, idempotent, batch.size, linger.ms': [
    { label: 'Kafka Producer & Consumer (acks, batch)', channel: 'DataTalksClub', url: 'https://www.youtube.com/watch?v=aegTuyxX7Yg' },
    { label: 'Kafka Configuration Deep Dive', channel: 'DataTalksClub', url: 'https://www.youtube.com/watch?v=SXQtWyRpMKs' },
  ],
  'Consumers: consumer groups, rebalancing, commit strategies': [
    { label: 'Kafka Consumer Groups & Commit Strategies', channel: 'conduktor', url: 'https://www.youtube.com/@conduktor' },
    { label: 'Kafka 101 — Consumer Groups', channel: 'Confluent', url: 'https://www.youtube.com/playlist?list=PLa7VYi0yPIH0KbnJQcMv5N9iW8HkZHztH' },
  ],
  'Kafka Connect: source/sink connectors, Debezium CDC': [
    { label: 'Kafka Connect & Debezium CDC Tutorial', channel: 'conduktor', url: 'https://www.youtube.com/@conduktor' },
    { label: 'Kafka Connect Fundamentals', channel: 'Confluent', url: 'https://www.youtube.com/@Confluent' },
  ],
  'Kafka Streams vs Flink vs Spark Structured Streaming': [
    { label: 'Kafka Streams vs Flink vs Spark Streaming', channel: 'conduktor', url: 'https://www.youtube.com/@conduktor' },
  ],
  'Schema Registry: Avro/Protobuf schemas, compatibility modes': [
    { label: 'Kafka Schema Registry — DE Zoomcamp', channel: 'DataTalksClub', url: 'https://www.youtube.com/watch?v=tBY_hBuyzwI' },
    { label: 'Schema Registry & Avro Tutorial', channel: 'Confluent', url: 'https://www.youtube.com/playlist?list=PLa7VYi0yPIH0KbnJQcMv5N9iW8HkZHztH' },
  ],
  'Kinesis Data Streams: shards, sequence numbers, fan-out': [
    { label: 'Amazon Kinesis Data Streams Deep Dive', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'Kinesis Firehose: buffering, Lambda transform, S3 prefixes': [
    { label: 'Kinesis Data Firehose Tutorial', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'Kinesis Data Analytics (managed Flink): windows, checkpointing': [
    { label: 'Kinesis Data Analytics (Managed Flink)', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'MSK (Managed Kafka): setup, IAM auth, KMS encryption': [
    { label: 'AWS MSK — Managed Kafka Setup', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'Exactly-once semantics: idempotent producers, 2PC, Flink': [
    { label: 'Exactly-Once Semantics in Kafka & Flink', channel: 'Confluent', url: 'https://www.youtube.com/@Confluent' },
    { label: 'Kafka Exactly-Once Guide', channel: 'conduktor', url: 'https://www.youtube.com/@conduktor' },
  ],

  /* ── Delta Lake & Table Formats ──────────────────────────────────── */
  'Why table formats: ACID on object storage problem': [
    { label: 'Why Table Formats Exist (Delta/Iceberg/Hudi)', channel: 'Databricks', url: 'https://www.youtube.com/@Databricks' },
  ],
  'Delta Lake: transaction log, optimistic concurrency': [
    { label: 'Delta Lake Deep Dive — Transaction Log', channel: 'Databricks', url: 'https://www.youtube.com/@Databricks' },
  ],
  'Delta: MERGE, UPDATE, DELETE, VACUUM, OPTIMIZE, ZORDER': [
    { label: 'Delta Lake MERGE, VACUUM, OPTIMIZE, ZORDER', channel: 'Databricks', url: 'https://www.youtube.com/@Databricks' },
  ],
  'Delta time travel: VERSION AS OF, TIMESTAMP AS OF, RESTORE': [
    { label: 'Delta Lake Time Travel Tutorial', channel: 'Databricks', url: 'https://www.youtube.com/@Databricks' },
  ],
  'Apache Iceberg: snapshot model, manifest files, catalog': [
    { label: 'Apache Iceberg Architecture Explained', channel: 'Databricks', url: 'https://www.youtube.com/@Databricks' },
  ],
  'Iceberg on AWS: Glue Catalog, Athena v3 native DML': [
    { label: 'Iceberg on AWS with Glue & Athena v3', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'Partition evolution: change strategy without data rewrite': [
    { label: 'Iceberg Partition Evolution', channel: 'Databricks', url: 'https://www.youtube.com/@Databricks' },
  ],
  'Apache Hudi: CoW vs MoR, incremental queries, timeline': [
    { label: 'Apache Hudi CoW vs MoR Deep Dive', channel: 'Databricks', url: 'https://www.youtube.com/@Databricks' },
  ],
  'Delta vs Iceberg vs Hudi — decision matrix for interviews': [
    { label: 'Delta vs Iceberg vs Hudi Comparison', channel: 'Databricks', url: 'https://www.youtube.com/@Databricks' },
  ],

  /* ── AWS Glue, EMR & Lake Formation ─────────────────────────────── */
  'AWS Glue 4.0: DPUs, job bookmarks, triggers': [
    { label: 'AWS Glue ETL Deep Dive', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'Glue Data Catalog: databases, tables, crawlers, classifiers': [
    { label: 'Glue Data Catalog & Crawlers', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'Glue DPU types, auto-scaling, streaming ETL mode': [
    { label: 'Glue DPUs & Auto-Scaling Guide', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'EMR: cluster lifecycle, instance groups vs instance fleets': [
    { label: 'AWS EMR Cluster Architecture', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'EMR Spot instances: strategy, interruption handling': [
    { label: 'EMR Spot Instances Best Practices', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'EMR Serverless: job submission, worker config, auto-scale': [
    { label: 'EMR Serverless Tutorial', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'Lake Formation: permissions, column-level security, LF-TBAC': [
    { label: 'AWS Lake Formation Security Model', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'Lake Formation: cross-account data sharing, governed tables': [
    { label: 'Lake Formation Cross-Account Sharing', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'AWS Step Functions for DE: Map state, error handling': [
    { label: 'Step Functions for Data Pipelines', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],
  'EventBridge: trigger Glue/Step Functions on S3 events': [
    { label: 'EventBridge S3 Event Integration', channel: 'AWS Developers', url: 'https://www.youtube.com/@AWSDevelopers' },
  ],

  /* ── Distributed Systems ─────────────────────────────────────────── */
  'CAP theorem: Consistency, Availability, Partition tolerance': [
    { label: 'CAP Theorem Simplified', channel: 'ByteByteGo', url: 'https://www.youtube.com/watch?v=BHqjEjzAicA' },
  ],
  'ACID vs BASE: when relaxed consistency is acceptable': [
    { label: 'ACID Properties in Databases With Examples', channel: 'ByteByteGo', url: 'https://www.youtube.com/watch?v=GAe5oB742dw' },
  ],
  'Eventual consistency: read-your-writes, monotonic reads': [
    { label: 'Eventual Consistency Explained', channel: 'Arpit Bhayani', url: 'https://www.youtube.com/@ArpitBhayani' },
  ],
  'Replication: leader-follower, multi-master, conflict resolution': [
    { label: 'Database Replication Patterns', channel: 'ByteByteGo', url: 'https://www.youtube.com/@ByteByteGo' },
    { label: 'Replication Deep Dive', channel: 'Arpit Bhayani', url: 'https://www.youtube.com/@ArpitBhayani' },
  ],
  'Partitioning/sharding: range, hash, consistent hashing': [
    { label: 'Consistent Hashing | Algorithms You Should Know', channel: 'ByteByteGo', url: 'https://www.youtube.com/watch?v=UF9Iqmg94tk' },
    { label: 'Consistent Hashing in Distributed Systems', channel: 'Gaurav Sen', url: 'https://www.youtube.com/@gkcs' },
  ],
  'Exactly-once delivery: 2PC, idempotent consumers': [
    { label: '2PC & Exactly-Once Delivery', channel: 'Arpit Bhayani', url: 'https://www.youtube.com/@ArpitBhayani' },
    { label: 'Distributed Transactions & 2PC', channel: 'ByteByteGo', url: 'https://www.youtube.com/@ByteByteGo' },
  ],
  'Backpressure: flow control in streaming pipelines': [
    { label: 'Backpressure & Rate Limiting Patterns', channel: 'Arpit Bhayani', url: 'https://www.youtube.com/@ArpitBhayani' },
  ],

  /* ── System Design for DE ────────────────────────────────────────── */
  'Framework: Clarify → Estimate → High-level → Deep dive → Trade-offs': [
    { label: 'System Design Interview Framework', channel: 'ByteByteGo', url: 'https://www.youtube.com/@ByteByteGo' },
  ],
  'Design: URL shortener counting, News Feed fan-out': [
    { label: 'Design TinyURL / URL Shortener', channel: 'ByteByteGo', url: 'https://www.youtube.com/@ByteByteGo' },
    { label: 'News Feed System Design', channel: 'Gaurav Sen', url: 'https://www.youtube.com/@gkcs' },
  ],
  'Design: Real-time leaderboard with Kinesis + Redis': [
    { label: 'Real-Time Leaderboard System Design', channel: 'ByteByteGo', url: 'https://www.youtube.com/@ByteByteGo' },
  ],
  'Design: Data warehouse ingestion pipeline (SLA-driven)': [
    { label: 'Data Pipeline System Design Interview', channel: 'ByteByteGo', url: 'https://www.youtube.com/@ByteByteGo' },
  ],
  'Design: Event tracking system (mobile → S3 → Redshift)': [
    { label: 'Event Tracking System Design', channel: 'ByteByteGo', url: 'https://www.youtube.com/@ByteByteGo' },
  ],
  'Design: A/B testing data pipeline end-to-end': [
    { label: 'A/B Testing Platform System Design', channel: 'ByteByteGo', url: 'https://www.youtube.com/@ByteByteGo' },
  ],
  'Design: GDPR right-to-delete pipeline': [
    { label: 'GDPR Data Deletion Pipeline Design', channel: 'ByteByteGo', url: 'https://www.youtube.com/@ByteByteGo' },
  ],
  'Design: ML feature store (online + offline layers)': [
    { label: 'ML Feature Store System Design', channel: 'ByteByteGo', url: 'https://www.youtube.com/@ByteByteGo' },
  ],
  'Design: Metrics platform (aggregation + retention + funnels)': [
    { label: 'Metrics & Analytics Platform Design', channel: 'ByteByteGo', url: 'https://www.youtube.com/@ByteByteGo' },
  ],
  'Fault tolerance: idempotency, checkpointing, DLQs': [
    { label: 'Fault Tolerance in Distributed Systems', channel: 'Arpit Bhayani', url: 'https://www.youtube.com/@ArpitBhayani' },
    { label: 'Idempotency & Checkpointing Patterns', channel: 'ByteByteGo', url: 'https://www.youtube.com/@ByteByteGo' },
  ],
};

/* ─── Rich subtopic detail renderer ──────────────────────────────────── */
function RichDetail({ text }: { text: string }) {
  // Split on semicolons and sentence boundaries into individual bullets
  const bullets = text
    .split(/;\s*|(?<=\.)\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(s => s.length > 3);

  const getBulletMeta = (s: string) => {
    const lower = s.toLowerCase();
    if (/anti.?pattern|never use|avoid |don't |incorrect|wrong/i.test(s))
      return { icon: '⚠', color: 'text-orange-400', bg: 'bg-orange-950/30 border-orange-900/60' };
    if (/faang|interview|asked in|memorize|memorise/i.test(s))
      return { icon: '⭐', color: 'text-yellow-400', bg: 'bg-yellow-950/30 border-yellow-900/60' };
    if (/tip:|💡|pro tip|best practice|rule of thumb/i.test(s))
      return { icon: '💡', color: 'text-cyan-400', bg: 'bg-cyan-950/30 border-cyan-900/40' };
    if (/use when|prefer|instead|better|faster|efficient/i.test(s))
      return { icon: '✓', color: 'text-green-400', bg: 'bg-green-950/20 border-green-900/40' };
    return { icon: '›', color: 'text-neutral-500', bg: '' };
  };

  // Highlight inline code tokens: UPPER_CASE, func(), x=y snippets, backtick, O(n)
  const highlightCode = (s: string) => {
    const parts = s.split(/(`[^`]+`|[A-Z][A-Z_0-9]{2,}(?:\([^)]*\))?|[a-zA-Z_]+\([^)]*\)(?:\.[a-zA-Z_]+\([^)]*\))*|O\([^)]+\))/g);
    return parts.map((part, i) => {
      const isCode =
        /^`[^`]+`$/.test(part) ||
        /^[A-Z][A-Z_0-9]{2,}(\([^)]*\))?$/.test(part) ||
        /^[a-zA-Z_]+\([^)]*\)/.test(part) ||
        /^O\([^)]+\)$/.test(part);
      if (isCode) {
        const clean = part.replace(/^`|`$/g, '');
        return (
          <code key={i} className="text-[11px] font-mono bg-[#0d1f2d] text-[#00d4ff] px-1.5 py-0.5 rounded mx-0.5 border border-[#00d4ff]/30 whitespace-nowrap">
            {clean}
          </code>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="px-3 pb-4 pt-3 border-t border-neutral-800/50 space-y-2">
      {bullets.map((bullet, i) => {
        const { icon, color, bg } = getBulletMeta(bullet);
        return (
          <div
            key={i}
            className={`flex gap-2.5 leading-relaxed rounded-lg px-3 py-2 ${
              bg ? `border ${bg}` : 'hover:bg-neutral-800/40'
            } transition-colors`}
          >
            <span className={`flex-shrink-0 font-bold mt-0.5 text-sm w-4 text-center ${color}`}>{icon}</span>
            <p className="text-[13px] text-neutral-300 leading-relaxed font-normal">{highlightCode(bullet)}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Inline CopyButton ─────────────────────────────────────────────── */
function CopyBtn({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 text-[10px] text-muted hover:text-accent border border-neutral-700 hover:border-accent px-1.5 py-0.5 rounded transition-colors"
    >
      {copied ? <Check className="w-2.5 h-2.5 text-success" /> : <Copy className="w-2.5 h-2.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

interface Topic {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedHours: number;
  subtopics: { name: string; detail: string }[];
}

interface Phase {
  id: string;
  number: number;
  name: string;
  description: string;
  topics: Topic[];
}

interface FileFormat {
  id: string;
  name: string;
  icon: string;
  useCase: string;
  pros: string[];
  cons: string[];
  category: 'batch' | 'streaming' | 'analytics' | 'general';
  awsServices: string[];
  sparkCode: string;
  awsPipeline: string;
}

const AWS_SERVICE_COLORS: Record<string, string> = {
  S3: 'bg-green-500/20 text-green-400',
  Glue: 'bg-blue-500/20 text-blue-400',
  Athena: 'bg-purple-500/20 text-purple-400',
  EMR: 'bg-orange-500/20 text-orange-400',
  Redshift: 'bg-red-500/20 text-red-400',
  Kinesis: 'bg-yellow-500/20 text-yellow-400',
  Lambda: 'bg-cyan-500/20 text-cyan-400',
  'Step Functions': 'bg-pink-500/20 text-pink-400',
  'Lake Formation': 'bg-teal-500/20 text-teal-400',
};

const FILE_FORMATS: FileFormat[] = [
  {
    id: 'csv',
    name: 'CSV',
    icon: '📄',
    useCase: 'Simple flat files, data exchange, small datasets',
    pros: ['Human readable', 'Universal support', 'Easy to debug'],
    cons: ['No schema enforcement', 'Slow for large data', 'No compression'],
    category: 'general',
    awsServices: ['S3', 'Glue', 'Athena', 'Redshift'],
    sparkCode: `# Read CSV\ndf = spark.read.option("header", "true").csv("s3://bucket/data.csv")\n\n# Write CSV\ndf.write.option("header", "true").csv("s3://bucket/output/")`,
    awsPipeline: `CSV on AWS:\n1. Upload to S3\n2. Glue Crawler → auto-detect schema\n3. Athena → query with SQL\n4. Alternative: Redshift COPY command\n\nS3 → Glue Catalog → Athena (query) → S3 (results)`,
  },
  {
    id: 'json',
    name: 'JSON',
    icon: '🗂️',
    useCase: 'Semi-structured data, APIs, nested data',
    pros: ['Flexible schema', 'Human readable', 'Native API format'],
    cons: ['Verbose', 'Slow parsing', 'No type safety'],
    category: 'general',
    awsServices: ['S3', 'Glue', 'Athena', 'Lambda', 'Kinesis'],
    sparkCode: `# Read JSON\ndf = spark.read.json("s3://bucket/data.json")\n\n# Write JSON\ndf.write.json("s3://bucket/output/")\n\n# Flatten nested\ndf.select("user.id", "user.name")`,
    awsPipeline: `JSON on AWS:\n1. Kinesis → real-time ingestion\n2. Lambda → transform/flatten\n3. S3 → store processed\n4. Athena → query\n\nKinesis → Lambda → S3 → Athena`,
  },
  {
    id: 'parquet',
    name: 'Parquet',
    icon: '🗃️',
    useCase: 'Analytics, columnar reads, large datasets — default choice',
    pros: ['Columnar storage', 'Excellent compression', 'Schema enforcement', 'Predicate pushdown'],
    cons: ['Not human readable', 'Requires Spark/tools to read'],
    category: 'analytics',
    awsServices: ['S3', 'Glue', 'Athena', 'EMR', 'Redshift'],
    sparkCode: `# Read Parquet\ndf = spark.read.parquet("s3://bucket/data/")\n\n# Write Parquet (partitioned)\ndf.write\\\n  .partitionBy("year", "month")\\\n  .parquet("s3://bucket/output/")`,
    awsPipeline: `Parquet (recommended for analytics):\n1. EMR/Glue → convert CSV/JSON to Parquet\n2. S3 → store partitioned by date\n3. Glue Data Catalog → register\n4. Athena → fast columnar queries\n\nSource → Glue ETL → S3/Parquet → Athena`,
  },
  {
    id: 'avro',
    name: 'Avro',
    icon: '📦',
    useCase: 'Schema evolution, Kafka serialization, row-based storage',
    pros: ['Schema evolution', 'Compact binary', 'Great for Kafka', 'Language agnostic'],
    cons: ['Row-oriented (slow analytics)', 'Requires schema registry'],
    category: 'streaming',
    awsServices: ['Kinesis', 'Glue', 'EMR', 'S3'],
    sparkCode: `# Read Avro (requires spark-avro)\ndf = spark.read.format("avro").load("s3://bucket/data/")\n\n# Write Avro\ndf.write.format("avro").save("s3://bucket/output/")`,
    awsPipeline: `Avro on AWS:\n1. Kafka/Kinesis → Avro serialized events\n2. AWS Glue Schema Registry → manage schemas\n3. EMR → process Avro\n4. Convert to Parquet for analytics\n\nKinesis (Avro) → Glue Schema Registry → EMR → S3/Parquet`,
  },
  {
    id: 'orc',
    name: 'ORC',
    icon: '🗄️',
    useCase: 'Hive, columnar analytics, Hadoop ecosystem',
    pros: ['Excellent compression', 'Hive native', 'ACID support', 'Predicate pushdown'],
    cons: ['Hive-centric ecosystem', 'Less popular than Parquet outside Hive'],
    category: 'analytics',
    awsServices: ['EMR', 'Glue', 'Athena', 'S3'],
    sparkCode: `# Read ORC\ndf = spark.read.orc("s3://bucket/data/")\n\n# Write ORC\ndf.write.orc("s3://bucket/output/")\n\n# With Hive\ndf.write.saveAsTable("my_table")`,
    awsPipeline: `ORC on AWS:\n1. EMR with Hive → native ORC support\n2. S3 → store ORC files\n3. Glue → catalog ORC tables\n4. Athena → supports ORC queries\n\nHive (EMR) → ORC on S3 → Athena`,
  },
  {
    id: 'delta',
    name: 'Delta Lake',
    icon: '△',
    useCase: 'ACID transactions, upserts, data lakehouse',
    pros: ['ACID transactions', 'Time travel', 'Schema evolution', 'Upserts/deletes'],
    cons: ['Databricks-native', 'Extra metadata overhead'],
    category: 'analytics',
    awsServices: ['EMR', 'S3', 'Glue', 'Lake Formation'],
    sparkCode: `# Read Delta\ndf = spark.read.format("delta").load("s3://bucket/delta_table/")\n\n# Write Delta\ndf.write.format("delta")\\\n  .mode("overwrite")\\\n  .save("s3://bucket/delta_table/")\n\n# Upsert (MERGE)\nfrom delta.tables import DeltaTable\ntarget = DeltaTable.forPath(spark, "s3://bucket/delta/")\ntarget.merge(source, "target.id = source.id")\\\n  .whenMatchedUpdateAll()\\\n  .whenNotMatchedInsertAll()\\\n  .execute()`,
    awsPipeline: `Delta Lake on AWS:\n1. EMR with Delta Lake library\n2. S3 → store Delta log + data\n3. Glue → catalog Delta tables\n4. Lake Formation → access control\n\nEMR → Delta on S3 → Athena (via manifest) → BI tools`,
  },
  {
    id: 'iceberg',
    name: 'Iceberg',
    icon: '🧊',
    useCase: 'Open table format, ACID at scale, multi-engine support',
    pros: ['Open standard', 'Multi-engine (Spark/Athena/Flink)', 'Time travel', 'Partition evolution'],
    cons: ['Newer ecosystem', 'Complex metadata'],
    category: 'analytics',
    awsServices: ['S3', 'Athena', 'EMR', 'Glue', 'Lake Formation'],
    sparkCode: `# Read Iceberg\ndf = spark.read.format("iceberg").load("s3://bucket/table")\n\n# Write Iceberg\ndf.write.format("iceberg")\\\n  .mode("append")\\\n  .save("s3://bucket/table")\n\n# Time travel\nspark.read.option("as-of-timestamp", "2024-01-01")\\\n  .format("iceberg").load("s3://bucket/table")`,
    awsPipeline: `Iceberg on AWS (AWS native):\n1. S3 → data + metadata\n2. Glue Data Catalog → Iceberg tables\n3. Athena v3 → native Iceberg SQL\n4. EMR → Spark + Iceberg\n\nGlue Catalog → Athena INSERTS → S3/Iceberg → Analytics`,
  },
  {
    id: 'jsonl',
    name: 'JSONL',
    icon: '📋',
    useCase: 'Log files, streaming output, one JSON per line',
    pros: ['Streaming friendly', 'Easy append', 'Human readable'],
    cons: ['Not compressed', 'Slower than binary formats'],
    category: 'streaming',
    awsServices: ['S3', 'Kinesis', 'Lambda', 'Athena'],
    sparkCode: `# Read JSONL\ndf = spark.read.json("s3://bucket/logs/*.jsonl")\n\n# Write JSONL\ndf.write.json("s3://bucket/output/")\n\n# Python\nimport json\nwith open("data.jsonl") as f:\n    records = [json.loads(line) for line in f]`,
    awsPipeline: `JSONL on AWS:\n1. Kinesis Firehose → write JSONL to S3\n2. Lambda → process each record\n3. Athena → query with json serde\n\nKinesis Firehose → S3/JSONL → Athena`,
  },
  {
    id: 'protobuf',
    name: 'Protobuf',
    icon: '⚡',
    useCase: 'High-performance serialization, gRPC, microservices',
    pros: ['Very fast', 'Compact', 'Strong typing', 'gRPC native'],
    cons: ['Not human readable', 'Requires .proto schema files'],
    category: 'streaming',
    awsServices: ['Kinesis', 'Lambda', 'S3', 'EMR'],
    sparkCode: `# Protobuf with Python\nfrom google.protobuf import message_factory\n\n# Read from Kinesis (bytes)\ndef process_record(data: bytes):\n    msg = MyProto()\n    msg.ParseFromString(data)\n    return msg\n\n# Convert to Spark DataFrame\nrdd = sc.parallelize(proto_records)\ndf = rdd.map(lambda x: Row(**x)).toDF()`,
    awsPipeline: `Protobuf on AWS:\n1. Services emit Protobuf over Kinesis\n2. Lambda → deserialize + transform\n3. Convert to Parquet → store in S3\n4. Athena for querying\n\nKinesis (Protobuf) → Lambda (deserialize) → S3/Parquet → Athena`,
  },
  {
    id: 'arrow',
    name: 'Apache Arrow',
    icon: '🏹',
    useCase: 'In-memory columnar format, zero-copy reads, ML pipelines',
    pros: ['Zero-copy data sharing', 'Fast in-memory', 'Language agnostic', 'Pandas/Spark compatible'],
    cons: ['In-memory (not for storage)', 'Less common end-to-end'],
    category: 'analytics',
    awsServices: ['EMR', 'Lambda', 'S3'],
    sparkCode: `# Arrow in PySpark\nimport pyarrow as pa\nimport pyarrow.parquet as pq\n\n# Read Parquet as Arrow\ntable = pq.read_table("s3://bucket/data.parquet")\n\n# To Pandas (zero-copy)\ndf = table.to_pandas()\n\n# Spark ↔ Arrow\nspark.conf.set("spark.sql.execution.arrow.enabled", "true")`,
    awsPipeline: `Arrow on AWS:\n1. EMR → use Arrow for fast Pandas conversions\n2. Lambda → use PyArrow for lightweight processing\n3. Store as Parquet (Arrow IPC → Parquet)\n\nS3/Parquet → PyArrow → Lambda (transform) → S3`,
  },
  {
    id: 'xml',
    name: 'XML',
    icon: '📝',
    useCase: 'Legacy systems, config files, SOAP APIs',
    pros: ['Universal legacy support', 'Self-describing', 'Human readable'],
    cons: ['Very verbose', 'Slow parsing', 'Complex schema (XSD)'],
    category: 'batch',
    awsServices: ['S3', 'Glue', 'Lambda'],
    sparkCode: `# XML with PySpark (spark-xml library)\ndf = spark.read\\\n  .format("com.databricks.spark.xml")\\\n  .option("rowTag", "record")\\\n  .load("s3://bucket/data.xml")\n\n# Python ElementTree\nimport xml.etree.ElementTree as ET\ntree = ET.parse("data.xml")`,
    awsPipeline: `XML on AWS:\n1. S3 → store XML files\n2. Lambda → parse with ElementTree\n3. Convert to JSON/Parquet\n4. Glue → catalog transformed data\n\nS3/XML → Lambda (parse) → S3/JSON → Glue → Athena`,
  },
  {
    id: 'hdf5',
    name: 'HDF5',
    icon: '🔬',
    useCase: 'Scientific data, ML model storage, large numerical datasets',
    pros: ['Hierarchical structure', 'Excellent for numerical arrays', 'Fast random access'],
    cons: ['Niche (scientific/ML)', 'Not HDFS compatible', 'Single-writer limitation'],
    category: 'batch',
    awsServices: ['S3', 'EMR', 'Lambda'],
    sparkCode: `# HDF5 in Python\nimport h5py\nimport numpy as np\n\n# Write\nwith h5py.File("data.h5", "w") as f:\n    f.create_dataset("matrix", data=np.random.rand(1000, 100))\n\n# Read\nwith h5py.File("data.h5", "r") as f:\n    matrix = f["matrix"][:]\n\n# S3 + h5py\nimport s3fs\nfs = s3fs.S3FileSystem()\nwith fs.open("bucket/data.h5") as f:\n    data = h5py.File(f, "r")`,
    awsPipeline: `HDF5 on AWS:\n1. S3 → store .h5 files\n2. EMR (h5py) → process large arrays\n3. Lambda → lightweight reads via s3fs\n4. Convert to Parquet for SQL queries\n\nS3/HDF5 → EMR (Python h5py) → S3/Parquet → Athena`,
  },
];

const PHASES: Phase[] = [
  {
    id: 'foundation',
    number: 1,
    name: 'Foundation (Days 1–22)',
    description: 'Build unbreakable core fundamentals — SQL, Python, Cloud basics, Data Modeling. Every FAANG DE role tests these.',
    topics: [
      {
        id: 'sql-mastery',
        name: 'SQL Mastery — Window Functions, CTEs & Optimization',
        difficulty: 'Medium',
        estimatedHours: 40,
        subtopics: [
          { name: 'ROW_NUMBER / RANK / DENSE_RANK / NTILE', detail: 'ROW_NUMBER is always unique; RANK skips after ties (1,1,3); DENSE_RANK has no gaps (1,1,2); NTILE(n) splits rows into n equal buckets. Used for top-N-per-group, deduplication, and percentile segmentation — asked in nearly every FAANG SQL screen.' },
          { name: 'LAG / LEAD / FIRST_VALUE / LAST_VALUE', detail: 'LAG/LEAD access prior/next row values — essential for day-over-day change and session gap detection. FIRST_VALUE returns the partition\'s first value; LAST_VALUE requires an explicit ROWS BETWEEN UNBOUNDED FOLLOWING frame or it silently returns the current row.' },
          { name: 'Running totals, moving averages, cumulative sums', detail: 'SUM OVER (ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) = cumulative total. AVG OVER (ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) = 7-day rolling avg. Partition by year for YTD that resets on Jan 1. ROWS is faster and more predictable than RANGE for time-series windows.' },
          { name: 'CTEs vs subqueries vs temp tables — when to use each', detail: 'CTEs improve readability and support recursive queries; PostgreSQL 12+ inlines them like subqueries. Temp tables support indexes — use when referencing a large intermediate result 3+ times. Correlated subqueries run once per outer row (O(n)) — always rewrite as a JOIN for performance.' },
          { name: 'EXPLAIN ANALYZE, query plans, index vs seq scans', detail: 'EXPLAIN (ANALYZE, BUFFERS) shows actual vs estimated row counts per node. Seq Scan on a large table = missing index. Mismatch between rows= (estimate) and actual rows = stale stats — fix with ANALYZE. Nested Loop on large tables = add index on the inner table join column or hint a Hash Join.' },
          { name: 'Composite indexes, covering indexes, partial indexes', detail: 'Composite index (a,b,c) only accelerates queries starting with column a — the left-prefix rule. Covering index adds INCLUDE(b,c) to enable index-only scans with zero heap access. Partial index (WHERE status=\'active\') is small, fast, and only helps queries that match the predicate.' },
          { name: 'PARTITION BY on large tables — storage design patterns', detail: 'Storage-level partitioning physically splits data into segments. Athena prunes S3 partitions when you filter on the partition key — year/month/day is the standard. Anti-patterns: partitioning on user_id (millions of tiny files), or querying without filtering on the partition column.' },
          { name: 'MERGE / UPSERT patterns — SCD Type 1 & 2', detail: 'SCD Type 1: overwrite using ON CONFLICT DO UPDATE (PostgreSQL) or DELETE+INSERT (Redshift). SCD Type 2: new row with is_current=true, expire old row with expiry_date=today-1. Add a composite index on (customer_id, is_current) to avoid full table scans on current-row lookups.' },
          { name: 'SQL for DE interviews: retention, funnel, DAU/MAU', detail: '30-day retention: cohort CTE + LEFT JOIN on exactly day-30 date (never INNER JOIN). Funnel: COUNT(DISTINCT CASE WHEN step=\'X\' THEN user_id END) for each step. Longest streak: date minus ROW_NUMBER gives same constant for consecutive days — memorize this pattern.' },
          { name: 'Resources', detail: 'Mode Analytics SQL Tutorial: 12 hands-on lessons with real datasets. LeetCode Hard SQL: problems 185, 262, 601, 615, 1336, 1767 are most asked at FAANG. StrataScratch: filter by Meta, Uber, Airbnb and difficulty=Hard — best interview simulation available.' },
        ],
      },
      {
        id: 'python-data',
        name: 'Python for Data Engineering',
        difficulty: 'Easy',
        estimatedHours: 30,
        subtopics: [
          { name: 'Pandas: groupby, merge, pivot_table, melt, apply', detail: 'groupby().agg({\'col\': [\'sum\',\'mean\',\'count\']}) chains multiple aggregations. merge() uses left/right/inner/outer joins identical to SQL semantics. pivot_table and melt are inverse — pivot goes long→wide, melt goes wide→long. Never use apply(func, axis=1) on large DFs — it iterates row-by-row in Python.' },
          { name: 'Pandas performance: vectorization vs loops, chunked reads', detail: 'Vectorized operations (df[\'col\'] + 1) execute in compiled C at 100–1000× vs Python loops. For per-row logic, use np.vectorize or boolean masks. pd.read_csv(chunksize=100000) processes files larger than RAM by yielding one chunk at a time — essential for large S3 files on a Lambda.' },
          { name: 'List comprehensions, generators, itertools, functools', detail: '[x for x in lst if cond] is 2–5× faster than an appending for-loop. Generators (yield) process one item at a time with constant memory regardless of input size. itertools.chain(), groupby(), islice() and functools.reduce() compose lazy pipelines without loading everything into memory.' },
          { name: 'File I/O: CSV/JSON/Parquet with pandas & pyarrow', detail: 'pd.read_parquet() uses PyArrow under the hood — 10× faster than read_csv for analytics data. Always specify dtype= in read_csv to prevent silent object column inference. pyarrow.parquet.read_table(filters=[(\'col\', \'=\', val)]) does predicate pushdown — reads only matching row groups.' },
          { name: 'REST API calls with requests: pagination, rate limiting', detail: 'requests.get(url, params=params, headers=headers). Cursor-based pagination: loop while next_url is not None. Exponential backoff with tenacity: @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=4, max=60)). Use requests.Session() for connection pooling across many API calls.' },
          { name: 'Error handling patterns: retries, backoff, dead-letter queues', detail: 'Never silently swallow exceptions in a DE pipeline — always log the full stack trace. Write failed records to a dead-letter S3 prefix or SQS DLQ for manual inspection. tenacity library provides retry decorators with jitter — prevents thundering herd when many jobs fail simultaneously.' },
          { name: 'Logging, argparse, environment variables (.env)', detail: 'logging.getLogger(__name__) — hierarchical loggers, never print() in production pipelines. argparse for CLI ETL: --input-path, --output-path, --date flags. python-dotenv for local dev; AWS SSM Parameter Store or Secrets Manager for production secrets — never hardcode credentials.' },
          { name: 'Write a full ETL script: API → Pandas → Parquet → S3', detail: 'Combine: requests pagination → DataFrame concat → dtype casting → partition column added → df.to_parquet() → boto3 S3 upload with deterministic key. Add: progress logging per page, retry on HTTP 429/503, idempotent write (same partition path = safe to re-run without duplication).' },
          { name: 'Resources', detail: 'Wes McKinney\'s Python for Data Analysis (free with library OCLC card on O\'Reilly). Real Python: "Python Data Engineering" article series for practical patterns. Practice: build a daily job that pulls a public API and stores Parquet to a local MinIO bucket — end-to-end muscle memory.' },
        ],
      },
      {
        id: 'data-modeling',
        name: 'Data Modeling — Dimensional Design & Normalization',
        difficulty: 'Medium',
        estimatedHours: 25,
        subtopics: [
          { name: 'Star Schema: fact tables, dimension tables, grain', detail: 'Fact table holds numeric measurements (revenue, clicks) with FK references to dimensions. Grain = the atomic unit of one fact row — defining it precisely is the first step in every schema design. The most commonly tested modeling concept in DE interviews: "What is the grain of this fact table?"' },
          { name: 'Snowflake Schema vs Star Schema trade-offs', detail: 'Snowflake normalizes dimensions (city → state → country as separate tables). Star denormalizes into one wide dimension per entity. Star: faster queries (fewer joins), simpler SQL for analysts. Snowflake: lower storage, easier attribute updates. FAANG mostly uses Star or wide flat tables — not Snowflake.' },
          { name: 'SCD Type 1 (overwrite), Type 2 (versioned), Type 3 (prev value)', detail: 'Type 1: overwrite in place — simple but loses all history permanently. Type 2: add a new row with is_current flag + effective/expiry dates — full point-in-time history. Type 3: add a prev_city column — only one level of history. Type 2 is the universal answer for "how do you handle changing dimension attributes?"' },
          { name: 'Fact table types: transactional, periodic, accumulating', detail: 'Transactional: one row per event (order placed) — most common. Periodic snapshot: one row per time period per entity (account balance at month-end). Accumulating snapshot: one row per lifecycle instance updated in place as it progresses (order → shipped → delivered dates filled in over time).' },
          { name: 'Inmon (3NF) vs Kimball (dimensional) — when each applies', detail: 'Inmon: build a normalized 3NF EDW first, then data marts from it — flexible but slow BI queries. Kimball: build dimensional star schemas directly — fast BI but data duplication. Modern approach: dbt + Lakehouse often bypasses both in favor of wide event tables built incrementally with ref().' },
          { name: 'Data Vault 2.0: Hubs, Links, Satellites', detail: 'Hubs store unique business keys (customer_bk). Links capture relationships between hubs (customer + order). Satellites store descriptive attributes with full history and load dates. DV2 handles source schema changes without full reloads — used at FAANG scale where regulatory audit trails are mandatory.' },
          { name: 'Schema design from scratch: e-commerce, ride-sharing', detail: 'E-commerce: fact_orders (order_id, customer_key, product_key, date_key, revenue, qty), dim_customer (SCD2 with is_current), dim_product, dim_date. Ride-sharing: fact_trips (trip_id, driver_key, rider_key, start_date_key, fare, distance_km, duration_sec). Practice drawing these from memory.' },
          { name: 'Resources', detail: 'Kimball Group Design Tips (online, free) — 65 design tips, each a 2-minute read. "The Data Warehouse Toolkit" Chapters 1–3 cover the core patterns. dbt Learn Modeling module walks through practical e-commerce schema design from scratch using real dbt projects.' },
        ],
      },
      {
        id: 'cloud-basics',
        name: 'AWS Cloud Fundamentals for DE',
        difficulty: 'Easy',
        estimatedHours: 20,
        subtopics: [
          { name: 'S3: buckets, prefixes, versioning, lifecycle policies', detail: 'S3 stores objects at $0.023/GB/month with 11-nines durability — it is the foundation of every AWS data lake. S3 prefixes (not folders) are the partition key for Athena pruning: s3://bucket/year=2025/month=03/ cuts query scope 100×. Lifecycle policies automatically move data to Glacier after 90 days.' },
          { name: 'IAM: roles, policies, assume-role, least privilege', detail: 'IAM roles are assumed by services (Lambda, Glue, EC2) — never embed access keys in code. Least privilege: grant s3:GetObject on a specific bucket ARN, not s3:*. Cross-account: Account B grants a role that Account A can assume. Know this pattern cold — every DE security question involves IAM.' },
          { name: 'EC2: instance types, security groups, key pairs', detail: 'r5/r6g instances are memory-optimized — ideal for Spark executors. c5 is compute-optimized for CPU-heavy transforms. m5 is general purpose. Security groups = stateful virtual firewall rules. Key pairs enable SSH access into EMR master nodes for bootstrap debugging — essential operational knowledge.' },
          { name: 'VPC: subnets, NAT gateway, VPC endpoints', detail: 'VPC = isolated virtual network. Private subnets have no internet access — Glue/EMR jobs placing here must use NAT Gateway or VPC Endpoints to reach S3. Without NAT Gateway, jobs silently fail when pulling PyPI packages. NAT Gateway cost ($0.045/hr) is the cheapest DE configuration mistake.' },
          { name: 'CloudWatch: log groups, metrics, alarms for pipelines', detail: 'Every AWS service streams logs to CloudWatch Log Groups. Create metric alarms: Glue job failure rate > 0 → SNS notification → PagerDuty. Custom metrics via PutMetricData API: track records_processed per run for SLA dashboards. Always create a CloudWatch alarm before a pipeline goes to production.' },
          { name: 'AWS CLI: s3 cp, s3 sync, glue, cloudwatch commands', detail: 'aws s3 cp file.parquet s3://bucket/ — single object copy. aws s3 sync ./local/ s3://bucket/prefix/ — rsync-style, uploads only changed files. aws glue start-job-run --job-name my-etl --arguments \'{"--date":"2025-03-19"}\'. aws cloudwatch get-metric-statistics for SLA monitoring from scripts.' },
          { name: 'SAA-C03 core concepts (optional but recommended)', detail: 'Not required but signals seriousness to interviewers. DE-relevant SAA sections: S3, IAM, VPC, CloudWatch, Auto Scaling, and networking. Passing SAA-C03 means you understand AWS architecture at associate level — many FAANG DE teams ask foundational cloud architecture questions during interviews.' },
          { name: 'Resources', detail: 'AWS Cloud Practitioner Essentials (free on AWS Skill Builder): 6 hours covering all fundamentals. A Cloud Guru SAA-C03 course is the standard certification prep path. AWS Big Data Blog: free in-depth articles on S3, Glue, Athena best practices written by AWS service engineers.' },
        ],
      },
    ],
  },
  {
    id: 'core-de',
    number: 2,
    name: 'Core DE Tools (Days 23–52)',
    description: 'Master the daily tools of a senior DE — Spark, Airflow, dbt, and cloud data warehousing. These appear in 80% of FAANG interviews.',
    topics: [
      {
        id: 'apache-spark',
        name: 'Apache Spark / PySpark — Deep Dive',
        difficulty: 'Hard',
        estimatedHours: 50,
        subtopics: [
          { name: 'Architecture: Driver, Executors, DAG, Stages, Tasks', detail: 'Driver: single JVM that builds the logical DAG and dispatches tasks to executors. Executors: JVMs on worker nodes with N task slots (cores) each processing one partition. Never call collect() on large datasets — it pulls all data to the Driver and causes OOM. Understand this before any Spark tuning conversation.' },
          { name: 'RDD vs DataFrame vs Dataset — when to use which', detail: 'RDD: low-level, unoptimized — only for operations unavailable in DataFrame API. DataFrame: distributed table with Catalyst optimizer — always prefer in PySpark. Dataset: type-safe, Scala/Java only. In PySpark: DataFrames are the answer 100% of the time unless you need a custom partitioner.' },
          { name: 'Transformations vs Actions: lazy evaluation model', detail: 'Transformations (filter, map, join, groupBy) are lazy — they build the DAG but execute nothing. Actions (count, collect, write, show) trigger actual computation. Spark chains ALL transformations into one Catalyst-optimized physical plan before executing — this is why df.filter().groupBy().count() is efficient.' },
          { name: 'Narrow (map/filter) vs Wide (groupBy/join) transformations', detail: 'Narrow: data stays within the same partition (filter, select, withColumn) — fast, no network I/O. Wide: data moves across all partitions (groupBy, join, repartition) — triggers a shuffle which writes intermediate data to disk and sends it across the network. Each wide transformation creates a new stage boundary in the Spark DAG.' },
          { name: 'Reading/writing Parquet, Delta, Iceberg from S3', detail: 'spark.read.parquet(\'s3://...\') auto-applies partition pruning if partition columns exist in schema. Delta: spark.read.format(\'delta\').load(path). Iceberg: requires Glue or Hive catalog configuration. Always partitionBy(\'date\') on write and coalesce() files to avoid thousands of tiny output files.' },
          { name: 'Partitioning: repartition() vs coalesce()', detail: 'repartition(N): full shuffle to exactly N evenly-sized partitions — use to increase count or fix skew. coalesce(N): reduces partitions by merging adjacent, no shuffle — only for decreasing count. Target 128–256 MB per Spark partition. Too small = scheduling overhead; too large = executor OOM on wide operations.' },
          { name: 'Broadcast joins: autoBroadcastJoinThreshold', detail: 'When one table is small (< 10 MB by default), Spark copies it to every executor eliminating the shuffle of the large table. Force it: import broadcast; df.join(broadcast(small_df), ...). Increase threshold: spark.sql.autoBroadcastJoinThreshold=50MB. Single most impactful optimization for large-small table joins.' },
          { name: 'Shuffle tuning: shuffle.partitions, AQE (Spark 3)', detail: 'spark.sql.shuffle.partitions defaults to 200 — often wrong. Too low → OOM on large shuffles; too high → thousands of tiny tasks and scheduler overhead. AQE (Adaptive Query Execution, Spark 3): auto-adjusts partition count at runtime based on actual shuffle data sizes. Enable AQE: spark.sql.adaptive.enabled=true — always on in production.' },
          { name: 'Caching: cache() vs persist(), storage levels', detail: 'cache() = MEMORY_AND_DISK_2 (replicated). persist(StorageLevel) lets you choose: MEMORY_ONLY, DISK_ONLY, OFF_HEAP. Call unpersist() when done — Spark never automatically frees cached DataFrames. Rule: cache ONLY when the same DF is used 2+ times and computing it is expensive (e.g., after a shuffle).' },
          { name: 'Spark on AWS EMR: submit, cluster configs, Spot', detail: 'Submit with spark-submit or emr add-steps via CLI. Cluster config: 1 master (r5.4xlarge On-Demand) + N core nodes (r5.4xlarge Spot). EMR configuration API sets spark-defaults.conf. Bootstrap actions run shell scripts on every node — use for pip installs and custom config files at startup.' },
          { name: 'Spark Structured Streaming: sources, watermarks, triggers', detail: 'Reads from Kafka, Kinesis, S3 continuously. Watermarks: withWatermark(\'event_time\', \'1 hour\') defines how late data is tolerated before being dropped. Trigger: Trigger.ProcessingTime(\'5 minutes\') for micro-batch. Output modes: append (new rows only), update (changed rows), complete (full result table refreshed).' },
          { name: 'Spark SQL: views, UDFs, Hive & Glue Catalog compat', detail: 'createOrReplaceTempView(\'name\'): session-scoped view queryable via spark.sql(). UDFs: spark.udf.register — avoid for hot paths as they disable Catalyst optimization; prefer native Spark functions. Glue Data Catalog is Hive Metastore compatible — same Spark SQL queries work against Glue-registered tables.' },
          { name: 'Performance debugging: Spark UI, GC, OOM diagnosis', detail: 'Spark UI at port 4040: Stages tab for per-stage timing, Tasks for data skew (one task 10× slower). Storage tab: verify cached DFs. Executors tab: GC time > 10% = executor memory too small — increase spark.executor.memory. OOM on Driver: reduce collect() or increase driver memory.' },
          { name: 'Databricks Delta Live Tables (DLT) basics', detail: 'DLT is a declarative ETL framework: decorate Python functions with @dlt.table for Bronze/Silver/Gold layers. Quality constraints: expect(\'no_nulls\', \'id IS NOT NULL\') tracks and quarantines bad records. DLT auto-handles incremental processing, schema evolution, and dependency ordering. Used at Meta, Netflix, and Databricks customers.' },
          { name: 'Resources', detail: 'Learning Spark O\'Reilly (free PDF on Databricks website). Spark The Definitive Guide: Chapters 14–16 for advanced optimization. Official Databricks blog: AQE deep-dives and Delta OPTIMIZE guides. YouTube: "Spark Technical Interview Questions" by Data Engineering Simplified for interview-specific patterns.' },
        ],
      },
      {
        id: 'apache-airflow',
        name: 'Apache Airflow & AWS MWAA — Pipeline Orchestration',
        difficulty: 'Medium',
        estimatedHours: 35,
        subtopics: [
          { name: 'DAGs, Operators, Tasks, Executors, XComs', detail: 'DAG: Python file defining task dependencies as a directed acyclic graph — no loops allowed. Operators: PythonOperator, BashOperator, GlueJobOperator each define one Task. XComs: key-value store for passing small data between tasks (< 48 KB — never use for DataFrames). CeleryExecutor distributes tasks across remote worker nodes.' },
          { name: 'Scheduling: cron, data_interval_start, catchup', detail: 'schedule=\'0 2 * * *\' runs at 2am daily. data_interval_start is the logical start of the data window, NOT when the task runs. catchup=False: prevents backfilling missed runs since start_date on first deployment. catchup=True creates all missed runs immediately — almost always undesirable in production.' },
          { name: 'Operators: PythonOperator, BashOperator, GlueJobOperator', detail: 'PythonOperator: calls any Python callable with op_kwargs. BashOperator: runs shell scripts. GlueJobOperator: starts an AWS Glue ETL job and waits for completion (job_name, script_args). EMRStepOperator: submits a Spark step to an EMR cluster. S3ToRedshiftOperator: executes a COPY command directly.' },
          { name: 'Task dependencies: >>, trigger_rule, branching', detail: 'task_a >> task_b: b runs after a succeeds. [a, b] >> c: c waits for BOTH a and b. trigger_rule=TriggerRule.ALL_DONE: run even if upstream failed — useful for cleanup tasks. BranchPythonOperator: call a Python function that returns a task_id string representing which branch to execute next.' },
          { name: 'Dynamic DAGs: dag_factory, variable-driven pipelines', detail: 'Generate tasks from a config at import time: [PythonOperator(task_id=f\'process_{t}\') for t in TABLES]. dag_factory: YAML-config-driven DAG generation — one YAML = one DAG. Avoid heavy computation at module level since Airflow imports every DAG file on every scheduler heartbeat — keep imports fast and logic inside callables.' },
          { name: 'Error handling: retries, on_failure_callback, SLAs', detail: 'retries=3, retry_delay=timedelta(minutes=5) — auto-retry with delay. on_failure_callback: Python function called on failure — send Slack alert via webhook or trigger PagerDuty. SLA: sla=timedelta(hours=2) emails the SLA miss list if a task doesn\'t finish within 2 hours — critical for business reporting pipelines.' },
          { name: 'Sensors: S3KeySensor, ExternalTaskSensor, HttpSensor', detail: 'S3KeySensor: polls until s3://bucket/key exists — standard pattern for waiting on an upstream pipeline\'s output file. ExternalTaskSensor: waits until another DAG\'s TaskInstance reaches a success state. poke_interval controls check frequency (seconds). mode=\'reschedule\' is more efficient than poke for long-wait sensors.' },
          { name: 'AWS MWAA: setup, environment class, S3 DAG bucket', detail: 'MWAA environment: S3 bucket holds dags/, requirements.txt, plugins.zip. Environment class: mw1.small ($350/mo) to mw1.large ($1,400/mo). Workers auto-scale 1–10 instances. DAG changes take 30–60 seconds after S3 upload before Airflow picks them up. IAM execution role grants all AWS API access for GlueJobOperator, EMRStepOperator etc.' },
          { name: 'Best practices: idempotency, atomicity, backfill safety', detail: 'Idempotency: running the same DAG run twice produces the same result — achieve with S3 partition overwrite (not append), INSERT OVERWRITE in Redshift, MERGE (not INSERT) in Delta. Atomicity: write to a temp S3 prefix, validate row counts, then atomic rename/copy swap — never partially write to a production partition.' },
          { name: 'Testing DAGs locally: pytest-airflow, unit testing tasks', detail: 'pytest-airflow: assert dag.task_count, task.downstream_task_ids, default_args. Test individual tasks: with dag: task.test(execution_date). Mock Hooks and Connections in conftest.py to run unit tests without live AWS. Docker Compose Airflow setup for full local environment. GitHub Actions CI: dag-lint on every PR.' },
          { name: 'Resources', detail: 'Official Apache Airflow docs: Concepts page is the best reference for all core abstractions. astronomer.io guides: "Orchestrating Spark on EMR with Airflow" — practical and production-grade. Marc Lamberti blog: "Airflow Best Practices" series covers every real-world pattern you\'ll encounter.' },
        ],
      },
      {
        id: 'dbt',
        name: 'dbt (data build tool) — Transform Layer',
        difficulty: 'Medium',
        estimatedHours: 30,
        subtopics: [
          { name: 'dbt project structure: models, sources, seeds, snapshots', detail: 'models/: SQL files defining transformations, dependency graph built from ref() calls. sources.yml: declares raw upstream tables with freshness SLAs. seeds/: CSV files loaded as static lookup tables. snapshots/: SCD Type 2 history tracking for slowly changing sources. tests/: data quality assertions run after each build.' },
          { name: 'Materialization: table, view, incremental, ephemeral', detail: 'table: fully re-creates on each run — simplest, use for small final models. view: non-materialized, query runs at access time. incremental: appends/merges only new rows since last run — use when table > 1M rows. ephemeral: inlined as a CTE into the parent model, never persisted. Choosing wrong materialization = the most common dbt mistake.' },
          { name: 'Incremental models: unique_key, is_incremental(), merge strategy', detail: 'Add {% if is_incremental() %} WHERE updated_at > (SELECT MAX(updated_at) FROM {{this}}) {% endif %} to filter only new data. unique_key=\'order_id\' triggers a MERGE (upsert) instead of append-only insert. First run: full table rebuild. Subsequent runs: process only the incremental window — combine with Airflow for daily incremental loads.' },
          { name: 'dbt tests: not_null, unique, accepted_values, relationships', detail: 'Built-in generic tests defined in schema.yml: not_null catches missing required values, unique catches duplicates, accepted_values validates enums, relationships enforces FK integrity. Run with dbt test after dbt run. Add severity: error to fail the deployment on test failures — not just warn — for critical business columns.' },
          { name: 'Custom generic tests and singular tests', detail: 'Generic test in macros/: a Jinja macro with a test_ prefix that can be applied to any model column via YAML config (e.g., test_is_positive_number). Singular test: plain SQL in tests/ that returns rows only when the test FAILS — zero rows returned = pass. Use singular tests for complex business logic impossible to express generically.' },
          { name: 'dbt docs: generate, serve, lineage DAG visualization', detail: 'dbt docs generate: creates a static site with model descriptions, column descriptions, test results, and a lineage DAG visualization. dbt docs serve: local web server at localhost:8080. In dbt Cloud: hosted docs per environment updated automatically on every job run. Every Gold model should have a description: in schema.yml — critical for data discovery.' },
          { name: 'Jinja macros: ref(), source(), var(), env_var()', detail: 'ref(\'model_name\'): dependency injection — dbt builds the execution DAG from these calls and substitutes the correct schema/table name per target. source(\'schema\', \'table\'): references raw tables and enables freshness SLA checks. var(\'key\'): runtime variable passed via --vars CLI flag. env_var(\'SECRET\'): reads environment variable — use for credentials in profiles.yml.' },
          { name: 'dbt adapters: Redshift, Snowflake, Athena configs', detail: 'Each adapter has different incremental_strategy support. Redshift: uses delete+insert (no MERGE), DISTSTYLE and SORTKEY in model configs. Snowflake: automatic clustering, COPY-based loading. Athena: CTAS for table materialization, partitioned_by config for Parquet partition keys. Always check adapter docs — generic dbt features may not be available on every adapter.' },
          { name: 'dbt Cloud vs dbt Core: CI/CD, Slim CI, job scheduling', detail: 'dbt Core: open-source CLI, run inside Airflow/Step Functions/GitHub Actions. dbt Cloud: hosted UI with job scheduling, environment management, and Slim CI. Slim CI: dbt build --select state:modified+ runs only changed models and their dependents on each PR — 10× faster than a full rebuild. Use dbt Cloud for teams; dbt Core + Airflow for maximum control.' },
          { name: 'Resources', detail: 'dbt Learn (learn.getdbt.com): free official course with Jaffle Shop sample project — 3 hours covers 80% of real-world dbt usage. dbt Discourse community forum: most questions already answered. getdbt.com/blog: "The Analytics Engineering Guide" explains the philosophy and where dbt fits in the modern data stack.' },
        ],
      },
      {
        id: 'data-warehousing',
        name: 'Data Warehousing — Redshift & BigQuery Deep Dive',
        difficulty: 'Hard',
        estimatedHours: 40,
        subtopics: [
          { name: 'Redshift architecture: leader node, compute nodes, MPP', detail: 'Massively Parallel Processing: Leader node distributes query work; compute nodes execute in parallel on their local slices. Each compute node has multiple slices (virtual CPUs). Data distributed across slices by the DISTKEY hash. RA3: decouples compute and storage — storage lives in Redshift Managed Storage (S3-backed), not local disks.' },
          { name: 'Distribution styles: EVEN, KEY, ALL — choosing correctly', detail: 'KEY: hash-distribute on a column — co-locates matching rows on the same node, eliminating shuffle for that join pattern. EVEN: round-robin across all nodes — best default when no dominant join key. ALL: copy the full table to every node — use for small dimension tables (< 1M rows) joined frequently with every fact table query.' },
          { name: 'Sort keys: compound vs interleaved, when to use each', detail: 'Compound SORTKEY(a, b): fast range scans on the leading column a — best when queries always filter on a first. Interleaved SORTKEY(a, b): equal pruning weight on each column — better when queries filter on b alone, but slower VACUUM and higher maintenance. Use compound for 80% of cases; interleaved only with strong multi-column filter evidence.' },
          { name: 'COPY command: S3 → Redshift, manifest files, parallelism', detail: 'COPY table FROM \'s3://bucket/prefix/\' IAM_ROLE \'arn:...\' FORMAT AS PARQUET — most efficient bulk load method. Manifest file: explicit S3 file list — deterministic and audit-friendly, no risk of loading unexpected files. Parallelism: Redshift reads one file per slice — split inputs into 4× the node slice count for maximum throughput.' },
          { name: 'Redshift Spectrum: query S3 Iceberg/Parquet from SQL', detail: 'Spectrum lets Redshift SQL query external tables pointing to S3 Parquet, ORC, or Iceberg files. Priced at $5/TB scanned (same as Athena). Join hot Redshift tables with cold S3 lake data in one SQL statement. Spectrum compute runs on dedicated Spectrum nodes — does not compete with main cluster query concurrency.' },
          { name: 'Redshift RA3: managed storage, AQUA query accelerator', detail: 'RA3 nodes: choose compute size independently of storage capacity (fixed in ds2/dc2 era). Managed Storage auto-tiers hot data on NVMe SSD and warm/cold data on S3 — transparent to queries. AQUA (Advanced Query Accelerator): hardware-accelerated query cache on the storage nodes — transparent speedup for aggregation-heavy workloads, zero code changes required.' },
          { name: 'Redshift tuning: ANALYZE, VACUUM, system tables', detail: 'ANALYZE: updates column statistics used by the query planner — run after every large bulk load. VACUUM: reclaims space from deleted/updated rows and re-sorts data per SORTKEY — essential after frequent UPDATE/DELETE. VACUUM SORT ONLY: re-sort without reclaiming space (faster). Monitor via SVV_TABLE_INFO (sort/vacuum health) and STL_QUERY (query timing).' },
          { name: 'BigQuery: partitioned tables, clustering, slot pricing', detail: 'PARTITION BY DATE(event_time): automatic daily partitions reducing scan scope to queried days. CLUSTER BY user_id, event_type: sorts data within each partition — 90% cost reduction for high-cardinality filter queries. Slot-based pricing: on-demand=$6.25/TB scanned, flat-rate=dedicated compute slots. Always require partition filters to prevent full-table scans.' },
          { name: 'BigQuery BI Engine, materialized views, INFORMATION_SCHEMA', detail: 'BI Engine: in-memory analysis cache for sub-second dashboard queries — reserve up to 100 GB at $0.02/GB/hr. Materialized views: auto-refresh on source table update with incremental maintenance only touching changed data. INFORMATION_SCHEMA.JOBS: query billing history, slot usage, and execution time — essential for cost governance.' },
          { name: 'DWH cost optimization: formats, caching, compression', detail: 'Redshift: SORTKEY + DISTKEY alignment cuts query time 10× by eliminating data movement. Athena: Parquet + partitions = 100× cost reduction vs unpartitioned CSV ($5/TB → $0.05 for 10 GB scan). BigQuery: partition_expiration_days for automatic old-data deletion. Redshift Serverless: auto-scale RPUs eliminate idle-cluster cost for variable workloads.' },
          { name: 'Resources', detail: 'AWS Redshift Best Practices Guide (free PDF in AWS docs): the canonical reference for DISTKEY/SORTKEY design. BigQuery official Performance and Cost Optimization guides. Fivetran blog: "Redshift vs BigQuery" analysis for analytical workloads. Sisense blog: practical worked examples of dimensional schema design on Redshift.' },
        ],
      },
    ],
  },
  {
    id: 'advanced',
    number: 3,
    name: 'Advanced & AWS-Native (Days 53–74)',
    description: 'Streaming, Lakehouse formats, distributed systems theory, and AWS-native DE services that FAANG interviewers probe deeply.',
    topics: [
      {
        id: 'kafka-streaming',
        name: 'Kafka, Kinesis & Real-time Streaming',
        difficulty: 'Hard',
        estimatedHours: 45,
        subtopics: [
          { name: 'Kafka internals: topics, partitions, segments, log compaction', detail: 'A topic is an ordered, immutable log. Partitions enable parallelism — each is a separate ordered log on one broker. Segments are the physical files (log.0, log.1000.index) within partitions. Log compaction: retain only the latest value per key, deleting older duplicates. log.retention.ms controls when old segment files are deleted.' },
          { name: 'Producers: acks=0/1/all, idempotent, batch.size, linger.ms', detail: 'acks=0: fire-and-forget (data loss possible). acks=1: leader acknowledged only (leader can fail before replica). acks=all: all in-sync replicas confirmed (strongest guarantee). enable.idempotence=true: at-most-once deduplication — required for exactly-once. batch.size=16384 (fill before send) + linger.ms=5 (wait 5ms for batching) = higher throughput.' },
          { name: 'Consumers: consumer groups, rebalancing, commit strategies', detail: 'Consumer group: each partition is consumed by exactly one member — add consumers to scale up to the partition count. Rebalancing: partitions re-assigned when a consumer joins/leaves — causes brief processing pause. auto.commit=false: manual offset commit after processing for exactly-once guarantee. auto.offset.reset=earliest: start from beginning if no prior committed offset exists.' },
          { name: 'Kafka Connect: source/sink connectors, Debezium CDC', detail: 'Source connectors pull data FROM external systems into Kafka (JDBC source for DB tables). Sink connectors push data FROM Kafka to targets (S3 sink, Redshift sink, OpenSearch sink). Debezium: CDC source connector for PostgreSQL/MySQL — reads the write-ahead log and emits every INSERT/UPDATE/DELETE as a Kafka event with before/after values.' },
          { name: 'Kafka Streams vs Flink vs Spark Structured Streaming', detail: 'Kafka Streams: embedded library, no separate cluster, stateful with RocksDB — good for microservices. Flink: true streaming with exactly-once event-time semantics, sub-second latency, powerful windowing — best for complex stream analytics. Spark Structured Streaming: micro-batch by default, best for Spark-native teams — higher latency than Flink but simpler ops for batch-oriented teams.' },
          { name: 'Schema Registry: Avro/Protobuf schemas, compatibility modes', detail: 'Confluent Schema Registry: central catalog of Avro/Protobuf/JSON schemas per topic. Compatibility modes: BACKWARD (new schema reads old data), FORWARD (old reads new), FULL (both). Producers embed a 4-byte schema ID in each message header; consumers fetch the schema by ID to deserialize. Prevents breaking schema changes from corrupting downstream consumers.' },
          { name: 'Kinesis Data Streams: shards, sequence numbers, fan-out', detail: '1 shard = 1 MB/s write OR 1,000 records/s. Shared throughput: 2 MB/s read per shard split across all consumers. Enhanced fan-out: 2 MB/s dedicated per consumer via HTTP/2 push — eliminates contention between Lambda + Flink + S3 reading the same stream simultaneously. Sequence numbers are monotonic per shard — equivalent to Kafka offsets.' },
          { name: 'Kinesis Firehose: buffering, Lambda transform, S3 prefixes', detail: 'Firehose auto-scales — no shard management. Buffering: 60–900 seconds OR 1–128 MB, whichever arrives first. Inline Lambda transform: filter/enrich records before S3 write. Format conversion: reads schema from Glue Data Catalog and converts JSON → Parquet in-flight. No replay capability — it is fire-and-forget delivery to S3.' },
          { name: 'Kinesis Data Analytics (managed Flink): windows, checkpointing', detail: 'Fully managed Apache Flink on AWS. Tumbling windows: non-overlapping fixed intervals (count events per 1-min window). Sliding windows: overlapping (5-min window sliding every 1 min). Session windows: gap-based grouping with no fixed size. Flink checkpoints operator state to S3 every N seconds — on restart, processing resumes exactly from the last checkpoint.' },
          { name: 'MSK (Managed Kafka): setup, IAM auth, KMS encryption', detail: 'MSK provides standard Apache Kafka API — migrate from self-managed Kafka with zero code changes. IAM auth: AWS_MSK_IAM SASL mechanism replaces username/password. KMS encryption at rest. MSK Serverless: auto-scales capacity, no partition/shard planning. MSK Connect: managed Kafka Connect for CDC and S3 sink connectors without running Connect workers manually.' },
          { name: 'Exactly-once semantics: idempotent producers, 2PC, Flink', detail: 'At-most-once: data loss possible. At-least-once: duplicate processing possible. Exactly-once: no loss, no duplicates. Kafka: enable.idempotence=true + transactions API for atomic multi-partition writes. Flink: two-phase commit sink that only commits after Flink checkpoint succeeds. Spark: idempotent output path (overwrite) + checkpoint for at-least-once-effectively-exactly-once.' },
          { name: 'Resources', detail: 'Confluent Kafka tutorials (free): Kafka 101, Schema Registry 101 — hands-on and production-realistic. Kinesis Developer Guide: Enhanced Fan-Out and Aggregation/Deaggregation sections. "Designing Event-Driven Systems" by Ben Stopford (free PDF on Confluent website) — the best book on event streaming architecture.' },
        ],
      },
      {
        id: 'delta-lake',
        name: 'Delta Lake, Iceberg & Hudi — Open Table Formats',
        difficulty: 'Hard',
        estimatedHours: 35,
        subtopics: [
          { name: 'Why table formats: ACID on object storage problem', detail: 'Object storage (S3) has no atomic multi-file operations — two concurrent Spark writers silently corrupt each other\'s output. Table formats add a transaction log layer: all changes are atomic commits. This enables ACID guarantees, concurrent reads/writes, and time travel on plain S3 files without any database infrastructure.' },
          { name: 'Delta Lake: transaction log, optimistic concurrency', detail: 'Every DML (INSERT/UPDATE/DELETE/MERGE) writes a JSON commit file to _delta_log/. Each commit records which files were added/removed. Current table state = replay all log entries from 0. Optimistic concurrency: both writers commit in parallel; the loser detects a conflict and retries. CHECKPOINT files compact the log every 10 commits for fast recovery.' },
          { name: 'Delta: MERGE, UPDATE, DELETE, VACUUM, OPTIMIZE, ZORDER', detail: 'MERGE INTO target USING source ON key WHEN MATCHED THEN UPDATE WHEN NOT MATCHED THEN INSERT — the standard upsert. VACUUM: deletes unreferenced files older than retentionDuration (7-day default) to reclaim S3 storage. OPTIMIZE: compacts thousands of small files into ~1 GB files. ZORDER BY col: co-locates related data — often 10–100× query speedup.' },
          { name: 'Delta time travel: VERSION AS OF, TIMESTAMP AS OF, RESTORE', detail: 'SELECT * FROM delta.`s3://path/` VERSION AS OF 5 — queries snapshot at version 5. TIMESTAMP AS OF \'2025-01-01\' — state at a specific date. RESTORE to version: rolls back the entire table to a prior snapshot atomically. Time travel enables reproducible ML training datasets and audit queries for compliance.' },
          { name: 'Apache Iceberg: snapshot model, manifest files, catalog', detail: 'Iceberg maintains a chain: metadata.json → snapshot list → manifest list → manifest files → data files. Each write creates a NEW immutable snapshot; the metadata pointer atomically swaps to point to the new snapshot. Multiple engines can read concurrently because each reads from their own fixed snapshot — no table lock needed during writes.' },
          { name: 'Iceberg on AWS: Glue Catalog, Athena v3 native DML', detail: 'Glue Data Catalog supports Iceberg tables natively — no manifest trick required. Athena v3: native Iceberg SQL including INSERT INTO, MERGE INTO, DELETE WHERE, and time travel (FOR VERSION AS OF N). EMR 6.x: open-source Iceberg JAR for Spark. S3 Tables (2024): AWS-managed native Iceberg tables with automatic background compaction.' },
          { name: 'Partition evolution: change strategy without data rewrite', detail: 'Iceberg\'s key differentiator over Hive: ALTER TABLE ADD PARTITION FIELD date_bucket(ts, 30) changes the partition strategy on an existing table without rewriting any data files. Old files keep their original partition spec; new writes use the updated spec. Athena and Spark handle both transparently. This is impossible in Hive — changing partitioning requires a full data rewrite.' },
          { name: 'Apache Hudi: CoW vs MoR, incremental queries, timeline', detail: 'Copy-on-Write (CoW): rewrites the entire affected Parquet file on every update — best read performance. Merge-on-Read (MoR): appends delta logs, merges at read time — best write throughput for high-frequency CDC. Hudi Timeline: ordered list of commits, compactions, and cleans. GDPR delete: Hudi delete API removes specific recordKeys across all S3 partitions in minutes.' },
          { name: 'Delta vs Iceberg vs Hudi — decision matrix for interviews', detail: 'Delta: best Spark/Databricks integration, OPTIMIZE+ZORDER, most mature ecosystem — default for Databricks users. Iceberg: multi-engine (Spark+Flink+Trino+Athena+Redshift native), partition evolution, AWS-preferred — default for AWS-native pipelines. Hudi: GDPR deletes at scale, streaming upserts, CDC-friendly — default for Uber-style high-frequency update workloads.' },
          { name: 'Resources', detail: 'Delta Lake official docs: MERGE and OPTIMIZE pages are most DE-interview-relevant. Apache Iceberg docs: Partitioning and Branching sections. Onehouse.ai comparison blog: "Delta vs Iceberg vs Hudi 2024" — the best single-article comparison available. AWS re:Invent: "ANT336 — S3 Tables and Iceberg" session on YouTube for current AWS direction.' },
        ],
      },
      {
        id: 'aws-native-de',
        name: 'AWS-Native DE Services — Glue, EMR, Lake Formation',
        difficulty: 'Hard',
        estimatedHours: 40,
        subtopics: [
          { name: 'AWS Glue 4.0: DPUs, job bookmarks, triggers', detail: 'Glue 4.0 runs Spark 3.3.0 + Python 3.10. DPU types: G.1X (4 vCPU, 16 GB), G.2X (8 vCPU, 32 GB). Job bookmarks: track processed S3 files or DynamoDB items — safely resumes from exact checkpoint on failure restart. Glue triggers: schedule (cron), event (job completion), or on-demand — chain jobs without Airflow for simple pipelines.' },
          { name: 'Glue Data Catalog: databases, tables, crawlers, classifiers', detail: 'Hive Metastore compatible — tables defined in Catalog are queryable by Athena, Redshift Spectrum, and EMR without reconfiguration. Crawlers: run on schedule, auto-detect schema from S3/RDS/DynamoDB and register partitions. Classifiers: built-in for JSON/CSV/Parquet; custom grok patterns for unstructured log files with non-standard delimiters.' },
          { name: 'Glue DPU types, auto-scaling, streaming ETL mode', detail: 'G.025X: designed for Glue Streaming mode (micro-batch from Kinesis/MSK). Auto-scaling: Glue 4.0 dynamically scales between min/max DPUs based on pending task queue — cost-efficient for variable workloads. 10-minute minimum billing: don\'t use Glue for jobs shorter than 10 minutes — the cold start and minimum billing erases any cost advantage over Lambda.' },
          { name: 'EMR: cluster lifecycle, instance groups vs instance fleets', detail: 'Cluster lifecycle: Starting → Bootstrapping (bootstrap actions run) → Running → Terminating. Instance groups: Master (1 node), Core (HDFS storage + compute, cannot scale down), Task (compute only, safe to autoscale). Instance fleets: specify multiple EC2 types with Spot fulfillment — EMR picks from available capacity, preventing under-provisioning.' },
          { name: 'EMR Spot instances: strategy, interruption handling', detail: 'Request 5–10 EC2 instance types in an instance fleet. On Spot interruption, EMR automatically shifts to an available alternative type — maintains cluster capacity without manual intervention. Spot discount: 60–80% vs On-Demand. Rule: use Spot for Task nodes (compute only, re-assignable), On-Demand for Core nodes (losing Core Spot = potential data loss on HDFS).' },
          { name: 'EMR Serverless: job submission, worker config, auto-scale', detail: 'Submit Spark/Hive jobs without managing a cluster — workers auto-scale 0 → max per job. Pre-initialized capacity: keep N workers warm to eliminate cold start latency for time-sensitive jobs. Pricing: $0.052/vCPU-hr + $0.0057/GB-hr. Cheaper than Glue for large, long-running jobs; cheaper than EC2 clusters for bursty workloads without always-on cluster cost.' },
          { name: 'Lake Formation: permissions, column-level security, LF-TBAC', detail: 'Permissions stack: IAM first (can the principal make the API call?) then Lake Formation (is the principal granted access to this table/column?). Column security: GRANT SELECT ON TABLE t COLUMNS (col1, col2) — non-listed columns return NULL or are omitted. LF-TBAC: tag a column as sensitivity=PII, grant roles access by tag — auto-applies to all newly tagged columns without per-table grants.' },
          { name: 'Lake Formation: cross-account data sharing, governed tables', detail: 'Data producer account registers S3 as a data lake location. Consumer account admin accepts the RAM resource share. Consumer queries via Athena as if the table were local. Iceberg cross-account sharing: share a specific snapshot read-only — no data copied, no ETL needed. Foundation of data mesh architectures where each domain team publishes its own certified data products.' },
          { name: 'AWS Step Functions for DE: Map state, error handling', detail: 'Standard workflow: for multi-hour ETL chains with 1-year max run time. Express workflow: for 5-minute event-driven triggers. Map state: fan-out processing — run one Lambda invocation per S3 inventory file line, up to 40× concurrent at default. Catch → fallback state → SNS alert pattern for automated error notification without extra monitoring code.' },
          { name: 'EventBridge: trigger Glue/Step Functions on S3 events', detail: 'Create an EventBridge rule: s3:ObjectCreated on a specific prefix → target Step Functions or Glue job. EventBridge Scheduler: cron expression triggers Glue at 2am daily — replaces legacy CloudWatch Events. Fan-out: one S3 write event can simultaneously trigger Glue ETL + Lambda validation + SNS alert via separate rules pointing at the same source event.' },
          { name: 'Resources', detail: 'AWS Big Data Blog: free technical deep-dives by AWS service engineers — search Glue, EMR, Iceberg. re:Invent 2023 YouTube: ANT-series sessions for DE tools. AWS Skill Builder: "Data Engineering on AWS" learning plan. AWS Well-Architected Framework: Data Analytics Lens PDF — reference architecture for production DE systems.' },
        ],
      },
      {
        id: 'distributed-systems',
        name: 'Distributed Systems Theory for DE',
        difficulty: 'Hard',
        estimatedHours: 30,
        subtopics: [
          { name: 'CAP theorem: Consistency, Availability, Partition tolerance', detail: 'A distributed system can guarantee only 2 of 3: Consistency (all nodes see same data simultaneously), Availability (always responds), Partition tolerance (works despite network splits). Since network partitions always occur in practice, real systems choose CP (HBase, ZooKeeper) or AP (Cassandra, DynamoDB). DE relevance: explains why event stores may serve stale data during a partition.' },
          { name: 'ACID vs BASE: when relaxed consistency is acceptable', detail: 'ACID (Atomicity, Consistency, Isolation, Durability): guaranteed by traditional RDBMS and Delta Lake/Iceberg. BASE (Basically Available, Soft state, Eventually consistent): DynamoDB, Cassandra — trades consistency for scale. DE relevance: Kinesis is BASE (consumers may read slightly stale data). Delta Lake adds ACID semantics to S3 that was previously BASE.' },
          { name: 'Eventual consistency: read-your-writes, monotonic reads', detail: 'Read-your-writes: after your write, your next read sees that write (even if others don\'t yet). Monotonic reads: once you read a value, you never read an older value in a later request. Session consistency: within one user session, reads are consistent with your writes. Matters for building user-facing pipelines where stale dashboard data causes UX issues or trust problems.' },
          { name: 'Replication: leader-follower, multi-master, conflict resolution', detail: 'Leader-follower: one writable leader + N read replicas — most common (PostgreSQL, Kafka). Multi-master: multiple writable leaders with conflict resolution needed (active-active DynamoDB global tables). Conflict strategies: last-write-wins (LWW) by timestamp, vector clocks, CRDTs. Replication lag = time for leader write to propagate to all replicas — causes read-after-write inconsistency.' },
          { name: 'Partitioning/sharding: range, hash, consistent hashing', detail: 'Range sharding: records sorted by key (e.g., date ranges) — creates write hotspots when all recent writes hit the same shard. Hash sharding: distributes evenly by key hash — no ordering guarantee but eliminates hotspots. Consistent hashing (Cassandra, Kafka): adding/removing nodes only remaps 1/N of keys — minimal rebalancing overhead at scale.' },
          { name: 'Exactly-once delivery: 2PC, idempotent consumers', detail: 'At-most-once: possible data loss. At-least-once: possible duplicates, handled by idempotent consumers. Exactly-once: no loss, no duplicates. Kafka transactions: producer.initTransactions() + beginTransaction() + commitTransaction() for atomic multi-partition writes. Two-phase commit (2PC): coordinator-driven commit across multiple systems — expensive but true cross-system exactly-once.' },
          { name: 'Backpressure: flow control in streaming pipelines', detail: 'Consumer slower than producer: message queue (Kafka) absorbs the difference until retention fills. Unbounded queue → OOM eventually. Reactive Streams: standard backpressure protocol where consumers signal available capacity to producers, which pause when capacity is zero. Kinesis: automatically throttles reads when consumer lag exceeds 7 days of retention.' },
          { name: 'Resources', detail: '"Designing Data-Intensive Applications" (Kleppmann) Chapters 5 (Replication), 9 (Consistency & Consensus), 11 (Stream Processing) — the most important technical book for senior DE roles. Martin Fowler articles on Event Sourcing and CQRS. MIT 6.824 Distributed Systems course lecture notes (free at pdos.csail.mit.edu).' },
        ],
      },
    ],
  },
  {
    id: 'faang-ready',
    number: 4,
    name: 'FAANG Interview Prep (Days 75–90)',
    description: 'System design for DE, SQL hard problems, behavioral prep, and full mock interviews. The final sprint.',
    topics: [
      {
        id: 'system-design-de',
        name: 'System Design for Data Engineers',
        difficulty: 'Hard',
        estimatedHours: 40,
        subtopics: [
          { name: 'Framework: Clarify → Estimate → High-level → Deep dive → Trade-offs', detail: 'Always start by clarifying: data volume (events/sec, GB/day), latency SLA, reliability target (99.9% vs 99.99%), read/write ratio, and query access patterns. Estimate scale before drawing anything — this signals senior-level thinking. Skipping clarification and jumping to a solution is the #1 system design interview failure mode.' },
          { name: 'Design: URL shortener counting, News Feed fan-out', detail: 'URL shortener click counting: Kafka for click events → Flink tumbling window aggregation → Redis sorted set for real-time leaderboard → Spark batch for permanent counts in Redshift. News Feed: fan-out-on-write for small followings (< 1000); fan-out-on-read for celebrities — write to Cassandra, merge at query time to avoid write amplification.' },
          { name: 'Design: Real-time leaderboard with Kinesis + Redis', detail: 'User action → Kafka → Flink (per-user score aggregation with keyed state) → Redis ZADD (sorted set, O(log n) per update). API: ZREVRANGE for top-N. Flink checkpoints to S3 every 30s — restart resumes from last checkpoint. Redis ZADD handles millions of concurrent score updates and ZREVRANGE returns top-1000 in sub-millisecond.' },
          { name: 'Design: Data warehouse ingestion pipeline (SLA-driven)', detail: 'Latency SLA determines architecture: 1-hr SLA → Kinesis Firehose → S3 (5-min Parquet buffer) → Glue Catalog → Athena. 5-min SLA → Kinesis Data Streams → Lambda → S3 → trigger Glue. Real-time SLA → Flink on Kinesis Analytics → writes directly to Redshift or DynamoDB. Data quality: schema validation at ingest, bad records to DLQ, daily profiling.' },
          { name: 'Design: Event tracking system (mobile → S3 → Redshift)', detail: 'Mobile/web SDK → API Gateway → Kinesis Data Streams. Consumer 1: Lambda (validation + enrichment) → Kinesis Firehose (JSON→Parquet). Consumer 2: Flink (real-time aggregations) → Redis for dashboards. Firehose → S3 → Glue Catalog → Athena (ad-hoc) + Redshift Spectrum (BI). Deduplicate on event_id in Silver layer using MERGE.' },
          { name: 'Design: A/B testing data pipeline end-to-end', detail: 'Assignment: hash(user_id + experiment_id) % 100 → variant, logged in DynamoDB. Exposure events: SDK → Kinesis → S3 (Parquet). Metrics join: daily Spark job joins exposures + user metrics on user_id. Analysis: dbt model computes p-value, confidence intervals, minimum detectable effect. DE concern: CUPED for variance reduction, novelty effects, sequential testing for early stopping.' },
          { name: 'Design: GDPR right-to-delete pipeline', detail: 'Challenge: delete one user\'s data across petabytes of immutable S3 partitions. Solution 1: Hudi delete API — removes specific recordKey across all partitions without full file rewrite. Solution 2: Iceberg row-level delete files (positional deletes). Solution 3: pseudonymize at write time — deletion = delete only the key mapping table. Audit: CloudTrail + S3 delete markers for compliance evidence.' },
          { name: 'Design: ML feature store (online + offline layers)', detail: 'Offline: Delta/Iceberg table per feature group, time-travel for point-in-time correct training dataset generation. Online: Redis (<5ms serving latency) for inference features. Bridge: Spark batch job materializes offline feature tables → Redis pipeline. Feature consistency: use identical computation logic for both offline training and online serving — critical, often missed.' },
          { name: 'Design: Metrics platform (aggregation + retention + funnels)', detail: 'Real-time: Kinesis → Flink (per-dimension counters) → DynamoDB (dimension rollups). Historical: Spark daily job materializes cohort retention and funnel metrics into Gold Parquet tables. Query API: Redis cache with 1-min TTL for hot dashboard KPIs. Design for 10K+ concurrent dashboard users — pre-aggregation is the only scalable answer.' },
          { name: 'Fault tolerance: idempotency, checkpointing, DLQs', detail: 'Idempotency: write with deterministic S3 key (hash of job + date) — safe to retry without duplication. Checkpointing: Flink saves operator state to S3 every 30s — restart resumes exactly from last checkpoint. DLQ: Kinesis → SQS DLQ on Lambda failure → CloudWatch alarm → PagerDuty → human review. Circuit breaker: stop retrying after N consecutive failures to prevent cascade.' },
          { name: 'Resources', detail: 'ByteByteGo (Alex Xu): System Design Interview Vol 2 has dedicated DE chapters. DDIA Chapters 10–12 is the academic foundation — read this before any system design interview. Jordan has no life (YouTube): DE system design mock interview walkthroughs. Exponent DE interview guide: 25 worked system design questions for data engineers.' },
        ],
      },
      {
        id: 'sql-hard',
        name: 'SQL Hard Problems — FAANG Interview Patterns',
        difficulty: 'Hard',
        estimatedHours: 35,
        subtopics: [
          { name: 'Retention: D1/D7/D30 cohort analysis', detail: 'Cohort = user\'s first activity date. Pattern: WITH cohort AS (SELECT user_id, MIN(date) AS day0 FROM events GROUP BY user_id), retained AS (DISTINCT join on day0+30). Always LEFT JOIN to preserve users who didn\'t return — INNER JOIN silently loses non-retained users and inflates your retention rate.' },
          { name: 'Funnel conversion rates with ordered steps', detail: 'Standard funnel: COUNT(DISTINCT CASE WHEN step=\'X\' THEN user_id END) for each step, then divide N by N-1. Ordered funnel (step B must happen after A within session): requires LAG comparison or a temporal self-join — more complex than a simple CASE WHEN. Always use COUNT(DISTINCT user_id), not COUNT(*), to avoid counting repeated step visits.' },
          { name: 'DAU/WAU/MAU: rolling metrics with window functions', detail: 'DAU: COUNT(DISTINCT user_id) GROUP BY DATE. Rolling 7-day active: SUM(DAU) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW). MAU: COUNT(DISTINCT user_id) GROUP BY DATE_TRUNC(\'month\'). DAU/MAU stickiness ratio: how often monthly users return daily — core product health metric, typically 20–60% for consumer apps.' },
          { name: 'Session reconstruction from timestamp gaps', detail: 'Gap-based sessions: events with > 30-min gap from prior event start a new session. Pattern: LAG(event_time) to compute gap → CASE WHEN gap > 30 min THEN 1 ELSE 0 AS session_start_flag → cumulative SUM of session_start_flag per user = session_id. Used by nearly every consumer tech company in their event data layer.' },
          { name: 'Median without built-in function', detail: 'Standard: PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY col) — show this first. Manual approach for platforms without it: ROW_NUMBER() ASC + DESC, find where both numbers are equal (odd count) or differ by 1 (even count). Edge case: even count median = average of 2 middle rows — handle this explicitly or the interviewer will ask about it.' },
          { name: 'Graph queries: follower networks, friend suggestions', detail: 'Follower/following: self-join on the follows table. Friend suggestions = friends of friends not yet followed: triple JOIN or recursive CTE with depth limit. Common followers: INTERSECT between two users\' follower sets. SQL handles small-graph (< 1M edges) queries well; for multi-hop traversal at scale, switch to a graph database (Neo4j) or graph processing (GraphX).' },
          { name: 'Running totals with multiple dimensions', detail: 'Partitioned cumulative sum per user per category: SUM(amount) OVER (PARTITION BY user_id, category ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW). Complexity: sparse category-user combinations need a date spine cross-joined with all categories first, then LEFT JOIN actual data — otherwise missing dates break the running total calculation.' },
          { name: 'LeetCode SQL: problems 185, 262, 601, 615, 1336, 1767', detail: '185 (Dept Top 3 Salaries): DENSE_RANK with partition. 262 (Trips/Users): cancellation rate with JOIN + CASE WHEN. 601 (Stadium consecutive): self-join on row gaps. 615 (Avg Salary): global vs dept average cross-join. 1336 (Transactions per Visit): histogram with recursive CTE. Write each from memory in < 5 minutes — that\'s the FAANG benchmark.' },
          { name: 'Resources', detail: 'StrataScratch: filter by company (Meta, Uber, Lyft, Airbnb) + difficulty=Hard — most representative of real FAANG SQL interviews. DataLemur: questions with hints and step-by-step worked solutions — ideal for self-study. Analysts Obsession (YouTube): SQL interview walkthroughs explaining interviewer thought process behind every question.' },
        ],
      },
      {
        id: 'interview-patterns',
        name: 'Behavioral & DE-Specific Interview Patterns',
        difficulty: 'Medium',
        estimatedHours: 25,
        subtopics: [
          { name: 'STAR method for DE-specific scenarios', detail: 'Situation: 2 sentences of brief context. Task: your specific responsibility. Action: technical decisions YOU made (80% of the answer) — name the tools, the trade-offs, the failure modes you considered. Result: quantified outcome (reduced p99 latency from 4h to 45min, saved $40K/month). Always include data volume and the trade-off you explicitly chose.' },
          { name: 'Trade-off storytelling: latency vs cost vs accuracy', detail: 'Every strong DE answer demonstrates awareness of alternatives: "We chose Kinesis Firehose over Kafka because the 60-second buffering was acceptable for our hourly SLA and we lacked Kafka expertise — this saved 2 weeks of setup and $3K/month in MSK costs." FAANG interviewers specifically listen for alternative-awareness, not just the choice you made.' },
          { name: 'Common DE behavioral Qs: pipeline end-to-end', detail: '"Describe a data pipeline you built end-to-end": cover ingestion choice → transform approach → storage format → orchestration → monitoring → alerting → data quality handling. Frame as Bronze→Silver→Gold. Mention SLA, failure rate, daily data volume. If the pipeline is small, proactively explain why a simpler architecture was the right choice at that scale.' },
          { name: 'On-call / incident debugging live', detail: 'Systematic 6-step approach: 1) Identify impact scope (which tables/dashboards). 2) Check orchestration logs (Airflow/Step Functions). 3) Check source data (late arrival? schema change?). 4) Examine Glue/Spark transform logs. 5) Validate output row counts and distributions. 6) Root cause document + post-mortem with preventive action items.' },
          { name: 'Stakeholder communication: data delays to PMs/execs', detail: '"The pipeline will be delayed by 2 hours due to an upstream schema change from the payments team. Data will be available by 10am. I\'m adding a schema compatibility check to prevent recurrence." Short, confident, specific, action-oriented. Never explain the technical cause in detail to non-technical stakeholders — they care about impact and ETA, not root cause.' },
          { name: '"What would you do differently?" — growth mindset', detail: '"I would have invested in data quality checks earlier — we discovered a source data issue at week 6 that impacted 3 weeks of historical data. Adding schema validation and row count SLAs at the Bronze layer would have caught it on day 1." Shows: learning from mistakes, proactive thinking, and that you understand prevention > detection > remediation, in that priority order.' },
          { name: 'Resources', detail: 'Exponent DE interview guide: 15 behavioral questions with sample answers tailored specifically for data engineers. Grokking the Behavioral Interview (Educative): STAR framework + practice. Amazon Leadership Principles: prepare one DE story per LP — Amazon DEs are expected to cite LPs explicitly. Mock with a peer weekly — behavioral fluency requires repetition, not just reading.' },
        ],
      },
      {
        id: 'case-studies',
        name: 'Full Mock Interviews & Case Studies',
        difficulty: 'Hard',
        estimatedHours: 30,
        subtopics: [
          { name: 'Mock 1: SQL hard 45-min — retention analysis', detail: '10 min: clarify + schema review. 30 min: write the query. 5 min: trade-offs and edge cases. Expected: correct 30-day cohort retention query without hints. Bonus: handle edge cases — LEFT JOIN to preserve non-retained users, NULLIF in denominator. Self-grade: would this run in production without a code review?' },
          { name: 'Mock 2: System design 60-min — real-time pipeline', detail: '5 min clarify → 10 min estimate → 15 min high-level architecture → 20 min deep dive on one component → 10 min fault tolerance + trade-offs. Example: "Design an event tracking system for a 100M DAU app." Sketch each hop: SDK → Kinesis → Lambda → Parquet → Athena → Redshift. State SLA and latency at each step.' },
          { name: 'Mock 3: Coding + behavioral combo 90-min', detail: '20 min Python ETL coding (paginated API → Parquet), 20 min SQL (rolling DAU), 30 min system design (mini — 2 services only), 20 min behavioral (2 STAR stories). Most grueling format in FAANG loops — practice maintaining response quality across 90 continuous minutes of context switching between different domains.' },
          { name: 'Review all mocks and identify weak areas', detail: 'After each mock: score yourself 1–5 on correctness, edge case handling, communication clarity, and speed under pressure. Track weak areas in a running table. Spend 80% of remaining prep time on weak areas, not reinforcing your strengths. Most common weak areas: SQL LEFT JOIN vs INNER JOIN semantics, system design capacity estimates, too much explaining during live coding.' },
          { name: 'Final review: AWS specs, architecture diagrams', detail: 'Last 3 days before interviews: review all architecture diagrams (Lambda, Kappa, Medallion, Lakehouse). Memorize AWS key specs (S3 $0.023/GB, Kinesis 1MB/s/shard, Glue $0.44/DPU-hr, Redshift RA3.xlplus $1.086/hr). Reread your SQL cheat sheet. Review your notes from practice mocks — the patterns you missed under pressure tend to recur in real interviews.' },
          { name: 'Day 90: Full loop simulation — 5 interviews back-to-back', detail: '5 interviews in one day: recruiter screen (15 min), SQL screen (45 min), system design (60 min), coding (45 min), behavioral (30 min). Book a room, dress as if real, no significant breaks between sessions. Endurance is a real factor — your 5th interview quality must match your 1st. Rest 8+ hours the night before.' },
          { name: 'Resources', detail: 'Pramp: free peer-to-peer mock interviews matched by level — schedule 3+ sessions in the final week. interviewing.io: anonymous mock interviews with FAANG engineers ($200/session — worth it for the feedback quality). Glassdoor/Blind: search "Meta Data Engineer interview" + "Uber Data Engineer onsite" — real recent interview reports with actual questions asked.' },
        ],
      },
    ],
  },
];

interface AWSService {
  id: string;
  name: string;
  category: 'storage' | 'compute' | 'streaming' | 'orchestration' | 'governance' | 'analytics';
  icon: string;
  tagline: string;
  specs: string[];
  pros: string[];
  cons: string[];
  whenToUse: string[];
  whenNotToUse: string[];
  pricingModel: string;
  alternatives: string[];
  interviewTip: string;
}

const AWS_SERVICES: AWSService[] = [
  {
    id: 's3',
    name: 'Amazon S3',
    category: 'storage',
    icon: '🪣',
    tagline: 'Infinitely scalable object storage — the foundation of every AWS data lake',
    specs: [
      '11 nines (99.999999999%) durability',
      '99.99% availability SLA',
      'Max object size: 5 TB (multipart upload for >5 GB)',
      'Requests: PUT/COPY/POST/LIST $0.005/1K, GET $0.0004/1K',
      'Storage: $0.023/GB/month (Standard), $0.0125 (IA), $0.004 (Glacier)',
      'Strong read-after-write consistency (since Dec 2020)',
      'Event notifications: Lambda, SQS, SNS, EventBridge',
      'Cross-region replication (CRR), same-region replication (SRR)',
    ],
    pros: [
      'Truly unlimited scale — no capacity planning',
      'Decouples storage from compute (10× cost reduction vs HDFS)',
      'Native integration with every AWS analytics service',
      'S3 Select: query CSV/JSON/Parquet inside objects (filter before download)',
      'Intelligent-Tiering: auto-moves cold data to cheaper tiers',
      'Object Lock: WORM compliance for audit trails',
    ],
    cons: [
      'Eventual consistency on LIST previously (now fixed — consistent)',
      'Latency: ~100–200ms first byte vs in-memory cache',
      'NOT a filesystem — no atomic renames (table format handles this)',
      'No query optimization without external engine (Athena/Redshift)',
      'Small file problem: millions of tiny files → slow Spark/Athena queries',
    ],
    whenToUse: [
      'All raw data landing zone (Bronze layer)',
      'Data lake storage for Parquet/Delta/Iceberg files',
      'Archival: Glacier for audit data > 90 days',
      'Staging area for Redshift COPY command',
      'Airflow DAG storage (MWAA requirement)',
    ],
    whenNotToUse: [
      'Low-latency lookups (< 10ms) — use Redis/DynamoDB',
      'Relational data with complex joins — use RDS/Redshift',
      'Block storage for OS/app — use EBS',
      'Mount as NFS — use EFS',
    ],
    pricingModel: '$0.023/GB/month + request costs. Use Intelligent-Tiering for mixed-access data.',
    alternatives: ['GCS (Google), ADLS Gen2 (Azure), MinIO (on-prem)'],
    interviewTip: '💡 S3 partitioning matters: year=/month=/day= prefix enables partition pruning and cuts Athena costs 90%. Always partition by query access pattern, not write order.',
  },
  {
    id: 'glue',
    name: 'AWS Glue',
    category: 'compute',
    icon: '🔧',
    tagline: 'Serverless ETL + unified Data Catalog — the glue between S3 and query engines',
    specs: [
      'Glue 4.0 (Spark 3.3.0 + Python 3.10)',
      'DPU types: G.1X (4 vCPU, 16 GB), G.2X (8 vCPU, 32 GB), G.025X (2 vCPU, 4 GB streaming)',
      'Pricing: $0.44/DPU-hour (ETL), $1.00/DPU-hr (interactive sessions)',
      'Minimum: 2 DPUs per Glue ETL job (10-min billing minimum)',
      'Max job timeout: 48 hours',
      'Glue Catalog: unlimited databases/tables, $1/100K metadata requests',
      'Crawlers: auto-detect schema from S3/RDS/DynamoDB in scheduled runs',
      'Glue Schema Registry: Avro/Protobuf/JSON schema governance (free)',
    ],
    pros: [
      'Zero cluster management — fully serverless',
      'Data Catalog shared across Athena, Redshift Spectrum, EMR, LakeFormation',
      'Job bookmarks: resume from last checkpoint, no duplicate reprocessing',
      'Built-in dynamic frames: better null handling than raw Spark DataFrames',
      'Visual ETL studio: drag-drop for simple pipelines (no-code option)',
      'Glue Streaming: micro-batch from Kinesis/MSK with exactly-once semantics',
    ],
    cons: [
      'Cold start: Glue jobs take 2–5 minutes to spin up (bad for < 1 min jobs)',
      'More expensive than EMR Serverless for large, long-running jobs',
      'Limited Spark tuning: can\'t set all spark.conf parameters',
      'DynamicFrame ↔ DataFrame conversion has overhead',
      'Debugging: local development requires Docker (Glue container image)',
    ],
    whenToUse: [
      'ETL jobs that run hourly/daily (cold start amortized)',
      'Auto-cataloging new S3 data with Crawlers',
      'Streaming ETL from Kinesis → S3 (Glue Streaming)',
      'Small-medium teams without Spark cluster expertise',
      'Schema registry for Kafka/Kinesis producers',
    ],
    whenNotToUse: [
      'Sub-minute latency ETL (use Lambda or Kinesis Analytics)',
      'Huge 10TB+ jobs running continuously (EMR is cheaper)',
      'Complex Spark tuning requirements (EMR gives full control)',
      'Interactive/exploratory analysis (use EMR Notebooks or Databricks)',
    ],
    pricingModel: '$0.44/DPU-hr. A 10-DPU job for 30 min = $0.44 × 10 × 0.5 = $2.20.',
    alternatives: ['Apache Spark on EMR, EMR Serverless, Databricks, dbt (transform layer only)'],
    interviewTip: '💡 Glue Data Catalog = Hive Metastore compatible. Tables defined once in Catalog are instantly queryable by Athena, Redshift Spectrum, and EMR without any reconfiguration.',
  },
  {
    id: 'athena',
    name: 'Amazon Athena',
    category: 'analytics',
    icon: '🔍',
    tagline: 'Serverless SQL on S3 — analyze petabytes with no cluster to manage',
    specs: [
      'Engine: Presto (v2) / Apache Trino (v3)',
      'Pricing: $5 per TB scanned (no charge for DDL, metadata queries)',
      'Minimum charge: 10 MB per query',
      'Supports: Parquet, ORC, JSON, CSV, Avro, TSV',
      'Result cache: 45-min TTL (free re-runs within window)',
      'Athena v3: Apache Iceberg native DML (INSERT, MERGE, DELETE, UPDATE)',
      'Concurrent query limit: 25 (soft limit, requestable increase)',
      'Federated query: Lambda connectors for RDS, DynamoDB, CloudWatch',
    ],
    pros: [
      'Zero infrastructure — start querying S3 in < 60 seconds',
      'Schema-on-read: no ETL needed to explore raw data',
      'Parquet + SNAPPY + partitions → typically < $0.01 per query',
      'Iceberg native: ACID MERGE, time travel, schema evolution via SQL',
      'CTAS: CREATE TABLE AS SELECT to materialize results back to S3',
      'WorkGroups: per-team cost control and query isolation',
    ],
    cons: [
      'Pay-per-scan: bad for full-table scans on large unpartitioned CSV',
      'No auto-scaling compute — concurrency is soft-limited at 25',
      'Not optimized for repeated BI queries (Redshift wins on repeated patterns)',
      'JDBC connections have overhead vs Redshift for BI tools',
      'Complex transforms are slow vs Spark/Glue (no shuffle optimization)',
    ],
    whenToUse: [
      'Ad-hoc data exploration on S3 (especially with Parquet partitions)',
      'One-off analysis queries — pay nothing if not querying',
      'Iceberg DML: UPDATE/DELETE on lakehouse tables',
      'Cross-account federated queries',
      'DataOps/monitoring: query Glue catalog stats',
    ],
    whenNotToUse: [
      'Repeated dashboard queries run every minute (use Redshift materialized views)',
      'Sub-second latency requirements (use Redshift + RA3)',
      'Queries on CSV without partitions at scale (costs explode)',
      'Complex multi-table joins on large datasets (Spark is faster)',
    ],
    pricingModel: '$5/TB scanned. Parquet + partitions → 90% cost reduction vs CSV. CTAS results stored in S3 (add S3 cost).',
    alternatives: ['Redshift Spectrum (for Redshift users), BigQuery (GCP), Trino on EMR, Databricks SQL'],
    interviewTip: '💡 Cost math: 1 TB CSV @ $5 vs 100 GB Parquet (10× compression) @ $0.50. Add partitions → 10 GB scanned @ $0.05. Parquet + partitions = 100× cost reduction.',
  },
  {
    id: 'redshift',
    name: 'Amazon Redshift',
    category: 'analytics',
    icon: '🏛️',
    tagline: 'Petabyte-scale MPP data warehouse — OLAP at FAANG speed',
    specs: [
      'Architecture: Leader node + N compute nodes (MPP, columnar)',
      'RA3 nodes: decouple compute/storage via Redshift Managed Storage (RMS)',
      'RA3.xlplus: 4 vCPU, 32 GB RAM, 32 TB RMS — $1.086/hr',
      'RA3.16xlarge: 48 vCPU, 384 GB RAM, 128 TB RMS — $13.04/hr',
      'Serverless: auto-scales in RPUs (Redshift Processing Units) — $0.375/RPU-hr',
      'Redshift Spectrum: query S3 directly from Redshift SQL (pay-per-TB scanned)',
      'Concurrency scaling: auto-adds clusters for burst queries (1 hr free/day)',
      'AQUA: hardware accelerated query acceleration (cache on storage layer)',
    ],
    pros: [
      'Fastest for complex BI queries with repeated access patterns (co-located compute+data)',
      'Columnar + zone maps: skip entire disk blocks without touching them',
      'Distribution/sort keys: eliminate shuffle for common join patterns',
      'Materialized views: auto-refresh, incremental maintenance',
      'Redshift ML: CREATE MODEL in SQL (SageMaker under the hood)',
      'Spectrum: query cold S3 + hot DWH tables in a single query',
    ],
    cons: [
      'Expensive: ra3.4xlarge cluster = ~$2.50/hr min even when idle',
      'VACUUM + ANALYZE required for optimal performance after loads',
      'Distribution key mistakes cause data skew → 10× slower queries',
      'Not serverless by default (serverless mode has RPU overhead)',
      'Concurrency limit: 15 queries default (Concurrency Scaling has cost)',
    ],
    whenToUse: [
      'BI dashboards with repeated, complex OLAP queries',
      'Joins on multi-TB fact + dimension tables (distribution key eliminates shuffle)',
      'Mixed datasets: hot DWH + cold S3 data (Spectrum)',
      'When Athena query costs spike due to high frequency',
      'Regulated data needing column-level encryption + fine-grained access',
    ],
    whenNotToUse: [
      'Low query volume / mostly ad-hoc (Athena is cheaper)',
      'Simple aggregations on well-partitioned S3 data (Athena wins)',
      'Real-time data (latency > 60s from Kinesis → Redshift)',
      'Unpredictable query patterns (distribution key becomes wrong)',
    ],
    pricingModel: 'RA3.xlplus = $1.086/hr per node (2 nodes minimum). Serverless = $0.375/RPU-hr. Add Spectrum costs.',
    alternatives: ['BigQuery (GCP), Snowflake, Databricks SQL Warehouse, Athena v3 + Iceberg'],
    interviewTip: '💡 Distribution key design: distribute FACT table by most-common join key (e.g., user_id). Distribute DIM tables ALL if < 1M rows. This eliminates network shuffle for that join pattern.',
  },
  {
    id: 'kinesis',
    name: 'Amazon Kinesis (Streams + Firehose)',
    category: 'streaming',
    icon: '🌊',
    tagline: 'Fully managed real-time data streaming — from ingestion to S3 in seconds',
    specs: [
      'KDS: 1 MB/s write OR 1000 records/s per shard',
      'KDS: 2 MB/s read per shard per consumer (enhanced fan-out: 2 MB/s per consumer)',
      'KDS retention: 24 hr default, up to 365 days ($0.023/shard-hr for extended)',
      'KDS pricing: $0.015/shard-hr + $0.014/1M PUT records',
      'Firehose: auto-scales (no shard management)',
      'Firehose buffering: 60–900 seconds OR 1–128 MB (whichever first)',
      'Firehose destinations: S3, Redshift, OpenSearch, Splunk, HTTP endpoints',
      'Firehose transformation: Lambda for data enrichment inline',
      'MSK (Managed Kafka): standard Apache Kafka API on AWS',
    ],
    pros: [
      'KDS: sub-second latency from producer to consumer',
      'KDS: long retention enables replay (up to 365 days)',
      'Firehose: zero administration, auto-scales, direct S3 write',
      'Firehose: built-in format conversion (JSON → Parquet via Glue schema)',
      'Enhanced fan-out: 2 MB/s dedicated throughput per consumer (no sharing)',
      'Native Lambda integration for inline filtering/transformation',
    ],
    cons: [
      'KDS: must manage shard count manually (MSK auto-scales partitions vs shards)',
      'KDS hot shard: same partition key → all writes to one shard',
      'Firehose: buffering means minimum 60s latency to S3',
      'No replay on Firehose (it\'s fire-and-forget to S3)',
      'Cost grows linearly with shard count (Kafka MSK can be cheaper at scale)',
    ],
    whenToUse: [
      'KDS: real-time processing with < 1s end-to-end latency',
      'KDS: fan-out to multiple consumers (Lambda + Flink + S3 simultaneously)',
      'Firehose: simple streaming → S3/Redshift with no Kafka expertise required',
      'Firehose: streaming + Parquet conversion with schema from Glue Catalog',
      'When fully managed > fine-grained control (vs self-managed Kafka)',
    ],
    whenNotToUse: [
      'Very high throughput (> 1 GB/s) — MSK more cost-efficient',
      'Complex stream processing logic — use Kinesis Data Analytics (Flink)',
      'Replay beyond 365 days — use S3 archive as source of truth',
      'When Kafka API compatibility required (migrate without code change)',
    ],
    pricingModel: 'KDS: $0.015/shard-hr + $0.014/1M records. Firehose: $0.029/GB ingested (first 500 TB/mo).',
    alternatives: ['MSK (Managed Apache Kafka), EventBridge, SQS, Apache Kafka on EC2'],
    interviewTip: '💡 Partition key design for KDS: distribute evenly to avoid hot shards. Use a hash of user_id, not a status field (status has only 3 values → 3 shards out of N get all traffic).',
  },
  {
    id: 'emr',
    name: 'Amazon EMR',
    category: 'compute',
    icon: '⚡',
    tagline: 'Managed Hadoop/Spark cluster — full control for large-scale data processing',
    specs: [
      'Supports: Spark, Hadoop, Hive, Presto, HBase, Flink, Jupyter',
      'Deployment: EC2 (full cluster) or EMR Serverless (job-level auto-scale)',
      'EMR Serverless: pay per vCPU-second and GB-RAM-second ($0.052052/vCPU-hr)',
      'EMR on EC2: same EC2 pricing + $0.27/hr EMR fee (r5.4xlarge = ~$1.34/hr total)',
      'Spot instances: 60–90% discount (use with instance fleets)',
      'Bootstrap actions: run scripts on every node at startup',
      'Steps: submit multiple Spark/Hive jobs sequentially to one cluster',
      'Instance types: r5/r6g (memory), c5 (compute), m5 (balanced)',
    ],
    pros: [
      'Full Spark configuration control: every spark.conf tunable',
      'Spot instances: run same workload at 30% of Glue cost',
      'Multi-framework: Spark + Hive + HBase + Flink on same cluster',
      'EMR Notebooks: interactive PySpark in Jupyter attached to cluster',
      'Instance fleets: mix multiple EC2 types for spot availability',
      'Long-running clusters: amortize startup over hours of jobs',
    ],
    cons: [
      'Cluster management overhead: sizing, autoscaling configs, bootstrapping',
      '5–10 min cluster startup vs Glue\'s 2–5 min (but EMR Serverless is faster)',
      'Terminated spot instances can kill long-running jobs (use checkpointing)',
      'Cost governance harder than Glue (clusters idle when no jobs running)',
      'Requires deeper Spark expertise than Glue\'s abstracted DynamicFrames',
    ],
    whenToUse: [
      'Large, long-running Spark jobs (TB-scale, hours long) where Glue is costly',
      'Custom Spark configs: AQE tuning, specific storage connectors',
      'Multi-framework pipelines (Spark ETL + Hive queries + HBase writes)',
      'Delta Lake / Iceberg with open-source libraries not in Glue',
      'Cost optimization: spot instances for non-urgent batch jobs',
    ],
    whenNotToUse: [
      'Short jobs (< 30 min) — startup overhead erases savings vs Glue',
      'Low-traffic hours: idle cluster still costs (use EMR Serverless instead)',
      'Teams without Spark/Hadoop expertise (Glue is more managed)',
      'Real-time streaming (Kinesis Data Analytics / Flink is better managed)',
    ],
    pricingModel: 'EMR on EC2: EC2 price + $0.27/hr. EMR Serverless: $0.052/vCPU-hr + $0.0057/GB-hr. Spot: 60–90% EC2 discount.',
    alternatives: ['AWS Glue (serverless ETL), Databricks on AWS, EMR Serverless, AWS Batch'],
    interviewTip: '💡 Spot instance strategy: use instance fleets with 5–10 EC2 types. If spot price spikes for r5.4xl, EMR automatically switches to r5.2xl × 2 or m5.4xl — maintains capacity without manual intervention.',
  },
  {
    id: 'lakeformation',
    name: 'AWS Lake Formation',
    category: 'governance',
    icon: '🏛️',
    tagline: 'Centralized data lake governance — column-level security and cross-account sharing',
    specs: [
      'No additional cost beyond underlying services (S3, Glue Catalog)',
      'Permission types: Database, Table, Column, Row-filter, Cell-level',
      'Tag-based access control (LF-TBAC): policy tags on columns/tables',
      'Governed tables: ACID transactions on S3 data (Lake Formation managed)',
      'Cross-account: share Glue Catalog databases across AWS accounts',
      'Audit: CloudTrail logs every data access decision',
      'Data filters: row-level and cell-level security (masks PII values)',
      'Works with: Athena, Redshift Spectrum, Glue, EMR, QuickSight',
    ],
    pros: [
      'Column-level PII masking: non-privileged roles see NULL/hash vs real SSN',
      'Single permission model across all AWS analytics engines',
      'Cross-account: data mesh architecture without copying data',
      'Tag-based access: classify once (tag=PII) → auto-apply to new tables in same DB',
      'Row-level security: user sees only their department\'s rows',
      'Data sharing: share Iceberg snapshots cross-account read-only',
    ],
    cons: [
      'Complexity: LF permissions + IAM + S3 bucket policies interact in non-obvious ways',
      'Governed tables: limited supported engines (not all Spark versions)',
      'Setup overhead: initial permission migration from S3 ACLs can be painful',
      'Debugging access denied: must check LF, IAM, S3, KMS all at once',
      'Not supported in all regions (check availability)',
    ],
    whenToUse: [
      'Multi-team data lake: 5+ teams sharing same catalog',
      'PII compliance: GDPR/HIPAA — mask SSN/email at column level',
      'Cross-account data mesh: share clean tables with analytics accounts',
      'Central governance team managing access for data producers/consumers',
    ],
    whenNotToUse: [
      'Single-team small project (IAM + S3 bucket policies sufficient)',
      'When all data is public/non-sensitive within the org',
      'Databricks-managed lakehouse (Databricks has its own Unity Catalog)',
    ],
    pricingModel: 'No direct cost beyond Glue Catalog and S3. Governed table storage has usage costs.',
    alternatives: ['Databricks Unity Catalog, Apache Ranger (on-prem/EMR), manual IAM + S3 policies'],
    interviewTip: '💡 FAANG DE interview: "How would you implement GDPR right-to-delete?" Answer: Lake Formation row filter or Hudi delete API to remove the user row from all lakehouse partitions without full rewrite.',
  },
  {
    id: 'mwaa',
    name: 'Amazon MWAA (Managed Airflow)',
    category: 'orchestration',
    icon: '🎛️',
    tagline: 'Fully managed Apache Airflow — pipeline orchestration without server management',
    specs: [
      'Airflow version: 2.x (latest minor version managed by AWS)',
      'Environment class: mw1.small ($0.49/hr), mw1.medium ($0.98/hr), mw1.large ($1.96/hr)',
      'Scheduler: 2 Airflow schedulers (HA) included',
      'Workers: auto-scale from min to max (default: 1–10 workers)',
      'DAG storage: S3 bucket (sync delay: ~30 seconds on change)',
      'Executor: Celery (Redis backed), not KubernetesExecutor',
      'Web server: password-protected, inside VPC',
      'Plugins: custom operators installed via requirements.txt + plugins.zip on S3',
    ],
    pros: [
      'Zero Airflow administration: AWS manages scheduler, workers, DB, Redis',
      'HA out-of-box: 2 schedulers, auto-scaling workers',
      'Native AWS integrations: GlueJobOperator, EMRStepOperator, KinesisFirehoseHook',
      'VPC isolation: runs inside your VPC for secure database connections',
      'CloudWatch integration: all Airflow logs automatically shipped',
      'IAM roles: assign per-environment role for AWS resource access',
    ],
    cons: [
      'Expensive for small teams: mw1.small = ~$350/month always-on',
      'CeleryExecutor only: no KubernetesExecutor (dynamic resource scaling limited)',
      'DAG sync delay: 30–60 s after S3 upload before Airflow picks up changes',
      'Minimum 1 worker always running (can\'t scale to zero)',
      'Less flexibility than self-managed: can\'t install arbitrary system packages',
    ],
    whenToUse: [
      'Production pipelines where Airflow reliability > cost',
      'Teams that can\'t manage Airflow infrastructure (no DevOps bandwidth)',
      'Pipelines integrating many AWS services (native operators)',
      'When compliance requires isolation inside VPC',
    ],
    whenNotToUse: [
      'Small teams / experimentals — self-hosted Airflow on EC2/ECS is cheaper',
      'Pipelines needing dynamic resource allocation per task (use cloud-run executor)',
      'When AWS Step Functions can replace Airflow (simpler serverless option)',
    ],
    pricingModel: 'mw1.small: $0.49/hr + $0.00018/task run. Monthly min ~$350. Workers billed separately at EC2 prices.',
    alternatives: ['Self-managed Airflow on ECS/EC2, AWS Step Functions, Prefect, Dagster, Temporal'],
    interviewTip: '💡 MWAA vs Step Functions: Airflow is better when you need complex dependency graphs, sensors, and rich operator ecosystem. Step Functions is better for simpler serverless chains between AWS services.',
  },
  {
    id: 'stepfunctions',
    name: 'AWS Step Functions',
    category: 'orchestration',
    icon: '🔀',
    tagline: 'Serverless workflow orchestration — coordinate AWS services with no code',
    specs: [
      'Standard workflows: $0.025/1000 state transitions, 1-year max duration',
      'Express workflows: $1.00/1M transitions + $0.00001/GB-s, 5-min max',
      'State types: Task, Choice, Parallel, Map, Wait, Pass, Succeed, Fail',
      'Map state: fan-out to process 1M items concurrently (max 40× concurrency)',
      'Integrations: 220+ AWS services (SDK integration + optimized integrations)',
      'Error handling: Retry (exponential backoff), Catch (fallback state)',
      'Execution history: 25K events per execution (retained)',
      'IAM: fine-grained per-step role assumption',
    ],
    pros: [
      'Zero infrastructure: fully serverless, no scheduler to manage',
      'Visual workflow designer: see state machine diagram in Console',
      'Built-in retry + catch: exponential backoff on Lambda/Glue failures',
      'Parallel state: run 10 Glue jobs simultaneously, wait for all',
      'Map state: process S3 inventory file line-by-line with Lambda fan-out',
      'Express: event-driven pipelines for high-frequency (millions/hr)',
    ],
    cons: [
      'Complex logic (branching, dynamic DAGs) is verbose JSON/YAML',
      'No backfill/catchup concept like Airflow (manual intervention needed)',
      'Payload limit: 256 KB between states (workaround: pass S3 path)',
      'No native scheduling (use EventBridge to trigger on cron)',
      '5-min limit for Express workflows limits long-running steps',
    ],
    whenToUse: [
      'Simple sequential AWS service chains (S3 → Glue → Athena → SNS)',
      'Event-driven pipelines: new file in S3 → trigger processing',
      'One-off or infrequent workflows where Airflow cost is unjustified',
      'Map state: parallel fan-out processing of large item lists',
    ],
    whenNotToUse: [
      'Complex dependency graphs with 50+ tasks (Airflow is more manageable)',
      'When backfill / historical re-runs needed (Airflow handles this natively)',
      'Sensor-based waiting (Airflow sensors are cleaner than Step Function polling)',
      'When team already has Airflow expertise (no point adding another tool)',
    ],
    pricingModel: 'Standard: $0.025/1K transitions. Express: $1/1M + duration. For most DE pipelines: < $10/month.',
    alternatives: ['Amazon MWAA (Airflow), Prefect, Dagster, AWS Batch + CloudWatch Events'],
    interviewTip: '💡 Step Functions vs Airflow decision: Step Functions wins when < 10 tasks, AWS-only integrations, event-driven triggers, serverless cost. Airflow wins for complex DAGs, backfill, cross-cloud operators, sensors.',
  },
  {
    id: 'dms',
    name: 'AWS DMS (Database Migration Service)',
    category: 'compute',
    icon: '🔄',
    tagline: 'Continuous database replication — CDC from any source to any target',
    specs: [
      'Full load + CDC (Change Data Capture) or CDC only',
      'Sources: Oracle, SQL Server, MySQL, PostgreSQL, MongoDB, SAP, Db2',
      'Targets: S3, Redshift, DynamoDB, Kinesis, Kafka, Elasticsearch',
      'Replication instance: dms.t3.medium ($0.107/hr) to dms.r6i.16xlarge',
      'LOB columns: inline (small), limited (truncate large), unlimited (full LOB)',
      'Validation: built-in row count + hash comparison between source and target',
      'Schema Conversion Tool (SCT): convert Oracle PL/SQL → PostgreSQL SQL',
      'Task types: Full Load, CDC, Full Load + CDC',
    ],
    pros: [
      'Minimal source impact: uses native DB replication slots (Postgres) or redo logs (Oracle)',
      'Heterogeneous migration: Oracle → Aurora PostgreSQL with SCT',
      'Ongoing CDC: feed Kinesis with real-time DB changes (Debezium alternative)',
      'AWS managed: no Debezium connector maintenance',
      'Multi-AZ replication instance: automatic failover for HA',
    ],
    cons: [
      'Schema conversion: SCT is imperfect — complex stored procs need manual work',
      'Replication instance is always-on (even when no tasks running)',
      'DDL changes: ALTER TABLE not always captured — requires stop/restart',
      'Large LOB columns (BLOBs): significant throughput degradation',
      'No schema evolution detection: must restart task on source schema change',
    ],
    whenToUse: [
      'Initial data lake seeding from operational DB → S3/Redshift',
      'CDC: real-time DB → Kinesis → S3/Redshift for near-real-time lakehouse',
      'Heterogeneous DB migration (Oracle/SQL Server → Aurora/Postgres)',
      'When Debezium is too complex to self-manage',
    ],
    whenNotToUse: [
      'Pure streaming from application events (use Kinesis SDK directly)',
      'When Debezium + MSK already exists in stack',
      'Simple one-time large exports (S3 export from RDS is free and faster)',
    ],
    pricingModel: 'Replication instance: $0.107/hr (t3.medium). Storage: $0.10/GB/month. Full load data: free.',
    alternatives: ['Debezium (open-source CDC), Fivetran, Airbyte, RDS S3 Export (one-time)'],
    interviewTip: '💡 DMS CDC to Kinesis: real-time change stream → Kinesis → (Lambda OR Kinesis Analytics → Flink) → S3/Redshift. Latency from DB commit to S3: usually < 10 seconds.',
  },
  {
    id: 'eventbridge',
    name: 'Amazon EventBridge',
    category: 'orchestration',
    icon: '📡',
    tagline: 'Serverless event bus — the nervous system connecting AWS services',
    specs: [
      'Custom events: $1.00/1M events published',
      'Default event bus: free for AWS service events (S3, Glue, Step Functions)',
      'Scheduler: $1.00/1M scheduled invocations (replaces CloudWatch Events)',
      'Event archive: replay historical events to any connected rule',
      'Schema registry: auto-discover and document event schemas',
      'Pipes: point-to-point integrations (SQS → Lambda → EventBridge with filtering)',
      'Rule targets: 300+ AWS services + API destinations (external HTTP)',
      'Latency: ~0.5s from event published to target invoked',
    ],
    pros: [
      'Decoupled event-driven architecture: services publish events, targets react',
      'S3 event notifications → Glue/Lambda trigger on new file (< 1s)',
      'Multi-target: one S3 event fans out to Glue ETL + SNS alert + Step Functions',
      'EventBridge Scheduler: better than CloudWatch Events (timezone support, flexible rate)',
      'Schema registry: type-safe event contracts across teams',
      'Cross-account event buses: publish events to partner accounts',
    ],
    cons: [
      'Not a queue: if target Lambda fails, event is lost (add DLQ on Lambda)',
      'Pattern matching: rule syntax can be complex for nested JSON events',
      'Ordering: no ordering guarantee across events',
      '0.5s latency: not suitable for sub-100ms real-time requirements',
    ],
    whenToUse: [
      'Trigger ETL pipelines on S3 PutObject events (new file arrives)',
      'Fan-out: one event → multiple downstream consumers',
      'Schedule Glue/Step Function jobs (cron replacement)',
      'Cross-service decoupling: data producer doesn\'t know about consumers',
    ],
    whenNotToUse: [
      'High-throughput streaming (Kinesis handles MB/s; EventBridge handles events/s)',
      'When you need a durable queue with retries (use SQS + DLQ)',
      'Sub-second processing latency requirements',
    ],
    pricingModel: '$1.00/1M custom events. AWS service events (S3, Glue): free. Scheduler: $1.00/1M invocations.',
    alternatives: ['Amazon SNS + SQS, AWS Step Functions, CloudWatch Events (predecessor), Kafka'],
    interviewTip: '💡 Idiomatic pattern: S3 → EventBridge → Step Functions → Glue Job → EventBridge (success/fail) → SNS. Fully serverless, no Airflow needed for AWS-only pipelines.',
  },
];

interface BlockInfo { title: string; desc: string; why: string; tip: string; }

const BLOCK_INFO: Record<string, BlockInfo> = {
  // ── Lambda Architecture ──────────────────────────────────────────────────
  'lambda-source': { title: 'Data Source', desc: 'Entry point of every pipeline — raw events, logs, clickstreams, or CDC from databases. Push-based or pull-based, batch or real-time.', why: 'Data quality starts here. Validating schema at ingestion prevents corruption cascading through every downstream layer.', tip: '💡 Interview: always ask "What is the source? Push or pull? Volume per second?" before whiteboarding anything.' },
  'lambda-batch': { title: 'Batch Layer', desc: 'Periodically reprocesses ALL historical data (hourly/daily) using Spark/MapReduce on HDFS or S3. Produces 100%-accurate batch views.', why: 'The batch layer is the correctness backstop. When a bug corrupts results, recomputing from raw data fixes everything permanently.', tip: '💡 Key tradeoff: total accuracy vs hours of latency. Never delete raw data — you will need to replay it.' },
  'lambda-speed': { title: 'Speed Layer', desc: 'Processes only the most RECENT data not yet covered by the last batch run. Kafka + Flink deliver sub-second aggregates.', why: "Users can't wait hours for dashboards. The speed layer fills the gap between batch runs, trading some accuracy for freshness.", tip: '💡 Speed-layer results are discarded once the batch layer catches up — this simplifies long-term data management.' },
  'lambda-serving': { title: 'Serving Layer', desc: 'Merges batch views + speed views into one unified query interface backed by HBase, Cassandra, or a purpose-built cache.', why: "Lambda's core innovation: users get accurate AND fresh results without knowing which layer answered their query.", tip: "💡 Maintaining two codebases (batch + speed) is Lambda's main pain — the reason Kappa Architecture was invented." },
  'lambda-query': { title: 'Query Layer', desc: 'End-user interface: BI dashboards, ad-hoc SQL, ML feature stores. One clean API regardless of which layer produced the result.', why: 'Abstraction shields consumers from pipeline internals — infrastructure changes become invisible to downstream users.', tip: '💡 Always separate read replicas from write paths so BI queries never compete with ingestion throughput.' },
  // ── Kappa Architecture ───────────────────────────────────────────────────
  'kappa-source': { title: 'Data Sources', desc: 'Apps, IoT devices, databases via CDC (Debezium), and external APIs all push events into a single unified stream.', why: "Unifying ALL sources into one stream eliminates Lambda's dual-path ingestion complexity entirely.", tip: '💡 CDC = Change Data Capture. Debezium turns any Postgres/MySQL row-change into a Kafka event automatically.' },
  'kappa-kafka': { title: 'Kafka — The Immutable Log', desc: 'Distributed, durable log that retains messages by time or size policy. Unlike a queue, Kafka lets you replay from any offset.', why: 'Kafka IS the batch layer in Kappa. Reprocessing = replay the log from offset 0 with a new consumer group — no separate Spark batch job needed.', tip: '💡 Set retention.ms to cover your longest reprocessing window (often 7–30 days). Storage is cheap; losing replay ability is not.' },
  'kappa-processor': { title: 'Stream Processor', desc: 'Flink or Spark Structured Streaming reads from Kafka, transforms and aggregates, and writes to the serving store continuously.', why: 'One codebase handles both real-time AND historical reprocessing. Eliminates the dual-maintenance burden of Lambda.', tip: '💡 Reprocessing: spin up a new consumer group at offset 0, let it catch up, then swap the serving pointer to the new results.' },
  'kappa-serving': { title: 'Serving Store', desc: 'Cassandra, Redis, or ClickHouse storing aggregated results for fast downstream queries.', why: 'Near-real-time freshness for dashboards — the stream processor writes here continuously without any scheduled batch window.', tip: '💡 Use Redis for hot/small data; Cassandra for high-write-throughput at scale with TTL-based expiry.' },
  // ── Medallion Architecture ───────────────────────────────────────────────
  'medallion-source': { title: 'Raw Sources', desc: 'Relational DBs, REST APIs, ERP systems, flat files, streaming events — any system that produces data.', why: 'Capturing raw data before any transformation preserves the audit trail and enables full reprocessing when bugs are found later.', tip: '💡 Timestamp every record AT ingestion time — critical for SLA measurement and handling late-arriving events.' },
  'medallion-bronze': { title: '🥉 Bronze Layer', desc: 'Raw data exactly as-is. Append-only. No transforms. Schema-on-read. Stored in S3/ADLS as-is from the source system.', why: 'Bronze is your time machine. When corrupted Silver/Gold data is discovered hours later, replay from Bronze with fixed logic — zero data loss.', tip: '💡 Never delete Bronze data. Apply S3 lifecycle rules to Glacier after 90 days — storage is cheap vs the risk of permanent data loss.' },
  'medallion-silver': { title: '🥈 Silver Layer', desc: 'Cleaned, deduplicated, validated, type-cast data. Nullables resolved. Schema enforced. Partitioned by date.', why: 'Silver is the source of truth. Data scientists and downstream Gold pipelines all trust Silver as their authoritative baseline.', tip: '💡 Use Delta MERGE for SCD Type-2 upserts here. Partition by event_date for 10–100× Athena/Spark query speedups.' },
  'medallion-gold': { title: '🥇 Gold Layer', desc: 'Business-domain-specific pre-aggregated, denormalized tables optimized for fast queries: daily orders, cohorts, revenue metrics.', why: 'Gold tables answer business questions in milliseconds — pre-joined and pre-aggregated so BI tools get sub-2-second loads.', tip: '💡 Organize Gold by domain: finance/, marketing/, ops/. Each domain team owns and SLAs their Gold tables independently.' },
  // ── Kafka Streaming Pipeline ─────────────────────────────────────────────
  'kafka-producer': { title: 'Kafka Producer', desc: 'Any app or service publishing messages to Kafka topics. Producers choose partition via message key (deterministic) or round-robin.', why: 'Producers are fully decoupled from consumers — they publish and move on, never caring how many consumer groups exist downstream.', tip: '💡 Partition key design is critical: same key always → same partition → ordering guarantee within that key.' },
  'kafka-broker': { title: 'Kafka Broker + Topics', desc: 'The Kafka cluster. Topics split into partitions (P0, P1, P2) distributed across brokers. Each message has a monotonic offset.', why: 'Partitions ARE the unit of parallelism. More partitions → more concurrent consumers → higher aggregate throughput.', tip: '💡 Rule of thumb: start with 3 partitions. Scale when consumer lag rises. You can increase partition count but never decrease it.' },
  'kafka-consumer-grp': { title: 'Consumer Group', desc: 'Named group of consumers where each partition is consumed by EXACTLY ONE member — no duplicate processing within the group.', why: 'Multiple independent consumer groups can read the SAME topic simultaneously at their own pace — fan-out to Spark, Flink, and S3 at once.', tip: '💡 Monitor consumer group lag (not just throughput) for SLA alerts. Lag = messages behind the partition tip.' },
  // ── AWS Data Pipeline ────────────────────────────────────────────────────
  'aws-ingest': { title: 'Ingestion Layer', desc: 'Kinesis Firehose buffers real-time data to S3. AWS DMS replicates DB changes. S3 batch uploads for file-based loads.', why: 'Choosing the right ingestion tool sets your latency floor and cost. Firehose buffering reduces S3 PUT calls by 1000×.', tip: '💡 Firehose key configs: buffer interval (60–900 s) and buffer size (1–128 MB). Tune for your latency vs cost tradeoff.' },
  'aws-s3-raw': { title: 'S3 — Raw / Bronze', desc: 'Amazon S3 is the foundation of AWS data lakes. Raw data lands here first — CSV, JSON, Parquet, whatever the source sends.', why: 'S3 is infinitely scalable, 11-nines durable, and ~$0.023/GB. Decoupling storage from compute is the core AWS architecture advantage.', tip: '💡 Always partition S3 prefix as year/month/day. Enables partition pruning — 10–100× query speedup and cost reduction.' },
  'aws-glue': { title: 'AWS Glue', desc: 'Serverless ETL: PySpark jobs on managed clusters, billed per DPU-hour. Glue Data Catalog = Hive Metastore for Athena/Redshift/EMR.', why: 'Glue eliminates cluster management — pay only when jobs run. Crawlers auto-discover schemas and register them in the Catalog.', tip: '💡 Glue Catalog is shared across Athena, Redshift Spectrum, and EMR — define schema once, query from any engine.' },
  'aws-s3-clean': { title: 'S3 — Silver / Gold', desc: 'Processed clean data stored as Parquet with date partitioning. Often backed by Delta Lake or Apache Iceberg for ACID semantics.', why: "Parquet's columnar storage means Athena scans only queried columns — reducing cost (pay-per-TB) by 10–50× vs CSV.", tip: '💡 Convert to Parquet + SNAPPY compression in Glue. Benchmark: ~87% cost reduction on Athena vs raw CSV scanning.' },
  'aws-athena': { title: 'Amazon Athena', desc: 'Serverless SQL engine (Presto under the hood). No cluster to manage. Queries S3 directly. Priced at $5/TB scanned.', why: 'Ideal for ad-hoc analysis — zero startup time vs Redshift. With Parquet + partitions, most queries cost < $0.01.', tip: '💡 Athena v3 supports Apache Iceberg natively — ACID, time travel, and schema evolution without Glue ETL jobs.' },
  'aws-redshift': { title: 'Amazon Redshift', desc: 'Managed MPP columnar data warehouse. RA3 nodes decouple compute from storage (Redshift Managed Storage on S3).', why: 'Outperforms Athena on repeated complex BI queries because columnar data is co-located with compute — no per-query S3 scan overhead.', tip: '💡 Redshift Spectrum: query cold S3/Iceberg data directly from Redshift SQL — combine hot DWH tables + cold lake in one query.' },
  'aws-lake-formation': { title: 'AWS Lake Formation', desc: 'Centralized governance: column-level access control, row-level security, cross-account data sharing on S3 + Glue Catalog.', why: 'At FAANG scale hundreds of teams share the same lake. Lake Formation enforces column-level PII masking without duplicating data.', tip: '💡 Column-level security = non-privileged roles see NULL instead of SSN/email — zero ETL transformation needed.' },
  // ── Spark Processing Pipeline ────────────────────────────────────────────
  'spark-source': { title: 'S3 Source Data', desc: 'Parquet files on S3 partitioned by date or key. Spark reads each partition as one task — partition count = initial degree of parallelism.', why: 'Partition sizing at read time is the #1 Spark performance lever. Too large → OOM; too small → scheduling overhead dominates.', tip: '💡 Target 128–256 MB per Spark partition. Use repartition(N) after an initial read to tune partition count.' },
  'spark-driver': { title: 'Spark Driver', desc: 'Single JVM running your app code. Builds the logical DAG, breaks it into stages and tasks, then dispatches tasks to executors.', why: 'Driver is a single point of failure. Never call collect() on large datasets — only use it on small, bounded results.', tip: '💡 Driver OOM = collect() on too much data. Executor OOM = partition too large — increase spark.executor.memory.' },
  'spark-cluster-mgr': { title: 'Cluster Manager', desc: 'Resource allocator: YARN (Hadoop on-prem), Kubernetes (cloud-native modern standard), or Spark Standalone. Assigns CPU/RAM containers to jobs.', why: 'Kubernetes enables multi-tenant Spark clusters with autoscaling and fair per-job resource quotas.', tip: '💡 spark.dynamicAllocation.enabled=true lets Spark scale executor count up/down based on pending task queue size.' },
  'spark-executor': { title: 'Spark Executor', desc: 'JVM on a worker node with N task slots (cores) and M GB RAM. Each slot runs one task = one partition at a time.', why: 'Executor count × cores = total parallelism. Adding executors is how you scale throughput — until shuffle becomes the bottleneck.', tip: '💡 Optimal: 4–5 cores per executor, reserve 1 core per node for OS. Memory = cores × 2–4 GB + memoryOverhead.' },
  'spark-stages': { title: 'Stages & Shuffle', desc: 'Spark breaks a DAG into stages at shuffle boundaries. Wide transforms (groupBy, join) write intermediate data across the network.', why: 'Shuffles are the #1 bottleneck — network + disk I/O on every executor. Minimizing them is the core of Spark performance tuning.', tip: '💡 Broadcast join: if one table < 10 MB, set autoBroadcastJoinThreshold — Spark sends it to all executors, eliminating the shuffle.' },
  'spark-output': { title: 'Output (S3 / Data Warehouse)', desc: 'Spark writes to S3 as Parquet, directly to Redshift via JDBC, or into Delta/Iceberg tables using the native table API.', why: 'Output partitioning determines ALL downstream query performance. Partition by query access patterns, not processing order.', tip: '💡 partitionBy("date").sortWithinPartitions("key") co-locates related data — eliminates shuffles in downstream joins on the same key.' },
  // ── Data Lakehouse ───────────────────────────────────────────────────────
  'lh-storage': { title: 'Object Storage', desc: 'S3 (AWS), GCS (Google), or ADLS (Azure). The physical data layer: cheap, infinitely scalable, 11-nines durable.', why: 'Separating storage from compute means you pay for each independently — scale compute for a query then shut it down.', tip: '💡 This compute-storage separation is why Snowflake, Databricks, and BigQuery can undercut traditional on-prem DWH on TCO.' },
  'lh-delta': { title: 'Delta Lake', desc: 'Databricks open-source table format. Adds ACID transactions, time travel, schema enforcement, and MERGE (upserts) to plain S3 files.', why: 'Without Delta, concurrent Spark writes to S3 can silently corrupt data. The transaction log makes S3 behave like a database.', tip: '💡 OPTIMIZE + ZORDER: compacts small files and co-locates similar data — often 10–100× faster queries on large tables.' },
  'lh-iceberg': { title: 'Apache Iceberg', desc: 'Netflix-originated open standard. ACID, time travel, partition evolution WITHOUT rewriting existing data files.', why: 'Multi-engine: Spark, Flink, Trino, Athena v3, and Redshift Spectrum all read Iceberg natively — zero vendor lock-in.', tip: '💡 Partition evolution = change partition strategy on an existing table with zero file rewrites — impossible in Hive.' },
  'lh-hudi': { title: 'Apache Hudi', desc: 'Uber-originated. Optimized for high-frequency streaming upserts and CDC-style incremental processing on data lakes.', why: 'Best choice for GDPR right-to-be-forgotten: delete one user row across petabytes of S3 data in minutes with the Hudi delete API.', tip: '💡 Copy-on-Write = best read throughput. Merge-on-Read = best write throughput. Match to your workload read/write ratio.' },
  'lh-engines': { title: 'Query Engines', desc: 'Multiple compute engines read the same Iceberg/Delta table: Spark SQL (heavy ETL), Trino (fast SQL), Databricks SQL (BI), Athena v3.', why: 'Use the right tool per workload — Spark for TB-scale ETL, Trino for interactive sub-second SQL, Databricks SQL for BI SLAs.', tip: '💡 Trino: federated queries — join S3, MySQL, Kafka, and Redshift in a single SQL statement without moving data.' },
  'lh-bi': { title: 'BI / Dashboards', desc: 'Tableau, Looker, Power BI, or Superset connecting to the lakehouse via JDBC/ODBC or native connectors.', why: 'Lakehouse delivers DWH-quality performance (pre-aggregated Gold tables) at data lake cost — the best of both worlds for BI teams.', tip: '💡 Pre-aggregate key Gold tables so dashboard queries complete in <2 s. Use materialized views or Databricks SQL warehouse.' },
  'lh-ml': { title: 'ML / Data Science', desc: 'Jupyter notebooks, MLflow tracking, and training pipelines reading feature tables directly from the lakehouse.', why: 'Data scientists get fresh features without waiting for DWH exports. Delta time travel enables reproducible dataset versioning.', tip: '💡 Feature stores (Feast, Tecton, Databricks Feature Store) sit on the lakehouse to serve both online and offline features.' },
};

/* ─── TopicDetailPanel component ──────────────────────────────────────── */
const DIFF_COLOR: Record<string, string> = {
  Easy:   'bg-green-500/15 text-green-400 border-green-500/30',
  Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Hard:   'bg-red-500/15 text-red-400 border-red-500/30',
};
const CAT_COLOR: Record<string, string> = {
  'Window Functions': 'bg-cyan-500/10 text-cyan-400',
  'Aggregation':      'bg-purple-500/10 text-purple-400',
  'Joins':            'bg-blue-500/10 text-blue-400',
  'CTEs':             'bg-orange-500/10 text-orange-400',
  'String':           'bg-pink-500/10 text-pink-400',
  'Date':             'bg-teal-500/10 text-teal-400',
};
function lcSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function TopicDetailPanel({ details }: { details: TopicDetail }) {
  const [openQA, setOpenQA] = useState<number | null>(null);
  const hasLC = (details.leetcodeProblems?.length ?? 0) > 0;
  const [tab, setTab] = useState<'qa' | 'lc'>('qa');
  const [diff, setDiff] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [cat, setCat] = useState<string>('All');

  const categories = hasLC
    ? ['All', ...Array.from(new Set(details.leetcodeProblems!.map(p => p.category)))]
    : [];
  const filtered = (details.leetcodeProblems ?? []).filter(
    p => (diff === 'All' || p.difficulty === diff) && (cat === 'All' || p.category === cat)
  );

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden mt-3"
    >
      <div className="border border-[#00d4ff]/30 rounded-xl bg-neutral-950/80 p-4">
        {/* Tab bar */}
        {hasLC && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTab('qa')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === 'qa'
                  ? 'bg-[#00d4ff]/15 text-accent border border-accent/40'
                  : 'text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
            >
              <HelpCircle className="w-3 h-3" />
              Interview Q&amp;A
              <span className="ml-0.5 opacity-60">({details.interviewQA.length})</span>
            </button>
            <button
              onClick={() => setTab('lc')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === 'lc'
                  ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/40'
                  : 'text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
            >
              <span className="text-[10px] font-bold">LC</span>
              LeetCode SQL
              <span className="ml-0.5 opacity-60">({details.leetcodeProblems!.length})</span>
            </button>
          </div>
        )}

        {/* Q&A Tab */}
        {tab === 'qa' && (
          <>
            {!hasLC && (
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-semibold text-accent">Interview Q&amp;A — {details.interviewQA.length} questions</span>
              </div>
            )}
            <div className="space-y-1.5">
              {details.interviewQA.map((item, i) => (
                <div key={i} className="border border-neutral-800 rounded-lg overflow-hidden">
                  <div
                    className="flex items-start gap-2 px-3 py-2.5 bg-neutral-900/40 cursor-pointer hover:bg-neutral-800/60 transition-colors"
                    onClick={() => setOpenQA(openQA === i ? null : i)}
                  >
                    <span className="text-[10px] font-bold text-accent mt-0.5 flex-shrink-0 w-5">Q{i + 1}</span>
                    <span className="text-xs text-neutral-200 flex-1 leading-relaxed">{item.q}</span>
                    <ChevronDown className={`w-3 h-3 text-neutral-500 flex-shrink-0 mt-0.5 transition-transform duration-200 ${openQA === i ? 'rotate-180 text-accent' : ''}`} />
                  </div>
                  <AnimatePresence>
                    {openQA === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-950/70">
                          <div className="flex gap-2">
                            <span className="text-[10px] font-bold text-green-400 mt-0.5 flex-shrink-0 w-5">A</span>
                            <p className="text-xs text-neutral-300 leading-relaxed">{item.a}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </>
        )}

        {/* LeetCode Tab */}
        {tab === 'lc' && hasLC && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="flex gap-1">
                {(['All', 'Easy', 'Medium', 'Hard'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDiff(d)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors border ${
                      diff === d
                        ? d === 'All'
                          ? 'bg-neutral-700 text-white border-neutral-500'
                          : DIFF_COLOR[d] + ' border-current'
                        : 'text-neutral-500 border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 flex-wrap">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors border ${
                      cat === c
                        ? 'bg-neutral-700 text-white border-neutral-500'
                        : 'text-neutral-500 border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Problem count */}
            <p className="text-[10px] text-neutral-500 mb-2">{filtered.length} problems</p>

            {/* Problem list */}
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {filtered.map(p => (
                <a
                  key={p.id}
                  href={`https://leetcode.com/problems/${lcSlug(p.title)}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-2.5 rounded-lg border border-neutral-800 bg-neutral-900/30 hover:bg-neutral-800/50 hover:border-neutral-700 transition-all group"
                >
                  {/* Problem number */}
                  <span className="text-[10px] font-mono text-neutral-500 mt-0.5 w-8 flex-shrink-0 text-right">{p.id}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-semibold text-neutral-200 group-hover:text-white transition-colors">{p.title}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${DIFF_COLOR[p.difficulty]}`}>{p.difficulty}</span>
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${CAT_COLOR[p.category] ?? 'bg-neutral-700/50 text-neutral-400'}`}>{p.category}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-snug">{p.hint}</p>
                  </div>

                  <ExternalLink className="w-3.5 h-3.5 text-neutral-600 group-hover:text-yellow-400 flex-shrink-0 mt-0.5 transition-colors" />
                </a>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-neutral-600 text-center py-6">No problems match the selected filters.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function DERoadmap() {
  const { data, isLoaded, toggleTopicCompletion } = useProgress();
  const [expandedPhase, setExpandedPhase] = useState<string | null>('foundation');
  const [selectedDiagram, setSelectedDiagram] = useState<string | null>(null);
  const [blockInfo, setBlockInfo] = useState<BlockInfo | null>(null);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  const hoverBlock = (key: string) => setBlockInfo(BLOCK_INFO[key] ?? null);
  const clearBlock = () => setBlockInfo(null);
  const [fileFilter, setFileFilter] = useState<'all' | 'batch' | 'streaming' | 'analytics'>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [expandedFormat, setExpandedFormat] = useState<string | null>(null);
  const [showPipeline, setShowPipeline] = useState<Record<string, boolean>>({});
  const [awsCatFilter, setAwsCatFilter] = useState<string>('all');
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'file-types' | 'aws-services' | 'diagrams'>('roadmap');
  const [subtopicDone, setSubtopicDone] = useState<Record<string, boolean>>({});
  const [openSubtopic, setOpenSubtopic] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const toggleSubtopicDone = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubtopicDone(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const toggleSubtopicOpen = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenSubtopic(prev => prev === key ? null : key);
  };

  if (!isLoaded) return null;

  const getPhaseProgress = (phaseId: string) => {
    const phase = PHASES.find(p => p.id === phaseId);
    if (!phase) return { completed: 0, total: 0 };

    const total = phase.topics.length;
    const completed = phase.topics.filter(t =>
      data.deRoadmap.completedTopics.includes(t.id)
    ).length;

    return { completed, total };
  };

  const totalCompleted = data.deRoadmap.completedTopics.length;
  const totalTopics = PHASES.reduce((sum, p) => sum + p.topics.length, 0);
  const overallScore = Math.round((totalCompleted / totalTopics) * 100);

  return (
    <>
    <PageContainer title="Data Engineering Roadmap" description="90-day journey to FAANG readiness">
      {/* Overall Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
                DE Readiness Score
              </h3>
              <p className="text-sm text-muted">
                Complete all {totalTopics} topics for FAANG interviews
              </p>
            </div>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-5xl font-heading font-bold text-accent"
            >
              {overallScore}%
            </motion.div>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallScore}%` }}
              transition={{ duration: 1, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-accent to-success rounded-full"
            />
          </div>
        </GlassCard>
      </motion.div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['roadmap', 'file-types', 'aws-services', 'diagrams'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all border ${
              activeTab === tab
                ? 'bg-accent text-[#0a0a0f] border-accent font-bold'
                : 'bg-transparent text-muted border-neutral-700 hover:border-accent hover:text-foreground'
            }`}
          >
            {tab === 'roadmap' ? '📅 90-Day Roadmap' : tab === 'file-types' ? '📁 File Types & AWS' : tab === 'aws-services' ? '☁️ AWS Services' : '🏗️ Architecture Diagrams'}
          </button>
        ))}
      </div>

      {/* Phases Timeline */}
      {activeTab === 'roadmap' && <div className="space-y-4">
        {PHASES.map((phase, index) => {
          const progress = getPhaseProgress(phase.id);
          const isExpanded = expandedPhase === phase.id;
          const percentComplete = Math.round((progress.completed / progress.total) * 100);

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Phase Header */}
              <GlassCard
                hoverable
                onClick={() =>
                  setExpandedPhase(isExpanded ? null : phase.id)
                }
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-sm ${
                        percentComplete === 100
                          ? 'bg-success/20 text-success'
                          : 'bg-accent/20 text-accent'
                      }`}
                    >
                      {phase.number}
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-lg text-foreground">
                        Phase {phase.number}: {phase.name}
                      </h3>
                      <p className="text-sm text-muted">{phase.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {progress.completed} / {progress.total}
                      </p>
                      <p className="text-xs text-accent font-bold">{percentComplete}%</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-accent" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted" />
                    )}
                  </div>
                </div>

                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentComplete}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-accent to-success rounded-full"
                  />
                </div>
              </GlassCard>

              {/* Topics List */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2 mt-2 ml-4"
                  >
                    {phase.topics.map(topic => {
                      const isCompleted =
                        data.deRoadmap.completedTopics.includes(topic.id);
                      const difficultyColors = {
                        Easy: 'text-success',
                        Medium: 'text-yellow-400',
                        Hard: 'text-secondary',
                      };

                      return (
                        <motion.div
                          key={topic.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div
                            className="bg-card/40 border border-neutral-700 rounded-lg p-4 transition-all group"
                          >
                            <div className="flex items-start gap-3 mb-3">
                              {/* Completion toggle — clicking the circle */}
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="cursor-pointer"
                                onClick={() => toggleTopicCompletion(topic.id)}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-1" />
                                ) : (
                                  <Circle className="w-5 h-5 text-muted group-hover:text-accent flex-shrink-0 mt-1" />
                                )}
                              </motion.div>

                              <div className="flex-1 min-w-0">
                                {/* Topic title row */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4
                                    className={`font-medium text-sm transition-all ${
                                      isCompleted
                                        ? 'text-muted line-through'
                                        : 'text-foreground'
                                    }`}
                                  >
                                    {topic.name}
                                  </h4>
                                  {/* Interview Q&A button */}
                                  {TOPIC_DETAILS[topic.id] && (
                                    <button
                                      onClick={() => setExpandedTopic(prev => prev === topic.id ? null : topic.id)}
                                      className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                                        expandedTopic === topic.id
                                          ? 'bg-accent/20 border-accent text-accent'
                                          : 'border-neutral-700 text-neutral-400 hover:border-accent hover:text-accent'
                                      }`}
                                    >
                                      <HelpCircle className="w-2.5 h-2.5" />
                                      {expandedTopic === topic.id ? 'Close Q&A' : `Interview Q&A (${TOPIC_DETAILS[topic.id].interviewQA.length})`}
                                    </button>
                                  )}

                                </div>
                                {/* Subtopic progress */}
                                <div className="flex items-center gap-2 mt-2 mb-1" onClick={e => e.stopPropagation()}>
                                  {/* Done count badge */}
                                  {(() => {
                                    const doneCount = topic.subtopics.filter((_,si) => subtopicDone[`${topic.id}-${si}`]).length;
                                    const total = topic.subtopics.length;
                                    const allDone = doneCount === total;
                                    return (
                                      <>
                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-colors ${allDone ? 'bg-green-900/60 text-green-400 border border-green-700' : 'text-neutral-500'}`}>
                                          {doneCount}/{total} done
                                        </span>
                                        <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                          <motion.div
                                            className={`h-full rounded-full ${allDone ? 'bg-green-500' : 'bg-gradient-to-r from-[#00d4ff] to-[#00ff88]'}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${total ? Math.round((doneCount / total) * 100) : 0}%` }}
                                            transition={{ duration: 0.4, ease: 'easeOut' }}
                                          />
                                        </div>
                                        {/* Expand all / Collapse all */}
                                        <button
                                          onClick={() => {
                                            const anyOpen = topic.subtopics.some((_, si) => openSubtopic === `${topic.id}-${si}`);
                                            if (anyOpen) {
                                              setOpenSubtopic(null);
                                            } else {
                                              setOpenSubtopic(`${topic.id}-0`);
                                            }
                                          }}
                                          className="text-[9px] text-neutral-500 hover:text-accent border border-neutral-700 hover:border-accent px-1.5 py-0.5 rounded transition-colors whitespace-nowrap"
                                        >
                                          {topic.subtopics.some((_, si) => openSubtopic === `${topic.id}-${si}`) ? 'Collapse' : 'Expand All'}
                                        </button>
                                        {/* Mark all done */}
                                        {!allDone && (
                                          <button
                                            onClick={() => {
                                              const updates: Record<string,boolean> = {};
                                              topic.subtopics.forEach((_, si) => { updates[`${topic.id}-${si}`] = true; });
                                              setSubtopicDone(prev => ({ ...prev, ...updates }));
                                            }}
                                            className="text-[9px] text-neutral-500 hover:text-green-400 border border-neutral-700 hover:border-green-700 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap"
                                          >
                                            ✓ All
                                          </button>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                                <div className="mt-1 space-y-1" onClick={e => e.stopPropagation()}>
                                  {topic.subtopics.map((sub, si) => {
                                    const key = `${topic.id}-${si}`;
                                    const isDone = !!subtopicDone[key];
                                    const isOpen = openSubtopic === key;
                                    return (
                                      <div
                                        key={si}
                                        className={`border rounded-lg overflow-hidden transition-all duration-200 border-l-2 ${
                                          isDone
                                            ? 'border-green-800/60 border-l-green-500 bg-green-950/20'
                                            : isOpen
                                              ? 'border-[#00d4ff]/40 border-l-[#00d4ff] bg-neutral-900/80'
                                              : 'border-neutral-800 border-l-neutral-700 bg-neutral-900/30 hover:border-neutral-700'
                                        }`}
                                      >
                                        {/* Header row */}
                                        <div
                                          className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-neutral-800/40 transition-colors"
                                          onClick={e => toggleSubtopicOpen(key, e)}
                                        >
                                          <motion.button
                                            onClick={e => toggleSubtopicDone(key, e)}
                                            whileTap={{ scale: 1.4 }}
                                            className="flex-shrink-0 transition-transform"
                                          >
                                            {isDone
                                              ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                              : <Circle className="w-3.5 h-3.5 text-neutral-600 hover:text-[#00d4ff]" />
                                            }
                                          </motion.button>
                                          <span className={`text-[11px] font-bold flex-shrink-0 tabular-nums ${isDone ? 'text-green-600' : 'text-[#00d4ff]'}`}>{si + 1}.</span>
                                          <span className={`text-sm font-semibold flex-1 min-w-0 tracking-tight transition-colors ${isDone ? 'line-through text-neutral-600' : 'text-white'}`}>
                                            {sub.name}
                                          </span>
                                          <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#00d4ff]' : 'text-neutral-600'}`} />
                                        </div>
                                        {/* Expandable detail */}
                                        <AnimatePresence>
                                          {isOpen && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: 'auto', opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              transition={{ duration: 0.2 }}
                                              className="overflow-hidden"
                                            >
                                              <RichDetail text={sub.detail} />
                                              {SUBTOPIC_RESOURCES[sub.name] && (
                                                <div className="mx-3 mb-3 mt-1 border-t border-neutral-800/60 pt-2.5">
                                                  <p className="text-[10px] uppercase tracking-widest text-neutral-600 font-semibold mb-2">📺 Watch / Practice</p>
                                                  <div className="flex flex-col gap-1.5">
                                                    {SUBTOPIC_RESOURCES[sub.name].map((r, ri) => (
                                                      <a
                                                        key={ri}
                                                        href={r.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={e => e.stopPropagation()}
                                                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-neutral-800 hover:border-accent/60 hover:bg-neutral-800/60 transition-all group/link"
                                                      >
                                                        <span className="text-base flex-shrink-0">
                                                          {r.channel === 'DataLemur' ? '💻' : '▶️'}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                          <p className="text-xs font-semibold text-neutral-200 group-hover/link:text-accent transition-colors truncate">{r.label}</p>
                                                          <p className="text-[10px] text-neutral-500">{r.channel}</p>
                                                        </div>
                                                        <span className="text-[10px] text-neutral-600 group-hover/link:text-accent transition-colors flex-shrink-0">↗</span>
                                                      </a>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* ── Interview Q&A Panel ─────────────────────── */}
                                <AnimatePresence>
                                  {expandedTopic === topic.id && TOPIC_DETAILS[topic.id] && (
                                    <TopicDetailPanel
                                      key={topic.id}
                                      details={TOPIC_DETAILS[topic.id]}
                                    />
                                  )}
                                </AnimatePresence>
                              </div>

                              <div className="text-right flex-shrink-0">
                                <p
                                  className={`text-xs font-medium ${difficultyColors[topic.difficulty]}`}
                                >
                                  {topic.difficulty}
                                </p>
                                <p className="text-xs text-muted mt-1">
                                  {topic.estimatedHours}h
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>}

      {/* Roadmap Summary Stats */}
      {activeTab === 'roadmap' && <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-3 gap-6 mt-12"
      >
        <GlassCard>
          <p className="text-muted text-sm mb-2">Topics Completed</p>
          <p className="text-3xl font-heading font-bold text-accent">
            {totalCompleted} / {totalTopics}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-muted text-sm mb-2">Total Hours</p>
          <p className="text-3xl font-heading font-bold text-accent">
            {PHASES.reduce((sum, p) => sum + p.topics.reduce((s, t) => s + t.estimatedHours, 0), 0)}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-muted text-sm mb-2">Phases Complete</p>
          <p className="text-3xl font-heading font-bold text-success">
            {PHASES.filter(
              p => getPhaseProgress(p.id).completed === getPhaseProgress(p.id).total
            ).length}
            / 4
          </p>
        </GlassCard>
      </motion.div>}

      {/* File Types & AWS Tab */}
      {activeTab === 'file-types' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex gap-2">
              {(['all', 'batch', 'streaming', 'analytics'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFileFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                    fileFilter === cat
                      ? 'bg-accent text-[#0a0a0f] border-accent'
                      : 'bg-transparent text-muted border-neutral-700 hover:border-accent hover:text-foreground'
                  }`}
                >
                  {cat === 'all' ? 'All Formats' : cat}
                </button>
              ))}
            </div>
            <div className="flex gap-2 ml-auto">
              {['all', 'S3', 'Glue', 'Athena', 'Redshift', 'EMR', 'Kinesis'].map(svc => (
                <button
                  key={svc}
                  onClick={() => setServiceFilter(svc)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    serviceFilter === svc
                      ? 'border-[#ff9900] text-[#ff9900] bg-[#ff9900]/10'
                      : 'bg-transparent text-muted border-neutral-700 hover:border-[#ff9900] hover:text-[#ff9900]'
                  }`}
                >
                  {svc === 'all' ? 'All AWS' : svc}
                </button>
              ))}
            </div>
          </div>

          {/* Formats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FILE_FORMATS.filter(f => {
              const catOk = fileFilter === 'all' || f.category === fileFilter;
              const svcOk = serviceFilter === 'all' || f.awsServices.includes(serviceFilter);
              return catOk && svcOk;
            }).map((fmt, i) => {
              const isOpen = expandedFormat === fmt.id;
              return (
                <motion.div
                  key={fmt.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <GlassCard>
                    {/* Header */}
                    <button
                      className="w-full text-left"
                      onClick={() => setExpandedFormat(isOpen ? null : fmt.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{fmt.icon}</span>
                          <div>
                            <h4 className="font-heading font-semibold text-foreground">{fmt.name}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              fmt.category === 'batch' ? 'bg-accent/20 text-accent' :
                              fmt.category === 'streaming' ? 'bg-secondary/20 text-secondary' :
                              fmt.category === 'analytics' ? 'bg-success/20 text-success' :
                              'bg-neutral-700 text-muted'
                            }`}>
                              {fmt.category}
                            </span>
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                      <p className="text-sm text-muted text-left">{fmt.useCase}</p>
                      {/* AWS badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {fmt.awsServices.map(s => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded border font-medium"
                            style={{ borderColor: AWS_SERVICE_COLORS[s] || '#808080', color: AWS_SERVICE_COLORS[s] || '#808080' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </button>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="mt-4 pt-4 border-t border-neutral-700 overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-success font-semibold mb-2 uppercase tracking-wide">Pros</p>
                              <ul className="space-y-1">
                                {fmt.pros.map(p => <li key={p} className="text-xs text-muted flex gap-1"><span className="text-success">+</span>{p}</li>)}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs text-secondary font-semibold mb-2 uppercase tracking-wide">Cons</p>
                              <ul className="space-y-1">
                                {fmt.cons.map(c => <li key={c} className="text-xs text-muted flex gap-1"><span className="text-secondary">−</span>{c}</li>)}
                              </ul>
                            </div>
                          </div>

                          {/* Spark Code */}
                          <div className="mb-3">
                            <p className="text-xs text-muted font-semibold mb-1 uppercase tracking-wide">Spark Snippet</p>
                            <pre className="bg-neutral-900 rounded-lg p-3 text-xs text-accent overflow-x-auto whitespace-pre-wrap font-mono">{fmt.sparkCode}</pre>
                          </div>

                          {/* AWS Pipeline toggle */}
                          <button
                            onClick={() => setShowPipeline(prev => ({ ...prev, [fmt.id]: !prev[fmt.id] }))}
                            className="text-xs text-[#ff9900] hover:underline flex items-center gap-1"
                          >
                            <Filter className="w-3 h-3" />
                            {showPipeline[fmt.id] ? 'Hide' : 'Show'} AWS Pipeline
                          </button>
                          {showPipeline[fmt.id] && (
                            <div className="mt-2 p-3 bg-neutral-900 rounded-lg">
                              <p className="text-xs font-mono text-[#ff9900]">{fmt.awsPipeline}</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* AWS Services Tab */}
      {activeTab === 'aws-services' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <p className="text-sm text-muted mb-5">Industry-standard AWS services for Data Engineering — specs, pros/cons, and when to use each.</p>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(['all', 'storage', 'compute', 'streaming', 'analytics', 'orchestration', 'governance'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setAwsCatFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                  awsCatFilter === cat
                    ? 'bg-[#ff9900] text-[#0a0a0f] border-[#ff9900] font-bold'
                    : 'bg-transparent text-muted border-neutral-700 hover:border-[#ff9900] hover:text-[#ff9900]'
                }`}
              >
                {cat === 'all' ? '☁️ All Services' : cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {AWS_SERVICES.filter(s => awsCatFilter === 'all' || s.category === awsCatFilter).map((svc, i) => {
              const isOpen = expandedService === svc.id;
              const catColors: Record<string, string> = {
                storage: 'bg-[#ff9900]/20 text-[#ff9900] border-[#ff9900]/40',
                compute: 'bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]/40',
                streaming: 'bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/40',
                analytics: 'bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]/40',
                orchestration: 'bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/40',
                governance: 'bg-[#facc15]/20 text-[#facc15] border-[#facc15]/40',
              };
              return (
                <motion.div key={svc.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <GlassCard>
                    <button className="w-full text-left" onClick={() => setExpandedService(isOpen ? null : svc.id)}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <span className="text-3xl flex-shrink-0">{svc.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                              <h4 className="font-heading font-bold text-lg text-foreground">{svc.name}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${catColors[svc.category]}`}>{svc.category}</span>
                            </div>
                            <p className="text-sm text-muted">{svc.tagline}</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-muted flex-shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-5 pt-5 border-t border-neutral-700 overflow-hidden space-y-5"
                        >
                          {/* Specs */}
                          <div>
                            <p className="text-xs font-bold text-[#ff9900] uppercase tracking-wider mb-2">📊 Key Specs & Limits</p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                              {svc.specs.map(spec => (
                                <li key={spec} className="text-xs text-muted flex gap-2">
                                  <span className="text-[#ff9900] flex-shrink-0">▸</span>
                                  <span>{spec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Pros / Cons */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-bold text-success uppercase tracking-wider mb-2">✅ Pros</p>
                              <ul className="space-y-1">
                                {svc.pros.map(p => (
                                  <li key={p} className="text-xs text-muted flex gap-2">
                                    <span className="text-success flex-shrink-0">+</span>
                                    <span>{p}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">⚠️ Cons</p>
                              <ul className="space-y-1">
                                {svc.cons.map(c => (
                                  <li key={c} className="text-xs text-muted flex gap-2">
                                    <span className="text-secondary flex-shrink-0">−</span>
                                    <span>{c}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* When to use / not use */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">🟢 When to Use</p>
                              <ul className="space-y-1">
                                {svc.whenToUse.map(w => (
                                  <li key={w} className="text-xs text-muted flex gap-2">
                                    <span className="text-accent flex-shrink-0">→</span>
                                    <span>{w}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">🔴 When NOT to Use</p>
                              <ul className="space-y-1">
                                {svc.whenNotToUse.map(w => (
                                  <li key={w} className="text-xs text-muted flex gap-2">
                                    <span className="text-yellow-400 flex-shrink-0">✗</span>
                                    <span>{w}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Pricing + Alternatives + Interview tip */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-neutral-900 rounded-lg">
                              <p className="text-xs font-bold text-[#ff9900] mb-1">💰 Pricing Model</p>
                              <p className="text-xs text-muted">{svc.pricingModel}</p>
                            </div>
                            <div className="p-3 bg-neutral-900 rounded-lg">
                              <p className="text-xs font-bold text-muted mb-1">🔄 Alternatives</p>
                              <p className="text-xs text-muted">{svc.alternatives.join(' · ')}</p>
                            </div>
                          </div>
                          <div className="p-3 bg-[#001a14] border border-[#00ff8833] rounded-lg">
                            <p className="text-xs text-success">{svc.interviewTip}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Architecture Diagrams Tab */}
      {activeTab === 'diagrams' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <p className="text-sm text-muted mb-6">Click any diagram to expand it. These show real DE architecture patterns used at FAANG companies.</p>

          <div className="grid grid-cols-1 gap-6">

            {/* Lambda Architecture */}
            <GlassCard>
              <button className="w-full text-left" onClick={() => setSelectedDiagram(selectedDiagram === 'lambda' ? null : 'lambda')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-heading font-semibold text-foreground">⚖️ Lambda Architecture</h4>
                  <span className="text-xs text-muted">{selectedDiagram === 'lambda' ? '▲ collapse' : '▼ expand'}</span>
                </div>
                <p className="text-xs text-muted">Batch Layer (EMR/Glue) + Speed Layer (MSK/Kinesis) → Serving Layer — accurate + low-latency queries</p>
              </button>
              <AnimatePresence>
                {selectedDiagram === 'lambda' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <p className="text-xs text-[#ff990088] mt-3 mb-1">🖱 Hover any block to learn its role — AWS services shown for each layer</p>
                    <div className="mt-1 overflow-x-auto" onMouseMove={e => setTipPos({ x: e.clientX, y: e.clientY })} onMouseLeave={clearBlock}>
                      <svg viewBox="0 0 920 360" className="w-full" style={{ minWidth: 720, fontFamily: 'sans-serif' }}>
                        <defs>
                          <marker id="arrowL2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#ff9900"/></marker>
                          <marker id="arrowL2G" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#7aa116"/></marker>
                          <marker id="arrowL2R" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#f97316"/></marker>
                          <filter id="shadowL"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.35"/></filter>
                        </defs>
                        <rect width="920" height="360" fill="#161b22" rx="12"/>
                        <rect x="8" y="8" width="904" height="344" rx="10" fill="none" stroke="#30363d" strokeWidth="1"/>

                        {/* DATA SOURCE */}
                        <rect x="16" y="140" width="130" height="80" rx="8" fill="#1c2128" stroke="#58a6ff" strokeWidth="1.5" filter="url(#shadowL)"/>
                        <text x="81" y="168" fill="#58a6ff" fontSize="16" textAnchor="middle">🌊</text>
                        <text x="81" y="188" fill="#58a6ff" fontSize="10" textAnchor="middle" fontWeight="bold">Data Sources</text>
                        <text x="81" y="204" fill="#6e7681" fontSize="8" textAnchor="middle">MSK / Kinesis / DB</text>

                        {/* Fork — arrow to batch */}
                        <line x1="146" y1="165" x2="200" y2="100" stroke="#58a6ff" strokeWidth="1.5" markerEnd="url(#arrowL2)"/>
                        {/* Fork — arrow to speed */}
                        <line x1="146" y1="195" x2="200" y2="270" stroke="#58a6ff" strokeWidth="1.5" markerEnd="url(#arrowL2)"/>

                        {/* BATCH LAYER */}
                        <rect x="204" y="40" width="220" height="130" rx="8" fill="#1c2128" stroke="#7aa116" strokeWidth="2" filter="url(#shadowL)"/>
                        <text x="314" y="68" fill="#7aa116" fontSize="11" textAnchor="middle" fontWeight="bold">⏱ BATCH LAYER</text>
                        <text x="314" y="88" fill="#6e7681" fontSize="9" textAnchor="middle">Hours / Days latency</text>
                        <rect x="218" y="98" width="92" height="56" rx="5" fill="#1a2513" stroke="#7aa116" strokeWidth="1"/>
                        <text x="264" y="120" fill="#7aa116" fontSize="10" textAnchor="middle" fontWeight="bold">🔧 AWS Glue</text>
                        <text x="264" y="135" fill="#6e7681" fontSize="8" textAnchor="middle">ETL / Catalog</text>
                        <text x="264" y="148" fill="#6e7681" fontSize="8" textAnchor="middle">PySpark jobs</text>
                        <rect x="318" y="98" width="92" height="56" rx="5" fill="#1a2513" stroke="#7aa116" strokeWidth="1"/>
                        <text x="364" y="120" fill="#7aa116" fontSize="10" textAnchor="middle" fontWeight="bold">⚡ EMR</text>
                        <text x="364" y="135" fill="#6e7681" fontSize="8" textAnchor="middle">Spark batch</text>
                        <text x="364" y="148" fill="#6e7681" fontSize="8" textAnchor="middle">S3 output</text>

                        {/* Arrow batch → serving */}
                        <line x1="424" y1="105" x2="480" y2="155" stroke="#7aa116" strokeWidth="1.5" markerEnd="url(#arrowL2G)"/>

                        {/* SPEED LAYER */}
                        <rect x="204" y="220" width="220" height="115" rx="8" fill="#1c2128" stroke="#f97316" strokeWidth="2" filter="url(#shadowL)"/>
                        <text x="314" y="248" fill="#f97316" fontSize="11" textAnchor="middle" fontWeight="bold">⚡ SPEED LAYER</text>
                        <text x="314" y="266" fill="#6e7681" fontSize="9" textAnchor="middle">Seconds latency</text>
                        <rect x="218" y="274" width="92" height="48" rx="5" fill="#25180a" stroke="#f97316" strokeWidth="1"/>
                        <text x="264" y="294" fill="#f97316" fontSize="10" textAnchor="middle" fontWeight="bold">🌊 Kinesis</text>
                        <text x="264" y="310" fill="#6e7681" fontSize="8" textAnchor="middle">Real-time stream</text>
                        <rect x="318" y="274" width="92" height="48" rx="5" fill="#25180a" stroke="#f97316" strokeWidth="1"/>
                        <text x="364" y="294" fill="#f97316" fontSize="10" textAnchor="middle" fontWeight="bold">λ Lambda</text>
                        <text x="364" y="310" fill="#6e7681" fontSize="8" textAnchor="middle">Micro-transforms</text>

                        {/* Arrow speed → serving */}
                        <line x1="424" y1="282" x2="480" y2="230" stroke="#f97316" strokeWidth="1.5" markerEnd="url(#arrowL2R)"/>

                        {/* SERVING LAYER */}
                        <rect x="484" y="120" width="220" height="120" rx="8" fill="#1c2128" stroke="#8b5cf6" strokeWidth="2" filter="url(#shadowL)"/>
                        <text x="594" y="148" fill="#8b5cf6" fontSize="11" textAnchor="middle" fontWeight="bold">🗄 SERVING LAYER</text>
                        <text x="594" y="166" fill="#6e7681" fontSize="9" textAnchor="middle">Merge batch + speed views</text>
                        <rect x="498" y="176" width="92" height="48" rx="5" fill="#1a1030" stroke="#8b5cf6" strokeWidth="1"/>
                        <text x="544" y="196" fill="#8b5cf6" fontSize="9" textAnchor="middle" fontWeight="bold">🏛 Redshift</text>
                        <text x="544" y="210" fill="#6e7681" fontSize="8" textAnchor="middle">DWH queries</text>
                        <rect x="598" y="176" width="92" height="48" rx="5" fill="#1a1030" stroke="#8b5cf6" strokeWidth="1"/>
                        <text x="644" y="196" fill="#8b5cf6" fontSize="9" textAnchor="middle" fontWeight="bold">🔍 Athena</text>
                        <text x="644" y="210" fill="#6e7681" fontSize="8" textAnchor="middle">S3 ad-hoc</text>

                        {/* Arrow → Query/BI */}
                        <line x1="704" y1="180" x2="760" y2="180" stroke="#8b5cf6" strokeWidth="1.5" markerEnd="url(#arrowL2)"/>

                        {/* QUERY / BI */}
                        <rect x="764" y="140" width="140" height="80" rx="8" fill="#1c2128" stroke="#ff9900" strokeWidth="1.5" filter="url(#shadowL)"/>
                        <text x="834" y="168" fill="#ff9900" fontSize="14" textAnchor="middle">📊</text>
                        <text x="834" y="188" fill="#ff9900" fontSize="10" textAnchor="middle" fontWeight="bold">QuickSight / BI</text>
                        <text x="834" y="204" fill="#6e7681" fontSize="8" textAnchor="middle">Dashboards</text>

                        {/* Layer labels */}
                        <text x="314" y="25" fill="#7aa116" fontSize="9" textAnchor="middle" letterSpacing="1">BATCH — accuracy</text>
                        <text x="314" y="347" fill="#f97316" fontSize="9" textAnchor="middle" letterSpacing="1">SPEED — freshness</text>

                        {/* Hover overlays */}
                        <rect x="16" y="140" width="130" height="80" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('lambda-source')} onMouseLeave={clearBlock}/>
                        <rect x="204" y="40" width="220" height="130" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('lambda-batch')} onMouseLeave={clearBlock}/>
                        <rect x="204" y="220" width="220" height="115" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('lambda-speed')} onMouseLeave={clearBlock}/>
                        <rect x="484" y="120" width="220" height="120" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('lambda-serving')} onMouseLeave={clearBlock}/>
                        <rect x="764" y="140" width="140" height="80" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('lambda-query')} onMouseLeave={clearBlock}/>
                      </svg>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span className="text-[#7aa116] font-bold">Batch (EMR/Glue): </span><span className="text-muted">Full dataset recomputed nightly — 100% accurate batch views stored in S3/Redshift.</span></div>
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span className="text-orange-400 font-bold">Speed (Kinesis/λ): </span><span className="text-muted">Processes only recent events — low latency, approximate real-time view.</span></div>
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span className="text-purple-400 font-bold">Serving (Athena/Redshift): </span><span className="text-muted">Merges both layers. Users get accurate + fresh results. Pain: dual codebases (→ use Kappa instead).</span></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            {/* Kappa Architecture */}
            <GlassCard>
              <button className="w-full text-left" onClick={() => setSelectedDiagram(selectedDiagram === 'kappa' ? null : 'kappa')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-heading font-semibold text-foreground">🔁 Kappa Architecture</h4>
                  <span className="text-xs text-muted">{selectedDiagram === 'kappa' ? '▲ collapse' : '▼ expand'}</span>
                </div>
                <p className="text-xs text-muted">Single stream pipeline — MSK / Kinesis → Flink/KDA → DynamoDB/S3 — simpler than Lambda, durable replay</p>
              </button>
              <AnimatePresence>
                {selectedDiagram === 'kappa' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <p className="text-xs text-[#ff990088] mt-3 mb-1">🖱 Hover any block to learn its role — reprocessing arrow shows replay capability</p>
                    <div className="mt-1 overflow-x-auto" onMouseMove={e => setTipPos({ x: e.clientX, y: e.clientY })} onMouseLeave={clearBlock}>
                      <svg viewBox="0 0 920 260" className="w-full" style={{ minWidth: 720, fontFamily: 'sans-serif' }}>
                        <defs>
                          <marker id="arrowK2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#ff9900"/></marker>
                          <marker id="arrowK2G" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#7aa116"/></marker>
                          <filter id="shadowK"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.35"/></filter>
                        </defs>
                        <rect width="920" height="260" fill="#161b22" rx="12"/>
                        <rect x="8" y="8" width="904" height="244" rx="10" fill="none" stroke="#30363d" strokeWidth="1"/>

                        {/* Sources */}
                        <rect x="16" y="80" width="130" height="100" rx="8" fill="#1c2128" stroke="#58a6ff" strokeWidth="1.5" filter="url(#shadowK)"/>
                        <text x="81" y="112" fill="#58a6ff" fontSize="11" textAnchor="middle" fontWeight="bold">📡 Sources</text>
                        <text x="81" y="130" fill="#6e7681" fontSize="8" textAnchor="middle">Apps / IoT</text>
                        <text x="81" y="146" fill="#6e7681" fontSize="8" textAnchor="middle">CDC / Clickstream</text>
                        <text x="81" y="162" fill="#6e7681" fontSize="8" textAnchor="middle">Kinesis Agent</text>

                        <line x1="146" y1="130" x2="194" y2="130" stroke="#58a6ff" strokeWidth="1.5" markerEnd="url(#arrowK2)"/>

                        {/* MSK / Kinesis */}
                        <rect x="198" y="60" width="190" height="140" rx="8" fill="#1c2128" stroke="#f97316" strokeWidth="2" filter="url(#shadowK)"/>
                        <text x="293" y="92" fill="#f97316" fontSize="11" textAnchor="middle" fontWeight="bold">🌊 Amazon MSK</text>
                        <text x="293" y="110" fill="#6e7681" fontSize="8" textAnchor="middle">Distributed event log</text>
                        <rect x="212" y="120" width="80" height="60" rx="5" fill="#200e00" stroke="#f97316" strokeWidth="1"/>
                        <text x="252" y="145" fill="#f97316" fontSize="8" textAnchor="middle" fontWeight="bold">topic: events</text>
                        <text x="252" y="164" fill="#555" fontSize="7" textAnchor="middle">P0 P1 P2</text>
                        <rect x="296" y="120" width="80" height="60" rx="5" fill="#200e00" stroke="#f97316" strokeWidth="1"/>
                        <text x="336" y="145" fill="#f97316" fontSize="8" textAnchor="middle" fontWeight="bold">topic: metrics</text>
                        <text x="336" y="164" fill="#555" fontSize="7" textAnchor="middle">P0 P1</text>
                        <text x="293" y="196" fill="#6e7681" fontSize="7" textAnchor="middle">7-day retention — replayable</text>

                        <line x1="388" y1="130" x2="436" y2="130" stroke="#f97316" strokeWidth="1.5" markerEnd="url(#arrowK2)"/>

                        {/* Stream Processor */}
                        <rect x="440" y="60" width="200" height="140" rx="8" fill="#1c2128" stroke="#7aa116" strokeWidth="2" filter="url(#shadowK)"/>
                        <text x="540" y="92" fill="#7aa116" fontSize="11" textAnchor="middle" fontWeight="bold">⚡ Stream Processor</text>
                        <rect x="454" y="104" width="85" height="80" rx="5" fill="#1a2513" stroke="#7aa116" strokeWidth="1"/>
                        <text x="496" y="128" fill="#7aa116" fontSize="9" textAnchor="middle" fontWeight="bold">KDA / Flink</text>
                        <text x="496" y="147" fill="#6e7681" fontSize="7" textAnchor="middle">Windowed aggs</text>
                        <text x="496" y="163" fill="#6e7681" fontSize="7" textAnchor="middle">Joins + enrichment</text>
                        <text x="496" y="179" fill="#6e7681" fontSize="7" textAnchor="middle">Stateful ops</text>
                        <rect x="543" y="104" width="85" height="80" rx="5" fill="#1a2513" stroke="#7aa116" strokeWidth="1"/>
                        <text x="585" y="128" fill="#7aa116" fontSize="9" textAnchor="middle" fontWeight="bold">Glue Streaming</text>
                        <text x="585" y="147" fill="#6e7681" fontSize="7" textAnchor="middle">Micro-batch</text>
                        <text x="585" y="163" fill="#6e7681" fontSize="7" textAnchor="middle">to S3 / Redshift</text>

                        <line x1="640" y1="130" x2="688" y2="130" stroke="#7aa116" strokeWidth="1.5" markerEnd="url(#arrowK2G)"/>

                        {/* Serving */}
                        <rect x="692" y="60" width="210" height="140" rx="8" fill="#1c2128" stroke="#8b5cf6" strokeWidth="2" filter="url(#shadowK)"/>
                        <text x="797" y="92" fill="#8b5cf6" fontSize="11" textAnchor="middle" fontWeight="bold">🗄 Serving</text>
                        <rect x="706" y="104" width="88" height="80" rx="5" fill="#1a1030" stroke="#8b5cf6" strokeWidth="1"/>
                        <text x="750" y="128" fill="#8b5cf6" fontSize="9" textAnchor="middle" fontWeight="bold">DynamoDB</text>
                        <text x="750" y="144" fill="#6e7681" fontSize="7" textAnchor="middle">Real-time lookups</text>
                        <text x="750" y="160" fill="#6e7681" fontSize="7" textAnchor="middle">Single-digit ms</text>
                        <text x="750" y="176" fill="#6e7681" fontSize="7" textAnchor="middle">OLTP queries</text>
                        <rect x="798" y="104" width="88" height="80" rx="5" fill="#1a1030" stroke="#ff9900" strokeWidth="1"/>
                        <text x="842" y="128" fill="#ff9900" fontSize="9" textAnchor="middle" fontWeight="bold">🪣 S3 (Iceberg)</text>
                        <text x="842" y="144" fill="#6e7681" fontSize="7" textAnchor="middle">Historical analytics</text>
                        <text x="842" y="160" fill="#6e7681" fontSize="7" textAnchor="middle">Athena queries</text>

                        {/* Reprocessing arc */}
                        <path d="M 293 200 Q 293 240 540 240 Q 640 240 640 200" stroke="#ff9900" strokeWidth="1.5" strokeDasharray="5,3" fill="none" markerEnd="url(#arrowK2)"/>
                        <text x="460" y="235" fill="#ff9900" fontSize="8" textAnchor="middle">♻ Replay from offset 0 — logic change? Reprocess entire log</text>

                        {/* Hover overlays */}
                        <rect x="16" y="80" width="130" height="100" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('kappa-source')} onMouseLeave={clearBlock}/>
                        <rect x="198" y="60" width="190" height="140" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('kappa-kafka')} onMouseLeave={clearBlock}/>
                        <rect x="440" y="60" width="200" height="140" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('kappa-processor')} onMouseLeave={clearBlock}/>
                        <rect x="692" y="60" width="210" height="140" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('kappa-serving')} onMouseLeave={clearBlock}/>
                      </svg>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span className="text-orange-400 font-bold">vs Lambda: </span><span className="text-muted">No batch layer — one codebase, lower ops burden. MSK replaces HDFS as durable store.</span></div>
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span className="text-yellow-400 font-bold">Tradeoff: </span><span className="text-muted">Reprocessing = replay entire MSK log (costly at scale). Use Kinesis replay or MSK offset reset.</span></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            {/* Medallion Architecture */}
            <GlassCard>
              <button className="w-full text-left" onClick={() => setSelectedDiagram(selectedDiagram === 'medallion' ? null : 'medallion')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-heading font-semibold text-foreground">Medallion Architecture (Bronze → Silver → Gold)</h4>
                  <span className="text-xs text-muted">{selectedDiagram === 'medallion' ? '▲ collapse' : '▼ expand'}</span>
                </div>
                <p className="text-xs text-muted">Layered data quality model — used in Databricks Lakehouse and Delta Lake</p>
              </button>
              <AnimatePresence>
                {selectedDiagram === 'medallion' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <p className="text-xs text-[#00d4ff88] mt-3 mb-1">🖱 Hover any block to learn its role</p>
                    <div className="mt-1 overflow-x-auto" onMouseMove={e => setTipPos({ x: e.clientX, y: e.clientY })} onMouseLeave={clearBlock}>
                      <svg viewBox="0 0 820 280" className="w-full" style={{ minWidth: 640, fontFamily: 'monospace' }}>
                        <defs>
                          <marker id="arrowM" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill="#00d4ff" />
                          </marker>
                        </defs>
                        <rect width="820" height="280" fill="#0d0d14" rx="12" />

                        {/* Source */}
                        <rect x="10" y="100" width="110" height="80" rx="8" fill="#1a1a2e" stroke="#00d4ff" strokeWidth="1.5" />
                        <text x="65" y="130" fill="#00d4ff" fontSize="11" textAnchor="middle" fontWeight="bold">Raw Sources</text>
                        <text x="65" y="148" fill="#8888aa" fontSize="9" textAnchor="middle">DBs, APIs</text>
                        <text x="65" y="164" fill="#8888aa" fontSize="9" textAnchor="middle">Files, Streams</text>

                        <line x1="120" y1="140" x2="170" y2="140" stroke="#00d4ff" strokeWidth="1.5" markerEnd="url(#arrowM)" />

                        {/* Bronze */}
                        <rect x="174" y="60" width="170" height="160" rx="10" fill="#1a0e00" stroke="#cd7f32" strokeWidth="2" />
                        <text x="259" y="90" fill="#cd7f32" fontSize="14" textAnchor="middle" fontWeight="bold">🥉 Bronze</text>
                        <text x="259" y="112" fill="#8888aa" fontSize="10" textAnchor="middle">Raw ingestion</text>
                        <text x="259" y="130" fill="#8888aa" fontSize="10" textAnchor="middle">No transforms</text>
                        <text x="259" y="148" fill="#8888aa" fontSize="10" textAnchor="middle">Schema-on-read</text>
                        <text x="259" y="168" fill="#cd7f32" fontSize="9" textAnchor="middle">S3 / Delta raw/</text>
                        <text x="259" y="184" fill="#cd7f32" fontSize="9" textAnchor="middle">Append-only</text>
                        <text x="259" y="202" fill="#555" fontSize="9" textAnchor="middle">Days/weeks retention</text>

                        <line x1="344" y1="140" x2="394" y2="140" stroke="#cd7f32" strokeWidth="1.5" markerEnd="url(#arrowM)" />
                        <text x="369" y="130" fill="#8888aa" fontSize="9" textAnchor="middle">Clean</text>
                        <text x="369" y="154" fill="#8888aa" fontSize="9" textAnchor="middle">Dedupe</text>

                        {/* Silver */}
                        <rect x="398" y="60" width="170" height="160" rx="10" fill="#111822" stroke="#9ca3af" strokeWidth="2" />
                        <text x="483" y="90" fill="#9ca3af" fontSize="14" textAnchor="middle" fontWeight="bold">🥈 Silver</text>
                        <text x="483" y="112" fill="#8888aa" fontSize="10" textAnchor="middle">Cleaned data</text>
                        <text x="483" y="130" fill="#8888aa" fontSize="10" textAnchor="middle">Deduplicated</text>
                        <text x="483" y="148" fill="#8888aa" fontSize="10" textAnchor="middle">Validated types</text>
                        <text x="483" y="168" fill="#9ca3af" fontSize="9" textAnchor="middle">S3 / Delta clean/</text>
                        <text x="483" y="184" fill="#9ca3af" fontSize="9" textAnchor="middle">Partitioned</text>
                        <text x="483" y="202" fill="#555" fontSize="9" textAnchor="middle">Sources of truth</text>

                        <line x1="568" y1="140" x2="618" y2="140" stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#arrowM)" />
                        <text x="593" y="130" fill="#8888aa" fontSize="9" textAnchor="middle">Agg</text>
                        <text x="593" y="154" fill="#8888aa" fontSize="9" textAnchor="middle">Join</text>

                        {/* Gold */}
                        <rect x="622" y="60" width="170" height="160" rx="10" fill="#1a1400" stroke="#facc15" strokeWidth="2" />
                        <text x="707" y="90" fill="#facc15" fontSize="14" textAnchor="middle" fontWeight="bold">🥇 Gold</text>
                        <text x="707" y="112" fill="#8888aa" fontSize="10" textAnchor="middle">Business-ready</text>
                        <text x="707" y="130" fill="#8888aa" fontSize="10" textAnchor="middle">Aggregated</text>
                        <text x="707" y="148" fill="#8888aa" fontSize="10" textAnchor="middle">Denormalized</text>
                        <text x="707" y="168" fill="#facc15" fontSize="9" textAnchor="middle">S3 / Delta gold/</text>
                        <text x="707" y="184" fill="#facc15" fontSize="9" textAnchor="middle">Optimized for BI</text>
                        <text x="707" y="202" fill="#555" fontSize="9" textAnchor="middle">Dashboards / ML</text>

                        {/* ── Hover overlay rects ── */}
                        <rect x="10" y="100" width="110" height="80" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('medallion-source')} onMouseLeave={clearBlock} />
                        <rect x="174" y="60" width="170" height="160" rx="10" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('medallion-bronze')} onMouseLeave={clearBlock} />
                        <rect x="398" y="60" width="170" height="160" rx="10" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('medallion-silver')} onMouseLeave={clearBlock} />
                        <rect x="622" y="60" width="170" height="160" rx="10" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('medallion-gold')} onMouseLeave={clearBlock} />
                      </svg>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span style={{color:'#cd7f32'}} className="font-bold">Bronze: </span><span className="text-muted">Raw as-is. Never delete. Time-travel friendly.</span></div>
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span style={{color:'#9ca3af'}} className="font-bold">Silver: </span><span className="text-muted">Cleaned, typed, deduplicated. Source of truth.</span></div>
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span className="text-yellow-400 font-bold">Gold: </span><span className="text-muted">Aggregated, domain-specific. BI / ML ready.</span></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            {/* Kafka Streaming */}
            <GlassCard>
              <button className="w-full text-left" onClick={() => setSelectedDiagram(selectedDiagram === 'kafka' ? null : 'kafka')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-heading font-semibold text-foreground">📨 Kafka / MSK Streaming Pipeline</h4>
                  <span className="text-xs text-muted">{selectedDiagram === 'kafka' ? '▲ collapse' : '▼ expand'}</span>
                </div>
                <p className="text-xs text-muted">Producers → MSK Topics → Consumer Groups → Kinesis Analytics / Spark / S3 — Industry-standard event streaming</p>
              </button>
              <AnimatePresence>
                {selectedDiagram === 'kafka' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <p className="text-xs text-[#ff990088] mt-3 mb-1">🖱 Hover any block to learn its role — MSK = Amazon Managed Streaming for Apache Kafka</p>
                    <div className="mt-1 overflow-x-auto" onMouseMove={e => setTipPos({ x: e.clientX, y: e.clientY })} onMouseLeave={clearBlock}>
                      <svg viewBox="0 0 900 340" className="w-full" style={{ minWidth: 720, fontFamily: 'sans-serif' }}>
                        <defs>
                          <marker id="arrowKf2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#ff9900"/></marker>
                          <marker id="arrowKfG" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#7aa116"/></marker>
                        </defs>
                        <rect width="900" height="340" fill="#161b22" rx="12"/>
                        <rect x="8" y="8" width="884" height="324" rx="10" fill="none" stroke="#30363d" strokeWidth="1"/>

                        {/* PRODUCERS LANE */}
                        <rect x="16" y="20" width="145" height="300" rx="6" fill="#1c2128" stroke="#30363d"/>
                        <text x="88" y="38" fill="#8b949e" fontSize="9" textAnchor="middle" fontWeight="bold" letterSpacing="1">PRODUCERS</text>

                        {/* Producer A — App Service */}
                        <rect x="26" y="50" width="125" height="68" rx="7" fill="#1e2730" stroke="#58a6ff" strokeWidth="1.5"/>
                        <text x="88" y="74" fill="#58a6ff" fontSize="15" textAnchor="middle">🖥️</text>
                        <text x="88" y="93" fill="#58a6ff" fontSize="10" textAnchor="middle" fontWeight="bold">App Service</text>
                        <text x="88" y="108" fill="#6e7681" fontSize="8" textAnchor="middle">REST API / SDK</text>

                        {/* Producer B — IoT / CDC */}
                        <rect x="26" y="136" width="125" height="68" rx="7" fill="#1e2730" stroke="#58a6ff" strokeWidth="1.5"/>
                        <text x="88" y="160" fill="#58a6ff" fontSize="14" textAnchor="middle">📟</text>
                        <text x="88" y="179" fill="#58a6ff" fontSize="10" textAnchor="middle" fontWeight="bold">CDC / DMS</text>
                        <text x="88" y="194" fill="#6e7681" fontSize="8" textAnchor="middle">DB change events</text>

                        {/* Producer C — Clickstream */}
                        <rect x="26" y="222" width="125" height="68" rx="7" fill="#1e2730" stroke="#58a6ff" strokeWidth="1.5"/>
                        <text x="88" y="246" fill="#58a6ff" fontSize="14" textAnchor="middle">🖱️</text>
                        <text x="88" y="265" fill="#58a6ff" fontSize="10" textAnchor="middle" fontWeight="bold">Clickstream</text>
                        <text x="88" y="280" fill="#6e7681" fontSize="8" textAnchor="middle">Kinesis SDK / agent</text>

                        {/* Arrows → MSK */}
                        <line x1="151" y1="84" x2="175" y2="120" stroke="#58a6ff" strokeWidth="1.5" markerEnd="url(#arrowKf2)"/>
                        <line x1="151" y1="170" x2="175" y2="170" stroke="#58a6ff" strokeWidth="1.5" markerEnd="url(#arrowKf2)"/>
                        <line x1="151" y1="256" x2="175" y2="215" stroke="#58a6ff" strokeWidth="1.5" markerEnd="url(#arrowKf2)"/>

                        {/* MSK BROKER LANE */}
                        <rect x="173" y="20" width="280" height="300" rx="6" fill="#1c2128" stroke="#30363d"/>
                        <text x="313" y="38" fill="#8b949e" fontSize="9" textAnchor="middle" fontWeight="bold" letterSpacing="1">AMAZON MSK (KAFKA)</text>

                        {/* MSK Cluster box */}
                        <rect x="183" y="50" width="260" height="258" rx="8" fill="#1a1220" stroke="#f97316" strokeWidth="2"/>
                        <text x="313" y="74" fill="#f97316" fontSize="11" textAnchor="middle" fontWeight="bold">MSK Cluster — 3 Brokers (AZ-aware)</text>

                        {/* Topic: orders */}
                        <rect x="195" y="86" width="236" height="50" rx="5" fill="#200e00" stroke="#f97316" strokeWidth="1"/>
                        <text x="225" y="106" fill="#f97316" fontSize="9" fontWeight="bold">topic: user-events</text>
                        <rect x="310" y="90" width="36" height="40" rx="3" fill="#2a1000" stroke="#f97316" strokeWidth="0.8"/>
                        <text x="328" y="106" fill="#aaa" fontSize="8" textAnchor="middle">P0</text>
                        <text x="328" y="120" fill="#555" fontSize="7" textAnchor="middle">offset 0…</text>
                        <rect x="350" y="90" width="36" height="40" rx="3" fill="#2a1000" stroke="#f97316" strokeWidth="0.8"/>
                        <text x="368" y="106" fill="#aaa" fontSize="8" textAnchor="middle">P1</text>
                        <text x="368" y="120" fill="#555" fontSize="7" textAnchor="middle">offset 0…</text>
                        <rect x="390" y="90" width="36" height="40" rx="3" fill="#2a1000" stroke="#f97316" strokeWidth="0.8"/>
                        <text x="408" y="106" fill="#aaa" fontSize="8" textAnchor="middle">P2</text>
                        <text x="408" y="120" fill="#555" fontSize="7" textAnchor="middle">offset 0…</text>

                        {/* Topic: orders */}
                        <rect x="195" y="148" width="236" height="50" rx="5" fill="#200e00" stroke="#f97316" strokeWidth="1"/>
                        <text x="225" y="168" fill="#f97316" fontSize="9" fontWeight="bold">topic: transactions</text>
                        <rect x="310" y="152" width="36" height="40" rx="3" fill="#2a1000" stroke="#f97316" strokeWidth="0.8"/>
                        <text x="328" y="172" fill="#aaa" fontSize="8" textAnchor="middle">P0</text>
                        <rect x="350" y="152" width="36" height="40" rx="3" fill="#2a1000" stroke="#f97316" strokeWidth="0.8"/>
                        <text x="368" y="172" fill="#aaa" fontSize="8" textAnchor="middle">P1</text>

                        {/* Topic: metrics */}
                        <rect x="195" y="210" width="236" height="50" rx="5" fill="#200e00" stroke="#f97316" strokeWidth="1"/>
                        <text x="225" y="230" fill="#f97316" fontSize="9" fontWeight="bold">topic: metrics</text>
                        <rect x="310" y="214" width="36" height="40" rx="3" fill="#2a1000" stroke="#f97316" strokeWidth="0.8"/>
                        <text x="328" y="234" fill="#aaa" fontSize="8" textAnchor="middle">P0</text>

                        <text x="313" y="292" fill="#555" fontSize="8" textAnchor="middle">Offsets tracked per consumer group</text>

                        {/* Schema Registry */}
                        <rect x="195" y="270" width="236" height="26" rx="4" fill="#14200e" stroke="#7aa116" strokeWidth="1"/>
                        <text x="313" y="287" fill="#7aa116" fontSize="9" textAnchor="middle" fontWeight="bold">Glue Schema Registry — Avro / Protobuf</text>

                        {/* Arrows → Consumers */}
                        <line x1="453" y1="110" x2="475" y2="75" stroke="#f97316" strokeWidth="1.5" markerEnd="url(#arrowKf2)"/>
                        <line x1="453" y1="173" x2="475" y2="175" stroke="#f97316" strokeWidth="1.5" markerEnd="url(#arrowKf2)"/>
                        <line x1="453" y1="235" x2="475" y2="270" stroke="#f97316" strokeWidth="1.5" markerEnd="url(#arrowKf2)"/>

                        {/* CONSUMER LANE */}
                        <rect x="461" y="20" width="200" height="300" rx="6" fill="#1c2128" stroke="#30363d"/>
                        <text x="561" y="38" fill="#8b949e" fontSize="9" textAnchor="middle" fontWeight="bold" letterSpacing="1">CONSUMERS</text>

                        {/* Kinesis Analytics (Flink) */}
                        <rect x="471" y="50" width="180" height="68" rx="7" fill="#1e2730" stroke="#7aa116" strokeWidth="1.5"/>
                        <text x="561" y="74" fill="#7aa116" fontSize="13" textAnchor="middle">⚡</text>
                        <text x="561" y="92" fill="#7aa116" fontSize="10" textAnchor="middle" fontWeight="bold">Kinesis Analytics</text>
                        <text x="561" y="107" fill="#6e7681" fontSize="8" textAnchor="middle">Apache Flink — windowed aggs</text>

                        {/* AWS Glue Streaming */}
                        <rect x="471" y="136" width="180" height="68" rx="7" fill="#1e2730" stroke="#7aa116" strokeWidth="1.5"/>
                        <text x="561" y="160" fill="#7aa116" fontSize="13" textAnchor="middle">🔧</text>
                        <text x="561" y="178" fill="#7aa116" fontSize="10" textAnchor="middle" fontWeight="bold">AWS Glue Streaming</text>
                        <text x="561" y="193" fill="#6e7681" fontSize="8" textAnchor="middle">Micro-batch → S3 / Redshift</text>

                        {/* Lambda */}
                        <rect x="471" y="222" width="180" height="68" rx="7" fill="#1e2730" stroke="#e91e8c" strokeWidth="1.5"/>
                        <text x="561" y="246" fill="#e91e8c" fontSize="13" textAnchor="middle">λ</text>
                        <text x="561" y="264" fill="#e91e8c" fontSize="10" textAnchor="middle" fontWeight="bold">AWS Lambda</text>
                        <text x="561" y="279" fill="#6e7681" fontSize="8" textAnchor="middle">Light transforms / alerts</text>

                        {/* SINKS LANE */}
                        <rect x="673" y="20" width="219" height="300" rx="6" fill="#1c2128" stroke="#30363d"/>
                        <text x="782" y="38" fill="#8b949e" fontSize="9" textAnchor="middle" fontWeight="bold" letterSpacing="1">SINKS</text>

                        {/* S3 sink */}
                        <rect x="683" y="50" width="199" height="60" rx="7" fill="#1e2730" stroke="#ff9900" strokeWidth="1.5"/>
                        <text x="782" y="74" fill="#ff9900" fontSize="12" textAnchor="middle">🪣</text>
                        <text x="782" y="93" fill="#ff9900" fontSize="10" textAnchor="middle" fontWeight="bold">S3 — Parquet (Iceberg)</text>
                        <text x="782" y="105" fill="#6e7681" fontSize="8" textAnchor="middle">Cold analytics store</text>

                        {/* Redshift sink */}
                        <rect x="683" y="128" width="199" height="60" rx="7" fill="#1e2730" stroke="#e0001a" strokeWidth="1.5"/>
                        <text x="782" y="152" fill="#e0001a" fontSize="12" textAnchor="middle">🏛️</text>
                        <text x="782" y="171" fill="#e0001a" fontSize="10" textAnchor="middle" fontWeight="bold">Redshift / DWH</text>
                        <text x="782" y="183" fill="#6e7681" fontSize="8" textAnchor="middle">Streaming inserts (COPY)</text>

                        {/* DynamoDB / Redis */}
                        <rect x="683" y="206" width="199" height="60" rx="7" fill="#1e2730" stroke="#4ade80" strokeWidth="1.5"/>
                        <text x="782" y="230" fill="#4ade80" fontSize="12" textAnchor="middle">🗄️</text>
                        <text x="782" y="249" fill="#4ade80" fontSize="10" textAnchor="middle" fontWeight="bold">DynamoDB / ElastiCache</text>
                        <text x="782" y="261" fill="#6e7681" fontSize="8" textAnchor="middle">Real-time lookups</text>

                        {/* SNS Alerts */}
                        <rect x="683" y="284" width="199" height="26" rx="5" fill="#1e2730" stroke="#e91e8c" strokeWidth="1"/>
                        <text x="782" y="301" fill="#e91e8c" fontSize="9" textAnchor="middle" fontWeight="bold">SNS → PagerDuty Alerts</text>

                        {/* Arrows consumers → sinks */}
                        <line x1="651" y1="84" x2="681" y2="80" stroke="#7aa116" strokeWidth="1.5" markerEnd="url(#arrowKfG)"/>
                        <line x1="651" y1="170" x2="681" y2="158" stroke="#7aa116" strokeWidth="1.5" markerEnd="url(#arrowKfG)"/>
                        <line x1="651" y1="256" x2="681" y2="236" stroke="#7aa116" strokeWidth="1.5" markerEnd="url(#arrowKfG)"/>
                        <line x1="651" y1="278" x2="740" y2="297" stroke="#e91e8c" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#arrowKf2)"/>

                        {/* ── Hover overlay rects ── */}
                        <rect x="26" y="50" width="125" height="68" rx="7" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('kafka-producer')} onMouseLeave={clearBlock}/>
                        <rect x="26" y="136" width="125" height="68" rx="7" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('kafka-producer')} onMouseLeave={clearBlock}/>
                        <rect x="26" y="222" width="125" height="68" rx="7" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('kafka-producer')} onMouseLeave={clearBlock}/>
                        <rect x="183" y="50" width="260" height="258" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('kafka-broker')} onMouseLeave={clearBlock}/>
                        <rect x="471" y="50" width="180" height="68" rx="7" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('kafka-consumer-grp')} onMouseLeave={clearBlock}/>
                        <rect x="471" y="136" width="180" height="68" rx="7" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('kafka-consumer-grp')} onMouseLeave={clearBlock}/>
                        <rect x="471" y="222" width="180" height="68" rx="7" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('kafka-consumer-grp')} onMouseLeave={clearBlock}/>
                      </svg>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span className="text-orange-400 font-bold">MSK: </span><span className="text-muted">Managed Apache Kafka — 3-broker, multi-AZ. Partitions = unit of parallelism.</span></div>
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span style={{color:'#7aa116'}} className="font-bold">Schema Registry: </span><span className="text-muted">Glue Schema Registry enforces Avro/Protobuf schemas across all producers.</span></div>
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span className="text-success font-bold">Fan-out: </span><span className="text-muted">Same MSK topic → Flink + Glue + Lambda simultaneously via consumer groups.</span></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            {/* AWS Data Pipeline */}
            <GlassCard>
              <button className="w-full text-left" onClick={() => setSelectedDiagram(selectedDiagram === 'aws' ? null : 'aws')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-heading font-semibold text-foreground">☁️ AWS Serverless Data Lake Pipeline</h4>
                  <span className="text-xs text-muted">{selectedDiagram === 'aws' ? '▲ collapse' : '▼ expand'}</span>
                </div>
                <p className="text-xs text-muted">Industry-standard AWS data lake: Kinesis → S3 (Bronze/Silver/Gold) → Glue → Athena/Redshift — AWS Well-Architected</p>
              </button>
              <AnimatePresence>
                {selectedDiagram === 'aws' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <p className="text-xs text-[#ff990088] mt-3 mb-1">🖱 Hover any service to learn its role — AWS icons follow Well-Architected standards</p>
                    <div className="mt-1 overflow-x-auto" onMouseMove={e => setTipPos({ x: e.clientX, y: e.clientY })} onMouseLeave={clearBlock}>
                      <svg viewBox="0 0 900 360" className="w-full" style={{ minWidth: 720, fontFamily: 'sans-serif' }}>
                        <defs>
                          <marker id="arrowAws2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#ff9900"/></marker>
                          <marker id="arrowAwsBlue" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#4893c9"/></marker>
                          <marker id="arrowAwsGreen" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#7aa116"/></marker>
                          {/* AWS service icon base — rounded square */}
                          <filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.4"/></filter>
                        </defs>
                        <rect width="900" height="360" fill="#161b22" rx="12"/>
                        {/* ── LANE LABELS ── */}
                        <rect x="8" y="8" width="884" height="344" rx="10" fill="none" stroke="#30363d" strokeWidth="1"/>

                        {/* INGEST lane */}
                        <rect x="16" y="20" width="130" height="320" rx="6" fill="#1c2128" stroke="#30363d" strokeWidth="1"/>
                        <text x="81" y="38" fill="#8b949e" fontSize="9" textAnchor="middle" fontWeight="bold" letterSpacing="1">INGEST</text>

                        {/* STORAGE lane */}
                        <rect x="158" y="20" width="200" height="320" rx="6" fill="#1c2128" stroke="#30363d"/>
                        <text x="258" y="38" fill="#8b949e" fontSize="9" textAnchor="middle" fontWeight="bold" letterSpacing="1">STORAGE</text>

                        {/* PROCESS lane */}
                        <rect x="370" y="20" width="160" height="320" rx="6" fill="#1c2128" stroke="#30363d"/>
                        <text x="450" y="38" fill="#8b949e" fontSize="9" textAnchor="middle" fontWeight="bold" letterSpacing="1">PROCESS</text>

                        {/* SERVE lane */}
                        <rect x="542" y="20" width="200" height="320" rx="6" fill="#1c2128" stroke="#30363d"/>
                        <text x="642" y="38" fill="#8b949e" fontSize="9" textAnchor="middle" fontWeight="bold" letterSpacing="1">SERVE</text>

                        {/* GOVERN lane */}
                        <rect x="754" y="20" width="138" height="320" rx="6" fill="#1c2128" stroke="#30363d"/>
                        <text x="823" y="38" fill="#8b949e" fontSize="9" textAnchor="middle" fontWeight="bold" letterSpacing="1">GOVERN</text>

                        {/* ── AWS SERVICE ICONS ── */}
                        {/* Kinesis Firehose — orange swirl shape */}
                        <rect x="26" y="60" width="110" height="76" rx="8" fill="#1e2730" stroke="#ff9900" strokeWidth="1.5" filter="url(#shadow)"/>
                        <ellipse cx="81" cy="83" rx="18" ry="14" fill="#ff9900" opacity="0.15"/>
                        <text x="81" y="87" fill="#ff9900" fontSize="18" textAnchor="middle">〜</text>
                        <text x="81" y="104" fill="#ff9900" fontSize="10" textAnchor="middle" fontWeight="bold">Kinesis</text>
                        <text x="81" y="117" fill="#8b949e" fontSize="8.5" textAnchor="middle">Firehose</text>
                        <text x="81" y="129" fill="#6e7681" fontSize="7.5" textAnchor="middle">Streaming ingest</text>

                        {/* DMS — migration arrows icon */}
                        <rect x="26" y="160" width="110" height="76" rx="8" fill="#1e2730" stroke="#3b82f6" strokeWidth="1.5" filter="url(#shadow)"/>
                        <text x="81" y="184" fill="#3b82f6" fontSize="18" textAnchor="middle">⇄</text>
                        <text x="81" y="204" fill="#3b82f6" fontSize="10" textAnchor="middle" fontWeight="bold">AWS DMS</text>
                        <text x="81" y="217" fill="#8b949e" fontSize="8.5" textAnchor="middle">Database Migration</text>
                        <text x="81" y="229" fill="#6e7681" fontSize="7.5" textAnchor="middle">CDC replication</text>

                        {/* Arrows ingest → S3 Raw */}
                        <line x1="136" y1="98" x2="165" y2="130" stroke="#ff9900" strokeWidth="1.5" markerEnd="url(#arrowAws2)"/>
                        <line x1="136" y1="198" x2="165" y2="170" stroke="#4893c9" strokeWidth="1.5" markerEnd="url(#arrowAwsBlue)"/>

                        {/* S3 Bronze — bucket cylinder */}
                        <rect x="168" y="55" width="110" height="88" rx="8" fill="#1e2730" stroke="#ff9900" strokeWidth="2" filter="url(#shadow)"/>
                        <ellipse cx="223" cy="75" rx="20" ry="8" fill="#ff9900" opacity="0.2"/>
                        <rect x="203" y="75" width="40" height="28" fill="#ff9900" opacity="0.1"/>
                        <ellipse cx="223" cy="103" rx="20" ry="8" fill="#ff9900" opacity="0.2"/>
                        <text x="223" y="90" fill="#ff9900" fontSize="16" textAnchor="middle">🪣</text>
                        <text x="223" y="108" fill="#ff9900" fontSize="10" textAnchor="middle" fontWeight="bold">S3</text>
                        <text x="223" y="121" fill="#c9a227" fontSize="8.5" textAnchor="middle">🥉 Bronze / Raw</text>
                        <text x="223" y="133" fill="#6e7681" fontSize="7.5" textAnchor="middle">schema-on-read</text>

                        {/* S3 Silver */}
                        <rect x="168" y="160" width="110" height="88" rx="8" fill="#1e2730" stroke="#9ca3af" strokeWidth="2" filter="url(#shadow)"/>
                        <text x="223" y="197" fill="#9ca3af" fontSize="16" textAnchor="middle">🪣</text>
                        <text x="223" y="213" fill="#9ca3af" fontSize="10" textAnchor="middle" fontWeight="bold">S3</text>
                        <text x="223" y="226" fill="#9ca3af" fontSize="8.5" textAnchor="middle">🥈 Silver / Cleaned</text>
                        <text x="223" y="238" fill="#6e7681" fontSize="7.5" textAnchor="middle">deduplicated</text>

                        {/* S3 Gold */}
                        <rect x="168" y="265" width="110" height="64" rx="8" fill="#1e2730" stroke="#facc15" strokeWidth="2" filter="url(#shadow)"/>
                        <text x="223" y="291" fill="#facc15" fontSize="14" textAnchor="middle">🪣</text>
                        <text x="223" y="307" fill="#facc15" fontSize="10" textAnchor="middle" fontWeight="bold">S3  🥇 Gold</text>
                        <text x="223" y="320" fill="#6e7681" fontSize="7.5" textAnchor="middle">aggregated / BI-ready</text>

                        {/* Arrows S3 raw → Glue */}
                        <line x1="278" y1="99" x2="374" y2="160" stroke="#ff9900" strokeWidth="1.5" markerEnd="url(#arrowAws2)"/>
                        <line x1="278" y1="204" x2="374" y2="190" stroke="#ff9900" strokeWidth="1.5" markerEnd="url(#arrowAws2)"/>
                        <line x1="278" y1="284" x2="374" y2="220" stroke="#facc15" strokeWidth="1.2" strokeDasharray="4,2" markerEnd="url(#arrowAws2)"/>

                        {/* AWS Glue */}
                        <rect x="382" y="120" width="130" height="110" rx="8" fill="#1e2730" stroke="#7aa116" strokeWidth="2" filter="url(#shadow)"/>
                        <text x="447" y="151" fill="#7aa116" fontSize="20" textAnchor="middle">🔧</text>
                        <text x="447" y="171" fill="#7aa116" fontSize="11" textAnchor="middle" fontWeight="bold">AWS Glue</text>
                        <text x="447" y="187" fill="#8b949e" fontSize="8.5" textAnchor="middle">ETL · Spark 3.x</text>
                        <text x="447" y="201" fill="#8b949e" fontSize="8.5" textAnchor="middle">Data Catalog</text>
                        <text x="447" y="215" fill="#6e7681" fontSize="7.5" textAnchor="middle">Schema Registry</text>
                        <text x="447" y="225" fill="#6e7681" fontSize="7.5" textAnchor="middle">Job bookmarks</text>

                        {/* Arrows Glue → Silver + Serve */}
                        <line x1="382" y1="175" x2="278" y2="204" stroke="#7aa116" strokeWidth="1.5" markerEnd="url(#arrowAwsGreen)"/>
                        <line x1="512" y1="175" x2="546" y2="175" stroke="#7aa116" strokeWidth="1.5" markerEnd="url(#arrowAwsGreen)"/>

                        {/* Athena */}
                        <rect x="554" y="50" width="120" height="90" rx="8" fill="#1e2730" stroke="#8b5cf6" strokeWidth="2" filter="url(#shadow)"/>
                        <text x="614" y="80" fill="#8b5cf6" fontSize="18" textAnchor="middle">🔍</text>
                        <text x="614" y="100" fill="#8b5cf6" fontSize="11" textAnchor="middle" fontWeight="bold">Athena v3</text>
                        <text x="614" y="115" fill="#8b949e" fontSize="8.5" textAnchor="middle">Serverless SQL</text>
                        <text x="614" y="128" fill="#8b949e" fontSize="8.5" textAnchor="middle">$5/TB scanned</text>
                        <text x="614" y="133" fill="#6e7681" fontSize="7" textAnchor="middle">Presto / Trino</text>

                        {/* Redshift */}
                        <rect x="554" y="160" width="120" height="90" rx="8" fill="#1e2730" stroke="#e0001a" strokeWidth="2" filter="url(#shadow)"/>
                        <text x="614" y="190" fill="#e0001a" fontSize="18" textAnchor="middle">🏛️</text>
                        <text x="614" y="210" fill="#e0001a" fontSize="11" textAnchor="middle" fontWeight="bold">Redshift</text>
                        <text x="614" y="225" fill="#8b949e" fontSize="8.5" textAnchor="middle">MPP DWH</text>
                        <text x="614" y="238" fill="#8b949e" fontSize="8.5" textAnchor="middle">+ Spectrum</text>

                        {/* QuickSight BI */}
                        <rect x="554" y="270" width="120" height="64" rx="8" fill="#1e2730" stroke="#00a4b4" strokeWidth="1.5" filter="url(#shadow)"/>
                        <text x="614" y="293" fill="#00a4b4" fontSize="16" textAnchor="middle">📊</text>
                        <text x="614" y="311" fill="#00a4b4" fontSize="10" textAnchor="middle" fontWeight="bold">QuickSight / BI</text>
                        <text x="614" y="324" fill="#6e7681" fontSize="7.5" textAnchor="middle">Dashboards</text>

                        {/* Arrows Athena/Redshift → QS */}
                        <line x1="614" y1="250" x2="614" y2="268" stroke="#8b5cf6" strokeWidth="1.2" markerEnd="url(#arrowAws2)"/>
                        <line x1="614" y1="140" x2="614" y2="157" stroke="#8b5cf6" strokeWidth="1.2" markerEnd="url(#arrowAws2)"/>

                        {/* S3 Gold → Athena */}
                        <line x1="278" y1="280" x2="553" y2="100" stroke="#facc15" strokeWidth="1.2" strokeDasharray="4,2" markerEnd="url(#arrowAws2)"/>

                        {/* Lake Formation */}
                        <rect x="762" y="55" width="118" height="106" rx="8" fill="#1e2730" stroke="#059669" strokeWidth="1.5" filter="url(#shadow)"/>
                        <text x="821" y="84" fill="#059669" fontSize="16" textAnchor="middle">🏛️</text>
                        <text x="821" y="103" fill="#059669" fontSize="10" textAnchor="middle" fontWeight="bold">Lake Formation</text>
                        <text x="821" y="119" fill="#8b949e" fontSize="8" textAnchor="middle">Column-level security</text>
                        <text x="821" y="133" fill="#8b949e" fontSize="8" textAnchor="middle">Cross-acct sharing</text>
                        <text x="821" y="148" fill="#6e7681" fontSize="7.5" textAnchor="middle">LF-TBAC tags</text>

                        {/* CloudWatch */}
                        <rect x="762" y="180" width="118" height="80" rx="8" fill="#1e2730" stroke="#e05d2a" strokeWidth="1.5" filter="url(#shadow)"/>
                        <text x="821" y="207" fill="#e05d2a" fontSize="14" textAnchor="middle">📈</text>
                        <text x="821" y="224" fill="#e05d2a" fontSize="10" textAnchor="middle" fontWeight="bold">CloudWatch</text>
                        <text x="821" y="239" fill="#8b949e" fontSize="8" textAnchor="middle">Pipeline Monitoring</text>
                        <text x="821" y="252" fill="#6e7681" fontSize="7.5" textAnchor="middle">Alarms · Dashboards</text>

                        {/* EventBridge */}
                        <rect x="762" y="278" width="118" height="54" rx="8" fill="#1e2730" stroke="#e91e8c" strokeWidth="1.5" filter="url(#shadow)"/>
                        <text x="821" y="300" fill="#e91e8c" fontSize="12" textAnchor="middle">📡</text>
                        <text x="821" y="316" fill="#e91e8c" fontSize="10" textAnchor="middle" fontWeight="bold">EventBridge</text>
                        <text x="821" y="326" fill="#6e7681" fontSize="7.5" textAnchor="middle">Event-driven triggers</text>

                        {/* Governance arrows */}
                        <line x1="674" y1="95" x2="760" y2="108" stroke="#059669" strokeWidth="1" strokeDasharray="3,2"/>
                        <line x1="674" y1="205" x2="760" y2="220" stroke="#e05d2a" strokeWidth="1" strokeDasharray="3,2"/>

                        {/* ── Hover overlay rects ── */}
                        <rect x="26" y="60" width="110" height="76" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('aws-ingest')} onMouseLeave={clearBlock}/>
                        <rect x="26" y="160" width="110" height="76" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('aws-ingest')} onMouseLeave={clearBlock}/>
                        <rect x="168" y="55" width="110" height="88" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('aws-s3-raw')} onMouseLeave={clearBlock}/>
                        <rect x="168" y="160" width="110" height="88" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('aws-s3-clean')} onMouseLeave={clearBlock}/>
                        <rect x="168" y="265" width="110" height="64" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('aws-s3-clean')} onMouseLeave={clearBlock}/>
                        <rect x="382" y="120" width="130" height="110" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('aws-glue')} onMouseLeave={clearBlock}/>
                        <rect x="554" y="50" width="120" height="90" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('aws-athena')} onMouseLeave={clearBlock}/>
                        <rect x="554" y="160" width="120" height="90" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('aws-redshift')} onMouseLeave={clearBlock}/>
                        <rect x="762" y="55" width="118" height="106" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('aws-lake-formation')} onMouseLeave={clearBlock}/>
                      </svg>
                    </div>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span style={{color:'#ff9900'}} className="font-bold">S3 Zones: </span><span className="text-muted">Bronze (raw) → Silver (clean) → Gold (aggregated)</span></div>
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span className="text-green-500 font-bold">Glue: </span><span className="text-muted">ETL + unified Data Catalog. Crawlers auto-register schemas.</span></div>
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span className="text-purple-400 font-bold">Athena: </span><span className="text-muted">Serverless SQL. $5/TB → Parquet = ~$0.05/query.</span></div>
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span className="text-red-400 font-bold">Redshift: </span><span className="text-muted">MPP DWH. Best for repeated complex BI queries.</span></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            {/* Spark Pipeline */}
            <GlassCard>
              <button className="w-full text-left" onClick={() => setSelectedDiagram(selectedDiagram === 'spark' ? null : 'spark')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-heading font-semibold text-foreground">Spark Processing Pipeline</h4>
                  <span className="text-xs text-muted">{selectedDiagram === 'spark' ? '▲ collapse' : '▼ expand'}</span>
                </div>
                <p className="text-xs text-muted">Driver → Executors → Stages — how Spark distributes computation</p>
              </button>
              <AnimatePresence>
                {selectedDiagram === 'spark' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <p className="text-xs text-[#00d4ff88] mt-3 mb-1">🖱 Hover any block to learn its role</p>
                    <div className="mt-1 overflow-x-auto" onMouseMove={e => setTipPos({ x: e.clientX, y: e.clientY })} onMouseLeave={clearBlock}>
                      <svg viewBox="0 0 820 280" className="w-full" style={{ minWidth: 640, fontFamily: 'monospace' }}>
                        <defs>
                          <marker id="arrowSp" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill="#00d4ff" />
                          </marker>
                        </defs>
                        <rect width="820" height="280" fill="#0d0d14" rx="12" />

                        {/* Source */}
                        <rect x="10" y="110" width="110" height="60" rx="8" fill="#1a1a2e" stroke="#00d4ff" strokeWidth="1.5" />
                        <text x="65" y="136" fill="#00d4ff" fontSize="11" textAnchor="middle" fontWeight="bold">S3 Source</text>
                        <text x="65" y="152" fill="#8888aa" fontSize="9" textAnchor="middle">Parquet files</text>
                        <text x="65" y="164" fill="#555" fontSize="8" textAnchor="middle">(partitioned)</text>

                        <line x1="120" y1="140" x2="166" y2="140" stroke="#00d4ff" strokeWidth="1.5" markerEnd="url(#arrowSp)" />

                        {/* Driver */}
                        <rect x="170" y="80" width="140" height="120" rx="8" fill="#1a0014" stroke="#e11d48" strokeWidth="2" />
                        <text x="240" y="110" fill="#e11d48" fontSize="12" textAnchor="middle" fontWeight="bold">Spark Driver</text>
                        <text x="240" y="130" fill="#8888aa" fontSize="9" textAnchor="middle">DAG Scheduler</text>
                        <text x="240" y="148" fill="#8888aa" fontSize="9" textAnchor="middle">Task Scheduler</text>
                        <text x="240" y="166" fill="#8888aa" fontSize="9" textAnchor="middle">Broadcast vars</text>
                        <text x="240" y="184" fill="#555" fontSize="8" textAnchor="middle">SparkContext</text>

                        {/* Stage arrows */}
                        <line x1="310" y1="110" x2="356" y2="70" stroke="#e11d48" strokeWidth="1.2" markerEnd="url(#arrowSp)" />
                        <line x1="310" y1="140" x2="356" y2="140" stroke="#e11d48" strokeWidth="1.2" markerEnd="url(#arrowSp)" />
                        <line x1="310" y1="170" x2="356" y2="210" stroke="#e11d48" strokeWidth="1.2" markerEnd="url(#arrowSp)" />

                        {/* Cluster Manager */}
                        <rect x="360" y="30" width="130" height="60" rx="6" fill="#0a1014" stroke="#fbbf24" strokeWidth="1.5" />
                        <text x="425" y="57" fill="#fbbf24" fontSize="11" textAnchor="middle" fontWeight="bold">Cluster Mgr</text>
                        <text x="425" y="73" fill="#8888aa" fontSize="9" textAnchor="middle">YARN / K8s / Standalone</text>

                        {/* Executors */}
                        <rect x="360" y="110" width="130" height="60" rx="6" fill="#0a1628" stroke="#00ff88" strokeWidth="1.5" />
                        <text x="425" y="137" fill="#00ff88" fontSize="11" textAnchor="middle" fontWeight="bold">Executor 1</text>
                        <text x="425" y="153" fill="#8888aa" fontSize="9" textAnchor="middle">Task slots: 4</text>
                        <text x="425" y="165" fill="#555" fontSize="8" textAnchor="middle">1 partition/task</text>

                        <rect x="360" y="188" width="130" height="60" rx="6" fill="#0a1628" stroke="#00ff88" strokeWidth="1.5" />
                        <text x="425" y="215" fill="#00ff88" fontSize="11" textAnchor="middle" fontWeight="bold">Executor 2</text>
                        <text x="425" y="231" fill="#8888aa" fontSize="9" textAnchor="middle">Task slots: 4</text>
                        <text x="425" y="243" fill="#555" fontSize="8" textAnchor="middle">1 partition/task</text>

                        {/* Shuffle */}
                        <line x1="490" y1="140" x2="536" y2="120" stroke="#00ff88" strokeWidth="1.2" markerEnd="url(#arrowSp)" />
                        <line x1="490" y1="218" x2="536" y2="160" stroke="#00ff88" strokeWidth="1.2" markerEnd="url(#arrowSp)" />
                        <text x="513" y="108" fill="#fbbf24" fontSize="9" textAnchor="middle">Shuffle</text>

                        {/* Stages */}
                        <rect x="540" y="80" width="130" height="120" rx="8" fill="#141400" stroke="#fbbf24" strokeWidth="1.5" />
                        <text x="605" y="106" fill="#fbbf24" fontSize="11" textAnchor="middle" fontWeight="bold">Stages</text>
                        <text x="605" y="126" fill="#8888aa" fontSize="9" textAnchor="middle">Stage 1: filter</text>
                        <text x="605" y="144" fill="#8888aa" fontSize="9" textAnchor="middle">Stage 2: join</text>
                        <text x="605" y="162" fill="#8888aa" fontSize="9" textAnchor="middle">Stage 3: agg</text>
                        <text x="605" y="180" fill="#555" fontSize="8" textAnchor="middle">Wide vs Narrow</text>

                        <line x1="670" y1="140" x2="714" y2="140" stroke="#fbbf24" strokeWidth="1.5" markerEnd="url(#arrowSp)" />

                        {/* Output */}
                        <rect x="718" y="100" width="90" height="80" rx="6" fill="#1a1a2e" stroke="#a855f7" strokeWidth="1.5" />
                        <text x="763" y="130" fill="#a855f7" fontSize="11" textAnchor="middle" fontWeight="bold">Output</text>
                        <text x="763" y="148" fill="#8888aa" fontSize="9" textAnchor="middle">S3 / DWH</text>
                        <text x="763" y="164" fill="#555" fontSize="8" textAnchor="middle">Parquet</text>

                        {/* ── Hover overlay rects ── */}
                        <rect x="10" y="110" width="110" height="60" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('spark-source')} onMouseLeave={clearBlock} />
                        <rect x="170" y="80" width="140" height="120" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('spark-driver')} onMouseLeave={clearBlock} />
                        <rect x="360" y="30" width="130" height="60" rx="6" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('spark-cluster-mgr')} onMouseLeave={clearBlock} />
                        <rect x="360" y="110" width="130" height="60" rx="6" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('spark-executor')} onMouseLeave={clearBlock} />
                        <rect x="360" y="188" width="130" height="60" rx="6" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('spark-executor')} onMouseLeave={clearBlock} />
                        <rect x="540" y="80" width="130" height="120" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('spark-stages')} onMouseLeave={clearBlock} />
                        <rect x="718" y="100" width="90" height="80" rx="6" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('spark-output')} onMouseLeave={clearBlock} />
                      </svg>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span className="text-red-400 font-bold">Driver: </span><span className="text-muted">Single JVM coordinating the job. DAG → stages → tasks.</span></div>
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span className="text-success font-bold">Executors: </span><span className="text-muted">Workers running tasks. Each task = 1 partition. More partitions = more parallelism.</span></div>
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span className="text-yellow-400 font-bold">Shuffle: </span><span className="text-muted">Most expensive operation. Happens on wide transformations (groupBy, join).</span></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            {/* Data Lakehouse */}
            <GlassCard>
              <button className="w-full text-left" onClick={() => setSelectedDiagram(selectedDiagram === 'lakehouse' ? null : 'lakehouse')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-heading font-semibold text-foreground">Data Lakehouse Architecture</h4>
                  <span className="text-xs text-muted">{selectedDiagram === 'lakehouse' ? '▲ collapse' : '▼ expand'}</span>
                </div>
                <p className="text-xs text-muted">Combines Data Lake (cheap storage) + Data Warehouse (ACID, performance) — Databricks / Iceberg / Delta</p>
              </button>
              <AnimatePresence>
                {selectedDiagram === 'lakehouse' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <p className="text-xs text-[#00d4ff88] mt-3 mb-1">🖱 Hover any block to learn its role</p>
                    <div className="mt-1 overflow-x-auto" onMouseMove={e => setTipPos({ x: e.clientX, y: e.clientY })} onMouseLeave={clearBlock}>
                      <svg viewBox="0 0 820 320" className="w-full" style={{ minWidth: 640, fontFamily: 'monospace' }}>
                        <defs>
                          <marker id="arrowLh" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill="#00d4ff" />
                          </marker>
                        </defs>
                        <rect width="820" height="320" fill="#0d0d14" rx="12" />

                        {/* Storage layer */}
                        <rect x="20" y="120" width="150" height="80" rx="8" fill="#1a1000" stroke="#ff9900" strokeWidth="2" />
                        <text x="95" y="148" fill="#ff9900" fontSize="12" textAnchor="middle" fontWeight="bold">Object Storage</text>
                        <text x="95" y="166" fill="#8888aa" fontSize="9" textAnchor="middle">S3 / GCS / ADLS</text>
                        <text x="95" y="182" fill="#555" fontSize="8" textAnchor="middle">Cheap + Scalable</text>

                        <line x1="170" y1="160" x2="216" y2="160" stroke="#ff9900" strokeWidth="1.5" markerEnd="url(#arrowLh)" />

                        {/* Table Format layer */}
                        <rect x="220" y="80" width="180" height="160" rx="10" fill="#001a14" stroke="#00ff88" strokeWidth="2" />
                        <text x="310" y="110" fill="#00ff88" fontSize="12" textAnchor="middle" fontWeight="bold">Table Format</text>
                        <rect x="236" y="122" width="148" height="28" rx="4" fill="#002a20" stroke="#00ff88" strokeWidth="1" />
                        <text x="310" y="141" fill="#00ff88" fontSize="10" textAnchor="middle">Delta Lake</text>
                        <rect x="236" y="158" width="148" height="28" rx="4" fill="#002a20" stroke="#00ff88" strokeWidth="1" />
                        <text x="310" y="177" fill="#00ff88" fontSize="10" textAnchor="middle">Apache Iceberg</text>
                        <rect x="236" y="194" width="148" height="28" rx="4" fill="#002a20" stroke="#00ff88" strokeWidth="1" />
                        <text x="310" y="213" fill="#00ff88" fontSize="10" textAnchor="middle">Apache Hudi</text>
                        <text x="310" y="236" fill="#555" fontSize="8" textAnchor="middle">ACID • Time Travel • Schema Evo</text>

                        <line x1="400" y1="160" x2="446" y2="160" stroke="#00ff88" strokeWidth="1.5" markerEnd="url(#arrowLh)" />

                        {/* Query Engines */}
                        <rect x="450" y="60" width="170" height="200" rx="10" fill="#14101a" stroke="#a855f7" strokeWidth="2" />
                        <text x="535" y="90" fill="#a855f7" fontSize="12" textAnchor="middle" fontWeight="bold">Query Engines</text>
                        <rect x="466" y="104" width="138" height="28" rx="4" fill="#1a1428" stroke="#a855f7" strokeWidth="1" />
                        <text x="535" y="123" fill="#a855f7" fontSize="10" textAnchor="middle">Spark SQL</text>
                        <rect x="466" y="140" width="138" height="28" rx="4" fill="#1a1428" stroke="#a855f7" strokeWidth="1" />
                        <text x="535" y="159" fill="#a855f7" fontSize="10" textAnchor="middle">Trino / Presto</text>
                        <rect x="466" y="176" width="138" height="28" rx="4" fill="#1a1428" stroke="#a855f7" strokeWidth="1" />
                        <text x="535" y="195" fill="#a855f7" fontSize="10" textAnchor="middle">Athena v3</text>
                        <rect x="466" y="212" width="138" height="28" rx="4" fill="#1a1428" stroke="#a855f7" strokeWidth="1" />
                        <text x="535" y="231" fill="#a855f7" fontSize="10" textAnchor="middle">Databricks SQL</text>

                        <line x1="620" y1="160" x2="666" y2="130" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrowLh)" />
                        <line x1="620" y1="200" x2="666" y2="220" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrowLh)" />

                        {/* Consumers */}
                        <rect x="670" y="80" width="130" height="60" rx="6" fill="#1a1a2e" stroke="#00d4ff" strokeWidth="1.5" />
                        <text x="735" y="107" fill="#00d4ff" fontSize="11" textAnchor="middle" fontWeight="bold">BI / Dashboards</text>
                        <text x="735" y="123" fill="#8888aa" fontSize="9" textAnchor="middle">Tableau / Looker</text>

                        <rect x="670" y="180" width="130" height="60" rx="6" fill="#1a1a2e" stroke="#00d4ff" strokeWidth="1.5" />
                        <text x="735" y="207" fill="#00d4ff" fontSize="11" textAnchor="middle" fontWeight="bold">ML / Data Sci</text>
                        <text x="735" y="223" fill="#8888aa" fontSize="9" textAnchor="middle">Notebooks / MLflow</text>

                        {/* vs labels */}
                        <text x="95" y="36" fill="#ff9900" fontSize="10" textAnchor="middle" fontWeight="bold">Data Lake ✓</text>
                        <text x="95" y="52" fill="#555" fontSize="9" textAnchor="middle">(cheap, flexible)</text>
                        <text x="535" y="36" fill="#a855f7" fontSize="10" textAnchor="middle" fontWeight="bold">Data Warehouse ✓</text>
                        <text x="535" y="52" fill="#555" fontSize="9" textAnchor="middle">(ACID, fast, governed)</text>

                        {/* ── Hover overlay rects ── */}
                        <rect x="20" y="120" width="150" height="80" rx="8" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('lh-storage')} onMouseLeave={clearBlock} />
                        <rect x="236" y="122" width="148" height="28" rx="4" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('lh-delta')} onMouseLeave={clearBlock} />
                        <rect x="236" y="158" width="148" height="28" rx="4" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('lh-iceberg')} onMouseLeave={clearBlock} />
                        <rect x="236" y="194" width="148" height="28" rx="4" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('lh-hudi')} onMouseLeave={clearBlock} />
                        <rect x="450" y="60" width="170" height="200" rx="10" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('lh-engines')} onMouseLeave={clearBlock} />
                        <rect x="670" y="80" width="130" height="60" rx="6" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('lh-bi')} onMouseLeave={clearBlock} />
                        <rect x="670" y="180" width="130" height="60" rx="6" fill="transparent" style={{cursor:'pointer'}} onMouseEnter={() => hoverBlock('lh-ml')} onMouseLeave={clearBlock} />
                      </svg>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span style={{color:'#ff9900'}} className="font-bold">Storage: </span><span className="text-muted">Cheap object storage (S3). Decoupled from compute.</span></div>
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span className="text-success font-bold">Table Format: </span><span className="text-muted">Adds DWH features (ACID, time travel) on top of files.</span></div>
                      <div className="p-2 bg-neutral-900 rounded text-xs"><span className="text-purple-400 font-bold">Multi-engine: </span><span className="text-muted">Same data, multiple engines. No data copying.</span></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

          </div>
        </motion.div>
      )}
    </PageContainer>

      {/* ── Floating block tooltip (fixed, clips nothing) ─────────────── */}
      {blockInfo && (
        <div
          style={{ position: 'fixed', left: tipPos.x + 18, top: tipPos.y - 140, zIndex: 9999, pointerEvents: 'none', maxWidth: 300 }}
          className="bg-[#12121a] border border-[#00d4ff44] rounded-xl p-4 shadow-2xl"
        >
          <p className="text-sm font-bold text-accent mb-1">{blockInfo.title}</p>
          <p className="text-xs text-foreground leading-relaxed mb-2">{blockInfo.desc}</p>
          <p className="text-xs text-success font-semibold mb-0.5">↳ Why it matters</p>
          <p className="text-xs text-muted leading-relaxed mb-2">{blockInfo.why}</p>
          <p className="text-xs text-yellow-400 italic">{blockInfo.tip}</p>
        </div>
      )}
    </>
  );
}
