# Analytics Section - System Design Notes
**Instructor-only post-contest metrics using on-demand watermark-based computation over PostgreSQL contest data**

---

## Table of Contents
1. [Overview](#1-overview)
2. [Current Product Scope](#2-current-product-scope)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Core Concepts](#5-core-concepts)
6. [Data Sources](#6-data-sources)
7. [Metric Definitions](#7-metric-definitions)
8. [Snapshot Resolution Strategy](#8-snapshot-resolution-strategy)
9. [Backend Query Flow](#9-backend-query-flow)
10. [API Design](#10-api-design)
11. [Frontend State](#11-frontend-state)
12. [Reliability / Limitations / Known Gaps](#12-reliability--limitations--known-gaps)
13. [Current Implementation Checklist](#13-current-implementation-checklist)

---

## 1) Overview

The analytics section is an **instructor-only post-contest metrics feature** centered around the `instructorAnalysis` backend flow.

In the current project, analytics provides:

- contest-level metrics by experiment group
- problem-level metrics by student
- logical snapshot windows at:
  - `+5 minutes` after contest end
  - `+15 minutes` after contest end
- a response model that exposes snapshot status, watermark, and computed rows

Important current behavior:

- the backend computes analytics **on demand** when the instructor requests them
- there is **no persisted snapshot table** for these metrics in the current implementation
- there is **no Redis/BullMQ scheduling layer** in the current implementation
- there is **no SSE-driven analytics refresh** in the current implementation
- the visible research analytics page still contains substantial mock/demo sections, even though the backend query path is real

---

## 2) Current Product Scope

### 2.1 What the backend actually supports

The real backend analytics flow supports:

- instructor-only access
- selecting a contest
- optionally selecting a problem
- choosing a snapshot preference:
  - `latest`
  - `preliminary`
  - `final`
- returning:
  - contest metadata
  - snapshot resolution metadata
  - contest-group metric rows
  - problem-student metric rows

### 2.2 What the metrics are for

Current analytics focuses on understanding:

- how different experiment groups performed overall
- how long students took to submit and solve
- whether hint-triggered sessions later solved
- how many attempts happened before and after hint use

### 2.3 What is not yet implemented as originally planned

The older design assumed:

- precomputed snapshot tables
- background jobs
- run-state persistence
- SSE-triggered UI refresh

Those pieces are **not** present in the current code path.

---

## 3) Tech Stack

### Backend

- PostgreSQL as the source of truth
- Prisma for loading contest, participation, session, and submission data
- tRPC router: `instructorAnalysis`
- pure TypeScript metric computation in `src/server/instructorAnalysis/*`

### Frontend

- React + Next.js App Router
- tRPC client query hooks for the real instructor analysis path
- formatting/mapping layer for rendering snapshot status and metric tables

### Current note

The current analytics backend is **DB read + in-memory compute**, not a separate analytics pipeline.

---

## 4) System Architecture

- **Instructor analysis request**
  - instructor selects contest/problem/snapshot preference
- **tRPC router**
  - validates role and input
- **Repository layer**
  - loads instructor-owned contests
  - resolves the requested logical snapshot window
  - loads raw contest data needed for metrics
- **Metrics engine**
  - computes contest-group and problem-student rows using a watermark
- **Serializer**
  - shapes the backend result into frontend-friendly filters, selection, contest, snapshot, and row payloads
- **Frontend mapping**
  - converts raw numeric metrics into display strings

---

## 5) Core Concepts

### 5.1 Logical snapshot

In the current project, a "snapshot" is **not** a stored database record.

It is a logical view of the data defined by:

- snapshot type
- watermark time
- computation time

The rows are recomputed from live database records each time the analysis query runs.

### 5.2 Watermark

The watermark is the cutoff timestamp used during metric computation.

Only data at or before that timestamp is included in the snapshot result.

Current watermarks:

- `PRELIMINARY_5M`: `contest.endsAt + 5 minutes`
- `FINAL_15M`: `contest.endsAt + 15 minutes`

### 5.3 Snapshot preference

The backend accepts:

- `latest`
- `preliminary`
- `final`

Resolution behavior:

- `preliminary` resolves to the +5m watermark once available
- `final` resolves to the +15m watermark once available
- `latest` prefers final, then preliminary, otherwise returns not-ready

### 5.4 Snapshot status

The shared type allows these statuses:

- `QUEUED`
- `RUNNING`
- `DONE`
- `FAILED`
- `NOT_READY`

Current repository behavior only produces:

- `DONE`
- `FAILED`
- `NOT_READY`

`QUEUED` and `RUNNING` exist in shared types and UI labels, but the current backend does not maintain an async run queue.

---

## 6) Data Sources

The backend analytics query reads the following contest-related data.

### 6.1 `Contest`

Used for:

- instructor ownership filtering
- contest selection
- schedule metadata
- problem list

Relevant fields:

- `id`
- `name`
- `status`
- `startsAt`
- `endsAt`

### 6.2 `ContestProblem`

Used for:

- determining which problems belong to the contest
- keeping problem ordering stable

### 6.3 `Participation`

Used for:

- identifying contestant users
- reading experiment group assignment
- resolving student names

Relevant fields:

- `userId`
- `role`
- `experimentGroup`

### 6.4 `ContestProblemSession`

Used for timing and hint metrics.

Relevant fields:

- `userId`
- `problemId`
- `startedAt`
- `firstSubmitAt`
- `hintTriggeredAt`
- `solvedAt`
- `solved`

Important current note:

- the analytics computation depends heavily on this table
- I did not find the current main contest student request path writing these session rows
- because of that, timing and hint-driven analytics may be sparse or incomplete until the upstream session-writing flow is connected

### 6.5 `Submission`

Used for attempt counts and first-submission fallback timing.

Relevant fields:

- `userId`
- `problemId`
- `createdAt`

Current note:

- submissions are filtered by watermark before metric aggregation
- submission records are currently a stronger source than `ContestProblemSession` for counting attempts

### 6.6 `ContestExperimentGroup`

Used to collect the set of experiment groups associated with a contest.

Current note:

- group rows can be built from explicit contest experiment groups and/or participation assignments

---

## 7) Metric Definitions

The current analytics backend computes two families of metrics.

### 7.1 Contest-group metrics

Output shape:

- `groupName`
- `solveRate`
- `meanSolveTimeSec`
- `medianSolveTimeSec`
- `attemptsToSolveMean`

Interpretation:

- **solve rate**
  - solved problem slots divided by total expected problem slots in the group
- **mean solve time**
  - average seconds from `session.startedAt` to `solvedAt`
- **median solve time**
  - median of solved-session durations
- **attempts to solve mean**
  - average number of submissions made up to `solvedAt`

### 7.2 Problem-student metrics

Output shape:

- `studentId`
- `studentName`
- `groupName`
- `timeToFirstSubmissionSec`
- `timeToFirstCorrectSec`
- `postHintSolveProbability`
- `attemptsBeforeHint`
- `attemptsAfterHint`
- `timeToSolveAfterHintSec`

Interpretation:

- **time to first submission**
  - seconds from session start to first submission
  - falls back to the earliest submission if `firstSubmitAt` is missing
- **time to first correct**
  - seconds from session start to `solvedAt`
- **post-hint solve probability**
  - `100` if a hint was triggered and the problem was solved by watermark, otherwise `0`
  - `null` when no hint was triggered
- **attempts before hint**
  - submission count up to `hintTriggeredAt`
- **attempts after hint**
  - submission count after `hintTriggeredAt`
- **time to solve after hint**
  - seconds from `hintTriggeredAt` to `solvedAt`

---

## 8) Snapshot Resolution Strategy

The repository resolves the requested snapshot window from the contest end time.

### 8.1 No end time

If a contest has no `endsAt`, the backend returns:

- no resolved snapshot type
- no computed rows
- a message explaining that snapshot scheduling starts once the contest has an end time

### 8.2 Preliminary snapshot

Available only when:

- `now >= endsAt + 5 minutes`

Before that point, the backend returns:

- `status = NOT_READY`
- no computed rows
- watermark pointing at the future preliminary window

### 8.3 Final snapshot

Available only when:

- `now >= endsAt + 15 minutes`

Before that point, the backend returns:

- `status = NOT_READY`
- no computed rows
- watermark pointing at the future final window

### 8.4 Latest snapshot

Resolution order:

1. `FINAL_15M` if available
2. `PRELIMINARY_5M` if available
3. otherwise `NOT_READY`

---

## 9) Backend Query Flow

Current backend flow for `instructorAnalysis.get`:

1. Verify the caller is an authenticated instructor.
2. Load the instructor record by `computingId`.
3. Load contests owned by that instructor.
4. Choose the selected contest or default to the first contest.
5. Choose the selected problem or default to the first contest problem.
6. Resolve the requested snapshot window from `endsAt`.
7. If the snapshot window is not ready:
   return metadata with `NOT_READY`.
8. If the snapshot window is ready:
   load raw contest data needed for analytics.
9. Compute metrics in memory using the resolved watermark.
10. Serialize the result for the frontend.

Important current detail:

- `computedAt` is simply the current request time when computation succeeds
- there is no persisted record of a prior analytics run

---

## 10) API Design

### 10.1 Current backend entry point

The real analytics API is a protected tRPC procedure:

- `instructorAnalysis.get`

Input:

- `contestId?: string`
- `problemId?: string`
- `snapshotPreference: "latest" | "preliminary" | "final"`

Authorization:

- requires authenticated user
- current router explicitly requires `ctx.user.role === "instructor"`

### 10.2 Response shape

The backend returns:

- `filters`
  - contest options
  - problem options
  - snapshot preference options
- `selection`
  - currently selected contest/problem/preference
- `contest`
  - metadata for the selected contest
- `snapshot`
  - requested preference
  - resolved type
  - status
  - watermark
  - computedAt
  - human-readable message
- `contestGroupMetrics.rows`
- `problemStudentMetrics.rows`

### 10.3 Missing planned APIs

The older design referenced REST endpoints like `/i/matrices/*` and an SSE stream.

Those are **not** part of the current implementation.

---

## 11) Frontend State

### 11.1 Real frontend analysis path

The repo includes a real frontend data flow for instructor analysis:

- `useInstructorAnalysis`
- `instructorAnalysis.get.useQuery(...)`
- response mapping in `instructorAnalysis.mapper.ts`
- components for:
  - snapshot status
  - contest-group metrics table
  - problem-student metrics table

This real frontend path uses:

- tRPC
- formatted display strings
- `staleTime = 30_000ms`

### 11.2 Current research analytics page

The visible research analytics page under `/instructor/research-analytics` is currently mixed.

What is real:

- the backend instructor analysis stack exists
- reusable components/types for real snapshot-backed metrics exist

What is still mock/demo-driven:

- `LiveInstructorAnalyticsCard`
- contest/group/student comparison sections
- trend charts and export content driven from local mock datasets

So the current page is better described as:

- a partially integrated analytics UI
- with a real backend metrics subsystem available in the codebase

### 11.3 Refresh behavior

Current refresh behavior is query-based, not event-based:

- no SSE analytics stream
- no automatic server push
- no active polling loop in the real analysis hook
- manual or normal React Query refetch behavior only

---

## 12) Reliability / Limitations / Known Gaps

- analytics is computed fresh per request, so repeated reads re-run the aggregation work
- there is no snapshot persistence table for reuse or audit history
- `QUEUED` and `RUNNING` statuses are defined but not exercised by the current repository flow
- no Redis/BullMQ job scheduling exists for analytics
- no SSE event exists for "snapshot ready"
- many timing and hint metrics depend on `ContestProblemSession`, but I did not find that table being written by the current main contest student flow
- because of that, solve-time and hint-based metrics may be incomplete or empty even when submission data exists
- the visible research analytics page still leans heavily on mock datasets, so the user-facing screen does not yet fully represent the real backend analytics subsystem

---

## 13) Current Implementation Checklist

### Backend analytics

- [x] Instructor-only analytics tRPC router exists
- [x] Contest selection and problem selection are supported
- [x] Snapshot preferences `latest`, `preliminary`, and `final` are supported
- [x] Watermark-based filtering is implemented
- [x] Contest-group metrics are computed on demand
- [x] Problem-student metrics are computed on demand
- [x] Snapshot metadata includes status, watermark, computed time, and message

### Not implemented from the older design

- [ ] Persisted snapshot tables
- [ ] Metrics run tracking table
- [ ] Redis/BullMQ delayed compute jobs
- [ ] SSE analytics refresh stream
- [ ] Fully wired production UI based entirely on real instructor analysis data

### Data-quality caveat

- [ ] Main contest flow populates `ContestProblemSession` consistently enough for all timing/hint metrics to be reliable
