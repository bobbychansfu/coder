# 🏁 Contest App (LeetCode-style) — MVP System Design Notes  
**Flexible open window + Per-student timer + Hint guardrails + Async judging + Delayed scoreboard + Clarifications + Matrices Dashboard (SSE auto refresh)**

---

## Table of Contents
1. [Overview](#1-overview)  
2. [UI & Product Behavior (Dashboard + Contest Detail)](#2-ui--product-behavior-dashboard--contest-detail)  
3. [Core Rules (MVP)](#3-core-rules-mvp)  
4. [Tech Stack](#4-tech-stack)  
5. [Concepts (Redis / BullMQ / Watermark / SSE)](#5-concepts-redis--bullmq--watermark--sse)  
6. [System Architecture](#6-system-architecture)  
7. [Data Model (Minimal Schema)](#7-data-model-minimal-schema)  
8. [RBAC & API Boundary](#8-rbac--api-boundary)  
9. [Attempt State Machine](#9-attempt-state-machine)  
10. [API Design](#10-api-design)  
11. [Contest Timer Lockdown (Frontend + Backend)](#11-contest-timer-lockdown-frontend--backend)  
12. [Session Keepalive & Eligibility (Two-stage Grace)](#12-session-keepalive--eligibility-two-stage-grace)  
13. [Judging (Async) — MVP Safety Guardrails](#13-judging-async--mvp-safety-guardrails)  
14. [Scoreboard (Delayed Publish) + Ranking Rule](#14-scoreboard-delayed-publish--ranking-rule)  
15. [Clarifications (MVP1: Instructor/TA Announcements)](#15-clarifications-mvp1-instructorta-announcements)  
16. [Practice Mode (No Timer, No Judging)](#16-practice-mode-no-timer-no-judging)  
17. [Matrices Dashboard (Instructor)](#17-matrices-dashboard-instructor)  
18. [Reliability / Consistency / Scalability](#18-reliability--consistency--scalability)  
19. [MVP Checklist](#19-mvp-checklist)

---

## 1) Overview
This system provides a **LeetCode-style contest experience**:

- **Flexible open window**: `openAt → closeAt` (e.g., 48 hours)
- **Per-student attempt timer**: starts when a student clicks **Join** (e.g., 30 minutes)
- **Run unlimited** (public testcases only)
- **Submit once per problem** (final submission → async judging)
- **AI Hint guardrails**:
  - unlocked **1 minute** after opening a problem
  - **1 minute cooldown** between hints
  - optional max hints per problem (MVP recommended: `1` or `3`)
- **Eligibility policy**: leaving/disconnect is allowed, but can **forfeit** after grace windows
- **Scoreboard**: visible after contest ends (supports **delayed publish**, e.g., +1 hour)
- **Clarifications**: instructor can post announcements/clarifications per contest
- **Matrices Dashboard (Instructor)**: included below (high-level) with a link to the full analytics spec

---

## 2) UI & Product Behavior (Dashboard + Contest Detail)

### 2.1 Dashboard
Contests are grouped by status:
- **In Progress (orange highlight)**  
  - contest is currently active/open
  - students can **Join Now** immediately
- **Upcoming**  
  - contest not opened yet
  - students can view metadata (time/duration/problems)
  - optional “starting soon” notification via SSE
- **Closed / Ended**  
  - contest ended
  - scoreboard may be visible (depending on publish time)

### 2.2 Contest Detail Page
Tabs:
- **Problems**
- **Scoreboard**
- **Clarifications**

Scoreboard visibility (MVP):
- Only for ended contests
- May be hidden until `scoreboard_publish_at` (e.g., closeAt + 1 hour)

Clarifications:
- Instructor/TA posts announcements
- Students view read-only feed

---

## 3) Core Rules (MVP)

### 3.1 Flexible Window + Per-student Timer
- Students can join only when `openAt ≤ now ≤ closeAt`
- On Join, system creates/returns an attempt:
  - `attemptStartAt = serverNow`
  - `attemptEndAt = attemptStartAt + durationSec` (e.g., 1800s)

### 3.2 Run / Hint / Submit
- **Run**: unlimited, public testcases only, does not affect scoreboard
- **Submit**: only **once per problem per attempt**
- **Hint**:
  - `now ≥ problemOpenedAt + 60s`
  - cooldown: `now ≥ lastHintAt + 60s`
  - optional cap: `hintCount < maxHints`

### 3.3 Time’s Up
When `now > attemptEndAt`:
- UI shows modal “Time’s up”
- Submit/Hint disabled
- user is redirected out of contest pages
- backend rejects late submit/hint requests

---

## 4) Tech Stack

### Frontend
- Next.js App Router + TypeScript
- React Query (TanStack Query) for server-state caching + invalidation
- SSE (Server-Sent Events) to push “refresh now” signals

### Backend
- PostgreSQL (source of truth)
- Redis + BullMQ (async jobs, delayed jobs)
- API boundary:
  - `/s/*` Student APIs
  - `/i/*` Instructor/TA/Admin APIs
  - `/m/*` Internal-only APIs (worker writeback)

---

## 5) Concepts (Redis / BullMQ / Watermark / SSE)

### Redis
In-memory key-value store. Used primarily as BullMQ’s queue backend (and optional locks).

### BullMQ
A popular Node.js/TS job queue built on Redis:
- delayed jobs (perfect for closeAt+5m/+15m/+1h)
- retries/backoff
- worker concurrency + monitoring

### Watermark (Snapshot Consistency)
A snapshot uses a single cutoff timestamp `watermark`. All metrics in that snapshot include only events `<= watermark`, so the snapshot is internally consistent.

### SSE
Server → browser push channel (one-way). Used for:
- “contest starting soon” notification (students)
- “snapshot ready” notification (instructors)
Then frontend refetches data immediately.

---

## 6) System Architecture
- **Web App** (Next.js)
- **Postgres**: attempts, per-problem state, submissions, hint events, clarifications, snapshots
- **Redis/BullMQ**:
  - `judgeQueue`: async judging jobs
  - `metricsQueue`: delayed snapshot jobs (+5m/+15m)
  - `scoreboardQueue` (optional): delayed publish (+1h)
- **SSE Streams**:
  - Student: `/s/notifications/stream`
  - Instructor: `/i/matrices/stream?contestId=...`

---

## 7) Data Model (Minimal Schema)

### 7.1 contests
`contests`
- `id`
- `title`
- `open_at`, `close_at`
- `duration_sec`
- `status` (`UPCOMING|OPEN|CLOSED`)
- `scoreboard_publish_at` (nullable)

### 7.2 problems
`problems`
- `id`, `title`, `difficulty`
- `statement_md`
- `public_testcases_json` (Run only)
- `private_testcases_ref` (Submit judging only, secret)

`contest_problems`
- `contest_id`, `problem_id`, `order_index`

### 7.3 per-student attempt
`contest_attempts`
- `id`
- `contest_id`
- `student_id`
- `started_at`, `ends_at`
- `state` (`ACTIVE|OFFLINE|FORFEITED|ENDED`)
- `last_seen_at`

**Unique**: `(contest_id, student_id)` (one attempt per student)

### 7.4 per-problem state (rate limits + one-submit)
`problem_attempt_state`
- `attempt_id`, `problem_id` (PK)
- `started_at` (first open time)
- `run_count`
- `submitted_at`, `submission_id`
- `hint_count`, `last_hint_at`

### 7.5 submissions
`submissions`
- `id`
- `attempt_id`, `contest_id`, `problem_id`, `student_id`
- `code`, `language`
- `submitted_at`
- `status` (`PENDING|DONE|SYSTEM_ERROR`)
- `verdict`, `judged_at`

**Hard guard**: `UNIQUE(attempt_id, problem_id)` (one submit per problem)

### 7.6 hint_events
`hint_events`
- `id`
- `attempt_id`, `contest_id`, `problem_id`, `student_id`
- `hint_requested_at` (server time)
- `hint_delivered_at`
- `hint_text`

### 7.7 clarifications (MVP1: announcements only)
`clarifications`
- `id`
- `contest_id`
- `author_user_id` (instructor/TA)
- `type` (`ANNOUNCEMENT`) *(MVP1)*
- `content`
- `created_at`
- `visibility` (`PUBLIC`) *(MVP1)*

### 7.8 matrices snapshots
`matrices_snapshots`
- `contest_id`
- `snapshot_type` (`PRELIMINARY_5M|FINAL_15M`)
- `computed_at`
- `watermark_at`
- `metrics_data_jsonb`

**Unique**: `(contest_id, snapshot_type)`

### 7.9 scoreboard snapshots
`scoreboard_snapshots`
- `contest_id`
- `published_at`
- `data_jsonb`
- `status` (`HIDDEN|PUBLISHED`)

---

## 8) RBAC & API Boundary (Minimal)
Goal: avoid “front-end hides button but backend still callable”.

- `/s/*` Student APIs: requires logged-in user
- `/i/*` Instructor APIs: requires `role in {TA, INSTRUCTOR, ADMIN}`
- `/m/*` Internal-only: requires internal token (e.g., `X-Internal-Token`) or network allowlist

---

## 9) Attempt State Machine

States: `ACTIVE | OFFLINE | FORFEITED | ENDED`

Transitions (MVP):
- `ACTIVE → OFFLINE` if `now - last_seen_at > 60s`
- `OFFLINE → ACTIVE` if heartbeat resumes and `now ≤ attemptEndAt`
- `OFFLINE → FORFEITED` if `now - last_seen_at > 300s` (5 min)
- `ACTIVE/OFFLINE → ENDED` if `now > attemptEndAt` (or `attemptEndAt + buffer`)
- `FORFEITED` is terminal (no recovery)

---

## 10) API Design

### 10.1 Student — Contest
- `POST /s/contests/:contestId/join`
  - check open window
  - create/return attempt
  - returns `{ attemptId, attemptStartAt, attemptEndAt, serverNow }`

- `GET /s/contests/:contestId`
  - returns contest meta + problems + attempt (if exists) + `serverNow`

- `POST /s/contests/:contestId/problems/:problemId/open`
  - upsert `problem_attempt_state.started_at`
  - returns state + `serverNow`

- `POST /s/contests/:contestId/problems/:problemId/run`
  - public tests only
  - increments `run_count`

- `POST /s/contests/:contestId/problems/:problemId/hint`
  - enforce:
    - attempt active and not expired
    - `now ≥ started_at + 60s`
    - cooldown: `now ≥ last_hint_at + 60s`
    - optional cap
  - record `hint_requested_at=now`
  - returns hint text

- `POST /s/contests/:contestId/submit`
  - enforce attempt active + time check (`attemptEndAt + 5s buffer` optional)
  - insert submission (PENDING) with DB unique guard
  - enqueue judge job
  - returns `{ submissionId }`

- `POST /s/contests/:contestId/heartbeat`
  - update `last_seen_at`
  - returns current attempt state

### 10.2 Student — Scoreboard & Clarifications
- `GET /s/contests/:contestId/scoreboard`
  - if `now < scoreboard_publish_at`: `{ status: "HIDDEN", publishAt }`
  - else: `{ status: "PUBLISHED", rows: [...] }`

- `GET /s/contests/:contestId/clarifications`
  - returns list (public announcements)

### 10.3 Instructor/TA — Clarifications
- `POST /i/contests/:contestId/clarifications`
  - RBAC required
  - creates announcement

### 10.4 Internal
- `POST /m/judging/result`
  - worker writes verdict/status/judged_at

---

## 11) Contest Timer Lockdown (Frontend + Backend)

### 11.1 Frontend time calibration
- `offsetMs = serverNow - Date.now()`
- `remainingMs = attemptEndAt - (Date.now() + offsetMs)`

### 11.2 Time’s up UX
When `remainingMs <= 0`:
- show modal “Time’s up”
- disable submit/hint
- redirect user out of contest pages

### 11.3 Backend hard enforcement (+ optional network buffer)
- Submit/Hint must check `now ≤ attemptEndAt`
- Optional tolerance: allow `attemptEndAt + 5s` to cover last-second network delay
- reject with `403/409` “Attempt expired”

---

## 12) Session Keepalive & Eligibility (Two-stage Grace)
Goal: allow brief network issues but still enforce “exit impacts eligibility”.

- Heartbeat every 10–15 seconds while in contest
- Stage 1 (OFFLINE): if `now - last_seen_at > 60s`
- Stage 2 (FORFEITED): if `now - last_seen_at > 300s`

UI behavior:
- OFFLINE: show “Disconnected, trying to reconnect…”
- FORFEITED: show “Attempt forfeited” and exit contest

---

## 13) Judging (Async) — MVP Safety Guardrails
Because judging runs **untrusted user code**, MVP should include minimum guardrails:

- **timeout**: max runtime per run/judge (e.g., 2–5s)
- **output limit**: cap stdout/stderr
- *(recommended)* **no network** during execution

Full container sandbox (Docker/Firejail/nsjail) can be a later iteration; MVP focuses on minimal stability.

---

## 14) Scoreboard (Delayed Publish) + Ranking Rule

### 14.1 Publish policy
- `scoreboard_publish_at = closeAt + 1h` (configurable)
- Before publish time: UI shows “Scoreboard will be available at …”

### 14.2 MVP ranking rule
Only count submissions that are:
- `status = DONE`
- `verdict = ACCEPTED`

Ranking:
1) `Solved` (AC count) **DESC**
2) Tie-break: `lastAcceptedAt` **ASC** (earlier is better)

Penalty/ICPC scoring is marked **TBD** for later.

### 14.3 Implementation
Recommended:
- BullMQ delayed job at `closeAt + 1h`:
  - compute scoreboard snapshot
  - write `scoreboard_snapshots(status=PUBLISHED)`
- UI reads from snapshot table

---

## 15) Clarifications (MVP1: Instructor/TA Announcements)
MVP1 scope:
- Only `TA/INSTRUCTOR/ADMIN` can post announcements
- Students can read-only view list
- Optional future MVP2: student questions + instructor answers

---

## 16) Practice Mode (No Timer, No Judging)
Practice is isolated from contest:
- no attempt timer
- no judging queue
- run only public tests
- optional drafts saving (future)

---

## 17) Matrices Dashboard (Instructor)

### What it is
The Matrices Dashboard is an **instructor-only analytics page** that presents aggregated learning/performance metrics for a contest (and optionally per-problem / per-student views).

### Where the full design lives
✅ Full analytics design details are documented in:

- **`docs/analytics/Analytics Section.md`**

This document includes:
- metrics list & definitions
- aggregation logic and grouping rules (group-level / student-level)
- snapshot schedule and consistency rules
- UI layout details (tables/charts/filters)

### Integration points (MVP)
- **Access control**: only `TA/INSTRUCTOR/ADMIN` can view
- **Data source**: the dashboard reads from snapshot tables (recommended)
  - `matrices_snapshots` keyed by `(contest_id, snapshot_type)`
- **Snapshots schedule**:
  - Preliminary: `closeAt + 5m`
  - Final: `closeAt + 15m`
- **Refresh**:
  - SSE `snapshot_ready` triggers React Query invalidation + refetch
  - fallback: polling every 60s until `FINAL_15M` is available (limited retries)

---

## 18) Reliability / Consistency / Scalability
- DB-level uniqueness prevents double submit (`UNIQUE(attempt_id, problem_id)`)
- Worker tasks are idempotent (safe retries)
- Snapshots are consistent via watermark
- Heavy aggregations happen in background jobs, not in request path
- Designed for ~200–500 students (MVP target)

---

## 19) MVP Checklist

### Contest flow
- [ ] Join creates per-student attempt (open window validated)
- [ ] Client timer uses server time offset
- [ ] Time’s up modal + redirect; submit/hint disabled
- [ ] Backend rejects submit/hint after attemptEndAt (+ optional 5s buffer)
- [ ] Run unlimited (public testcases only)
- [ ] Hint unlock after 1 min + 1 min cooldown (+ optional cap)
- [ ] Submit only once per problem (DB unique constraint)
- [ ] Async judging pipeline updates verdict/status

### Eligibility / session keepalive
- [ ] Heartbeat every 10–15s
- [ ] OFFLINE after 60s; FORFEITED after 5 min

### Notifications (SSE)
- [ ] Student “starting soon” SSE event
- [ ] Instructor “snapshot ready” SSE event
- [ ] Polling fallback if SSE drops

### Scoreboard + Clarifications
- [ ] Scoreboard hidden until `closeAt + 1h` then published
- [ ] MVP ranking: solved desc, lastAcceptedAt asc
- [ ] Clarifications: instructor/TA post; students read-only

### Matrices
- [ ] Link present to `docs/system design/Analytics Section.md`
- [ ] closeAt+5m preliminary snapshot exists
- [ ] closeAt+15m final snapshot exists
- [ ] Instructor UI auto-refresh on SSE