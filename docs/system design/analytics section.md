# 📊 Matrices Dashboard (Instructor) — System Design Note
Near real-time instructor analytics using **PostgreSQL snapshots** + **Redis/BullMQ jobs** + **SSE-triggered UI refresh**.


### author:Dean zhou
### date: 2026.03.03
---


## Table of Contents
- [1. Overview](#1-overview)
- [2. Goals](#2-goals)
- [3. Tech Stack](#3-tech-stack)
- [4. Key Concepts](#4-key-concepts)
- [5. Why this stack?](#5-why-this-stack)
- [6. Snapshot Strategy (5m / 15m)](#6-snapshot-strategy-5m--15m)
- [7. Data Model (Schema)](#7-data-model-schema)
- [8. APIs](#8-apis)
- [9. Redis + BullMQ Job Scheduling](#9-redis--bullmq-job-scheduling)
- [10. SSE + Frontend Refresh](#10-sse--frontend-refresh)
- [11. Checklist](#11-checklist)

---

## 1. Overview
The **Matrices Dashboard** is an instructor-facing analytics page that shows post-contest metrics:
- **Contest view (per GROUP)**: solve rate, mean/median solve time, attempts to solve
- **Problem view (per STUDENT)**: time-to-first-submission/correct, hint-related metrics

This design intentionally **does NOT compute metrics on the fly**. Instead, it creates consistent **snapshot tables** in PostgreSQL at fixed times after contest ends, then updates the UI automatically.

---

## 2. Goals
### Functional
- **Real-time AI hints** (student clicks hint → immediate response; store exact click time)
- **Asynchronous judging** (no need for real-time score/rank during contest)
- **Matrices snapshots**:
  - **+5 minutes** after contest end → **Preliminary snapshot**
  - **+15 minutes** after contest end → **Final snapshot**
- **Near real-time UI update** for instructors (no manual refresh)

### Non-functional
- Snapshot internal **consistency**
- Background computation (avoid blocking API)
- Retries & observability for metric runs

---

## 3. Tech Stack
### Frontend
- **Next.js App Router + TypeScript**
- Server-state management: **TanStack Query (React Query)** (or SWR)
- “Near real-time” UI updates: **SSE (Server-Sent Events)** + refetch on event

### Backend
- **PostgreSQL**: raw events + snapshot tables
- **Redis + BullMQ**: delayed background jobs (+5m/+15m recompute)
- API layer (Node/Next backend): instructor endpoints `/i/matrices/*`

---

## 4. Key Concepts

### What is Redis?
**Redis** is a high-performance in-memory key-value store. In this design it is mainly used as:
- **Queue storage** for scheduled jobs (and job state)
- Optional: distributed locking / caching

### What is BullMQ?
**BullMQ** is a popular Node.js/TypeScript job queue library built on Redis. It provides:
- `queue.add()` to enqueue jobs
- **Delay jobs** (e.g., run at `endsAt + 5 minutes`)
- Workers to process jobs asynchronously
- Retries, backoff, concurrency control, and job status tracking

### What is “consistency” (for metrics)?
Consistency means **a snapshot is internally coherent**: every metric column is computed using the same time window.
We enforce this with a **watermark** (cutoff time). No column mixes “new” data with “old” data.

### What is “near real-time update” here?
Not millisecond-level live updates. Instead:
- backend produces snapshots at scheduled times,
- UI updates **immediately after the snapshot is ready** via SSE-triggered refetch.

### What is “data fetching”?
The UI loads snapshot rows via GET APIs (read-only) and renders tables.
React Query caches results and makes event-driven refetch easy.

---

## 5. Why this stack?

### Why PostgreSQL snapshots (not on-the-fly)?
- Metrics are aggregation-heavy (`GROUP BY`, min/max/avg/median)
- Computing per request can be slow and inconsistent
- Snapshot tables make reads fast and stable (perfect for dashboards)

### Why Redis + BullMQ?
- We need **delayed execution**: `endsAt + 5m` and `endsAt + 15m`
- We want background compute (no blocking API requests)
- We need retries and status tracking for reliability

### Why SSE (instead of constant polling)?
- Low update frequency (only when snapshots complete)
- SSE lets the server signal “snapshot ready” → UI refetch immediately
- Reduces wasted requests and improves UX

### What is SWR? Why not SWR (here)?
**SWR** (Vercel) implements *Stale-While-Revalidate*: show cached data quickly, then revalidate in background.

SWR can work, but **React Query is preferred** here because:
- Multiple queries & keys (contest table + problem table + filters)
- Precise invalidation/refetch on SSE events
- Richer caching + refetch policies + devtools
- Dashboard likely grows (filters, sorting, pagination, drill-down)

> Summary: SWR is great for simple read-only fetching; React Query is more ergonomic for complex dashboards + event-driven refresh.

---

## 6. Snapshot Strategy (5m / 15m)

### Snapshot types
- **PRELIMINARY_5M**: computed at `endsAt + 5 minutes`
- **FINAL_15M**: computed at `endsAt + 15 minutes`

### Watermark (cutoff)
Each snapshot uses a watermark:
- `watermark_5m = endsAt + 5m`
- `watermark_15m = endsAt + 15m`

Aggregation includes only:
- `submissions.judged_at <= watermark`
- `hint_events.hint_requested_at <= watermark`

This guarantees snapshot-level consistency even when judging results arrive slightly late.

---

## 7. Data Model (Schema)

### Raw event tables

#### `submissions`
Stores submissions and judging outcomes (async).
- `id` (pk)
- `contest_id`
- `problem_id`
- `student_id`
- `group_id`
- `submitted_at` (timestamptz)
- `status` (`PENDING|DONE`)
- `verdict` (nullable)
- `judged_at` (nullable timestamptz)

Recommended indexes:
- `(contest_id, group_id, judged_at)`
- `(contest_id, problem_id, student_id, judged_at)`
- `(contest_id, student_id, submitted_at)`

#### `hint_events`
Stores exact hint click time (server authoritative).
- `id` (pk)
- `contest_id`
- `problem_id`
- `student_id`
- `group_id`
- `hint_requested_at` (timestamptz) ✅ exact click time
- `hint_delivered_at` (nullable)

Recommended indexes:
- `(contest_id, problem_id, student_id, hint_requested_at)`
- `(contest_id, student_id)`

---

### Snapshot tables (UI reads these only)

#### `contest_group_metrics`
Contest-level metrics per group  
PK: `(contest_id, group_id, snapshot_type)`
- `contest_id`
- `group_id`
- `snapshot_type` (`PRELIMINARY_5M|FINAL_15M`)
- `watermark` (timestamptz)
- `computed_at` (timestamptz)
- `solve_rate` (float)
- `mean_solve_time_sec` (int)
- `median_solve_time_sec` (int)
- `attempts_to_solve_mean` (float)

#### `problem_student_metrics`
Problem-level metrics per student  
PK: `(contest_id, problem_id, student_id, snapshot_type)`
- `contest_id`
- `problem_id`
- `student_id`
- `snapshot_type`
- `watermark`
- `computed_at`
- `time_to_first_submission_sec` (int)
- `time_to_first_correct_sec` (int)
- `post_hint_solve_probability` (float, nullable)
- `attempts_before_hint` (int, nullable)
- `attempts_after_hint` (int, nullable)
- `time_to_solve_after_hint_sec` (int, nullable)

#### `metrics_runs`
Tracks snapshot computation state for reliability/observability  
PK: `(contest_id, snapshot_type)`
- `contest_id`
- `snapshot_type`
- `watermark`
- `status` (`QUEUED|RUNNING|DONE|FAILED`)
- `started_at`
- `finished_at`
- `error` (nullable text)

---

## 8. APIs
### Snapshot read APIs (Instructor)
- `GET /i/matrices/contest?contestId=...&snapshot=latest`
  - returns `{ snapshotType, lastComputedAt, rows: [...] }` (per group)
- `GET /i/matrices/problem?contestId=...&problemId=...&snapshot=latest`
  - returns `{ snapshotType, lastComputedAt, rows: [...] }` (per student)

`latest` selection rule:
- If FINAL exists → return FINAL
- Else if PRELIMINARY exists → return PRELIMINARY
- Else → return empty + status

---

## 9. Redis + BullMQ Job Scheduling

### Enqueue jobs when contest ends
```ts
import { Queue } from "bullmq";

const metricsQueue = new Queue("metrics", {
  connection: { host: "localhost", port: 6379 } // Redis
});

type SnapshotType = "PRELIMINARY_5M" | "FINAL_15M";

export async function scheduleMetricsJobs(contestId: string, endsAt: Date) {
  // +5 minutes (Preliminary)
  await metricsQueue.add(
    "recompute_metrics",
    {
      contestId,
      snapshotType: "PRELIMINARY_5M" as SnapshotType,
      watermark: new Date(endsAt.getTime() + 5 * 60 * 1000).toISOString()
    },
    { delay: 5 * 60 * 1000, attempts: 3, backoff: { type: "exponential", delay: 2000 } }
  );

  // +15 minutes (Final)
  await metricsQueue.add(
    "recompute_metrics",
    {
      contestId,
      snapshotType: "FINAL_15M" as SnapshotType,
      watermark: new Date(endsAt.getTime() + 15 * 60 * 1000).toISOString()
    },
    { delay: 15 * 60 * 1000, attempts: 3, backoff: { type: "exponential", delay: 2000 } }
  );
}
```

### Worker (recompute + upsert snapshots + notify SSE)
```ts
import { Worker } from "bullmq";

export const metricsWorker = new Worker(
  "metrics",
  async (job) => {
    const { contestId, snapshotType, watermark } = job.data;

    // 1) mark metrics_runs as RUNNING
    // 2) run Postgres aggregations using the same watermark
    // 3) upsert into contest_group_metrics + problem_student_metrics
    // 4) mark metrics_runs as DONE
    // 5) publish SSE event: snapshot_ready(contestId, snapshotType)

    return { ok: true };
  },
  { connection: { host: "localhost", port: 6379 } }
);
```

---

## 10. SSE + Frontend Refresh

### SSE event

When a snapshot is ready, the server emits:
```json
{ "type": "snapshot_ready", "contestId": "c1", "snapshotType": "FINAL_15M" }
```

### Frontend behavior (React Query)
- Fetch `snapshot=latest` on mount.
- Subscribe to SSE: `/i/matrices/stream?contestId=...`.
- On `snapshot_ready`, call:
  - `queryClient.invalidateQueries({ queryKey: ["matrices", contestId] })`
- Refetch and render newest snapshot (Final preferred).

Optional fallback: if SSE disconnects, poll every 60s for up to 20 minutes after contest end.

---

## 11. Checklist
- Contest ended triggers BullMQ jobs (+5m, +15m).
- Worker computes snapshots using watermark filtering.
- Snapshots are written via idempotent upsert.
- `metrics_runs` records `RUNNING`/`DONE`/`FAILED` states.
- SSE emits `snapshot_ready` when a snapshot is ready.
- UI refetches automatically and shows `snapshotType` + `lastComputedAt`.
