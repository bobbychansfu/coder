# Analytics Section - System Design Notes
**Instructor-only research analytics using live database aggregation plus on-demand watermark snapshots**

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

The analytics section is an **instructor-only research metrics feature** centered around the `instructorAnalysis` backend flow.

In the current project, analytics provides:

- contest-level metrics by experiment group
- problem-level metrics by experiment group and student
- contest, group, and student comparisons
- gamification and AI-hint trend views derived from the analytics response
- CSV, JSON, and browser-print/PDF export
- logical snapshot windows at:
  - `+5 minutes` after contest end
  - `+15 minutes` after contest end
- a response model that exposes snapshot status, watermark, and computed rows

Important current behavior:

- the visible page loads current analytics through `instructorAnalysis.dashboard`
- the separate `instructorAnalysis.get` API computes watermark snapshots **on demand**
- there is **no persisted snapshot table** for these metrics in the current implementation
- there is **no Redis/BullMQ scheduling layer** in the current implementation
- there is **no SSE-driven analytics refresh** in the current implementation
- the visible research analytics page is database-backed; mock analytics remain as reusable fallback/test data but are not the page's active source

---

## 2) Current Product Scope

### 2.1 What the backend actually supports

The current backend exposes two instructor-only query paths.

`instructorAnalysis.dashboard` supports:

- loading all contests owned by the instructor
- current metrics for all contestants and Groups A, B, and C
- per-student metric bundles
- contest and student catalogs used by filters and comparisons
- contest AI-hint configuration notes

`instructorAnalysis.get` supports:

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
- comparisons across contests, experiment groups, and individual students

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
- `instructorAnalysis.dashboard.useQuery(...)` for the visible research analytics page
- client-side helpers for filtering, comparisons, trend construction, and export
- a separate reusable query/mapping layer for the logical snapshot API

### Current note

The current analytics backend is **DB read + in-memory compute**, not a separate analytics pipeline.
The dashboard and snapshot endpoints use different response shapes and aggregation windows.

---

## 4) System Architecture

### 4.1 Visible research analytics dashboard

- **Page query**
  - `/instructor/research-analytics` calls `instructorAnalysis.dashboard`
- **tRPC router**
  - requires an authenticated instructor
- **Dashboard repository**
  - loads all instructor-owned contests and their problems, participants, sessions, and submissions
  - computes all-cohort, Group A/B/C, and per-student metric bundles
- **Frontend helpers**
  - filter live tables by contest and group
  - build contest/group/student comparisons
  - derive gamification and AI-hint trend datasets
  - build CSV, JSON, and printable PDF exports

### 4.2 Logical snapshot query

- **Instructor analysis request**
  - instructor selects contest/problem/snapshot preference
- **Repository layer**
  - loads instructor-owned contests
  - resolves the requested logical snapshot window
  - loads raw contest data needed for metrics
- **Metrics engine**
  - computes contest-group and problem-student rows using a watermark
- **Serializer**
  - shapes the result into filters, selection, contest, snapshot, and row payloads

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

The current analytics backend computes two families of metrics. The snapshot response expresses time
values in seconds; the dashboard response converts equivalent aggregates to minutes for display.

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

### 9.1 Dashboard flow

Current backend flow for `instructorAnalysis.dashboard`:

1. Verify the caller is an authenticated instructor.
2. Load the instructor by `computingId`.
3. Load all contests owned by that instructor, including problems, contestant participations,
   experiment-group configuration, problem sessions, and submissions.
4. Build current metric bundles for:
   - all contestants
   - Group A
   - Group B
   - Group C
   - each individual student
5. Build contest and student catalogs for frontend filters.
6. Return the dashboard payload directly to the research analytics page.

The dashboard flow does not resolve a +5m/+15m watermark. It represents the records currently
available in the database.

### 9.2 Snapshot flow

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

The visible research analytics page uses this protected tRPC procedure:

- `instructorAnalysis.dashboard`

Input:

- none

Response:

- `segmented_metrics`
  - `all`
  - `groupA`
  - `groupB`
  - `groupC`
- `student_views`
- `students_catalog`
- `contests_catalog`
- `analytics_notes`

The logical snapshot API is a second protected tRPC procedure:

- `instructorAnalysis.get`

Input:

- `contestId?: string`
- `problemId?: string`
- `snapshotPreference: "latest" | "preliminary" | "final"`

Authorization:

- requires authenticated user
- current router explicitly requires `ctx.user.role === "instructor"`

### 10.2 Snapshot response shape

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

The visible `/instructor/research-analytics` page now uses a real database-backed flow:

- `instructorAnalysis.dashboard.useQuery(...)`
- `staleTime = 30_000ms`
- an empty payload while no query data is available
- `LiveInstructorAnalyticsCard` for current contest/problem metrics
- comparison helpers for contests, groups, and students
- trend builders for gamification and AI-hint statistics
- export helpers for CSV, JSON, and browser-print/PDF output

The separate snapshot stack still exists through:

- `useInstructorAnalysis`
- `instructorAnalysis.get.useQuery(...)`
- response mapping in `instructorAnalysis.mapper.ts`
- reusable snapshot-status and metric-table components

This real frontend path uses:

- tRPC
- formatted display strings
- `staleTime = 30_000ms`

### 11.2 Mock data status

`MOCK_INSTRUCTOR_ANALYTICS` and its builder files still exist for component defaults, fixtures, and
isolated development. `ResearchAnalyticsPage` passes the dashboard query result into its components,
so those mock values are not the normal data source for the visible page.

### 11.3 Refresh behavior

Current refresh behavior is query-based, not event-based:

- no SSE analytics stream
- no automatic server push
- no active polling loop in the real analysis hook
- the Metrics Table Refresh button calls the dashboard query's `refetch`
- normal React Query refetch behavior also applies

---

## 12) Reliability / Limitations / Known Gaps

- analytics is computed fresh per request, so repeated reads re-run the aggregation work
- there is no snapshot persistence table for reuse or audit history
- `QUEUED` and `RUNNING` statuses are defined but not exercised by the current repository flow
- no Redis/BullMQ job scheduling exists for analytics
- no SSE event exists for "snapshot ready"
- many timing and hint metrics depend on `ContestProblemSession`, but I did not find that table being written by the current main contest student flow
- because of that, solve-time and hint-based metrics may be incomplete or empty even when submission data exists
- the dashboard query loads all instructor-owned contests and computes all segments and student views in one request, so its cost grows with contest, session, submission, and participant volume
- the visible page currently substitutes an empty payload while data is unavailable; dedicated loading and query-error presentation is limited
- the dashboard is a current-data view, while `instructorAnalysis.get` is the watermark snapshot view; consumers must not assume the two responses use the same cutoff or shape

---

## 13) Current Implementation Checklist

### Backend analytics

- [x] Database-backed analytics dashboard tRPC query exists
- [x] All-cohort, Group A/B/C, and per-student metric bundles are computed
- [x] Instructor-only analytics tRPC router exists
- [x] Contest selection and problem selection are supported
- [x] Snapshot preferences `latest`, `preliminary`, and `final` are supported
- [x] Watermark-based filtering is implemented
- [x] Contest-group metrics are computed on demand
- [x] Problem-student metrics are computed on demand
- [x] Snapshot metadata includes status, watermark, computed time, and message

### Frontend analytics

- [x] Research analytics page uses `instructorAnalysis.dashboard`
- [x] Current metrics can be filtered by contest and cohort
- [x] Contest, group, and student comparisons use backend data
- [x] Gamification and AI-hint trends are derived from backend data
- [x] Manual query refresh is available
- [x] CSV, JSON, and browser-print/PDF export is available

### Not implemented from the older design

- [ ] Persisted snapshot tables
- [ ] Metrics run tracking table
- [ ] Redis/BullMQ delayed compute jobs
- [ ] SSE analytics refresh stream
- [ ] Persisted or scheduled historical trend snapshots
- [ ] Dedicated dashboard loading and query-error states

### Data-quality caveat

- [ ] Main contest flow populates `ContestProblemSession` consistently enough for all timing/hint metrics to be reliable
