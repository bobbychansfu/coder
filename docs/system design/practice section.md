# 🧩 Practice Section — System Design Notes
**Authenticated practice library + per-student persisted sessions + configurable judging + AI hints + SSE progress updates**

---

## Table of Contents
1. [Overview](#1-overview)
2. [UI & Product Behavior](#2-ui--product-behavior)
3. [Core Rules (Current Project)](#3-core-rules-current-project)
4. [Tech Stack](#4-tech-stack)
5. [System Architecture](#5-system-architecture)
6. [Data Model](#6-data-model)
7. [Visibility & RBAC Boundary](#7-visibility--rbac-boundary)
8. [Practice Session Lifecycle](#8-practice-session-lifecycle)
9. [Submission State Machine](#9-submission-state-machine)
10. [API Design](#10-api-design)
11. [Frontend Behavior](#11-frontend-behavior)
12. [Judging Design](#12-judging-design)
13. [Reliability / Consistency / Limitations](#13-reliability--consistency--limitations)
14. [Current Implementation Checklist](#14-current-implementation-checklist)

---

## 1) Overview

The Practice section provides a **self-paced problem-solving area** outside contest timing rules.

In the current project, practice is:

- available to any authenticated user for browsing
- backed by the same `Problem` records used elsewhere in the app
- filtered to **published practice-visible problems only**
- persisted for students through `PracticeSession` + `PracticeRunRecord`
- reviewed through Gemini by default, with an optional external Judge mode
- supported by a separate AI-hint request flow
- updated live in the browser using **Server-Sent Events (SSE)**
- equipped with a browser-local, per-problem practice timer

Important current behavior:

- students get **persisted** practice history
- instructors and admins can still open practice problems, but their reviews are **ephemeral** and not saved
- Gemini mode reviews code without executing it; external Judge mode submits persisted student attempts for execution

---

## 2) UI & Product Behavior

### 2.1 Practice list page

Route:
- `/practice`

Behavior:
- shows all problems that are:
  - `isDraft = false`
  - `manageStatus = ACTIVE`
  - `source in {PRACTICE, BOTH}`
- supports:
  - difficulty filter
  - category/tag filter
  - status filter (`All`, `Completed`, `Not Started`)
  - text search
- renders problem cards with:
  - title
  - difficulty
  - points
  - solved state

Student-specific status behavior:
- `Completed` means the student has a `PracticeSession.solvedAt`
- `Not Started` means the student has no recorded activity (`firstRunAt`, `firstSubmitAt`, `solvedAt`, `runCount`, or `submitCount`) for that problem

### 2.2 Practice problem page

Route:
- `/practice/[id]`

Behavior:
- loads problem statement, examples, starter code, and prior practice history
- lazily opens or resumes a per-student practice session when a student submits
- lets the user edit code with draft persistence in browser storage
- includes a 15-minute, per-problem browser-local stopwatch
- can request a standalone AI hint for the current code
- submits code to the configured judging mode
- shows live progress:
  - `queued`
  - `running`
  - `done`
  - `failed`

### 2.3 Student vs staff behavior

Students:
- use persisted practice sessions and persisted run history
- get SSE updates for live judging status
- can revisit prior code and latest judged result

Instructors and admins:
- can view practice problems and submit code for temporary AI review
- do **not** persist sessions or submission history from the frontend practice page
- see a UI note that their reviews are temporary

Important:
- ephemeral staff reviews require Gemini mode
- external Judge mode requires a persisted submission and therefore does not support this staff path

### 2.4 Practice timer

The problem page renders `PracticeTimer`:

- starts at 15 minutes
- is scoped by problem code using `practice-timer:<problemCode>` in local storage
- continues across a full page refresh using a stored end time
- exposes `+15 min` only while running with five minutes or less remaining
- freezes its remaining time during normal client-side unmount/navigation
- does not update `PracticeSession`, analytics, scores, or judging behavior

### 2.5 AI hint dialog

The editor exposes an AI Hint action that:

- sends the problem identity, language, and current code to `POST /api/s/request_hint`
- displays the returned hint in `AiHintDialog`
- can retry a failed request
- is separate from submission judging and does not create a `PracticeRunRecord`

---

## 3) Core Rules (Current Project)

### 3.1 Problem eligibility

Only problems meeting all of the following conditions appear in practice:

- `isDraft = false`
- `manageStatus = ACTIVE`
- `source in {PRACTICE, BOTH}`

This means:
- archived problems are hidden
- draft problems are hidden
- contest-only problems are hidden

### 3.2 Session model

For students, practice uses **one session per user per problem**:

- session is created lazily immediately before the first student submission
- same session is reused on later visits
- counters and timestamps accumulate over time

### 3.3 Submission model

Practice submissions are not one-shot like contests.

Students can submit repeatedly:
- each submit creates a new `PracticeRunRecord`
- the parent `PracticeSession.submitCount` increments
- `firstSubmitAt` is set once
- in Gemini mode, `solvedAt` is set the first time a verdict becomes accepted

### 3.4 Judging model

Practice judging is configurable through `JUDGING_MODE`:

- `gemini` (default):
  - asynchronous and persisted for students
  - synchronous and ephemeral for instructors/admins
  - AI review without real compilation or execution
- `judge`:
  - sends persisted student submissions to `${JUDGE_URL}/judge_submission`
  - receives results through `/api/judge-callback` (also aliased by `/api/m/judge_result`)
  - requires a numeric `Problem.judgeProblemId`, or a numeric problem code as fallback

Across the two modes, student judging is:
- asynchronous for students
- persisted in `PracticeRunRecord`
- surfaced to the browser through status polling/SSE

Gemini evaluates conservatively using:
- the problem statement
- examples
- visible tests derived from the example input/output
- the submitted code

---

## 4) Tech Stack

### Frontend

- Next.js App Router + TypeScript
- tRPC + React Query for read/query flows
- REST endpoints for practice submission creation/status streaming
- browser local storage for code drafts
- browser local storage for timer state
- SSE for near real-time submission status updates

### Backend

- PostgreSQL as the source of truth
- Prisma for persistence
- tRPC routers:
  - `practice`
  - `practiceExecution`
- REST routes:
  - `/api/practice/submissions`
  - `/api/practice/submissions/:submissionId`
  - `/api/practice/submissions/:submissionId/stream`
  - `/api/s/request_hint`
  - `/api/judge-callback`

### Judging

- Gemini provider abstraction under `src/server/practice/provider.ts`
- Gemini implementation under `src/server/practice/providers/geminiJudgingProvider.ts`
- external Judge adapter in `src/server/practice/submissionService.ts`

---

## 5) System Architecture

- **Practice List / Detail UI**
  - fetches practice-visible problems and problem detail through tRPC
- **Practice Session Layer**
  - creates/reuses one session per student/problem
- **Submission API**
  - accepts code submissions
  - either persists them (student) or judges ephemerally (instructor/admin)
- **Submission Service**
  - validates problem visibility
  - writes `PracticeSession` / `PracticeRunRecord`
  - schedules async judging work
- **Judging Provider**
  - performs Gemini review and returns verdict, score, feedback, and testcase notes
- **External Judge Adapter**
  - posts student submissions to the Judge service in `judge` mode
  - records asynchronous callback results
- **AI Hint Proxy**
  - enriches a hint request with problem/user context
  - forwards it to `AI_HINT_URL`, then `JUDGE_URL`, then the localhost fallback
- **Event Bus + SSE**
  - emits `queued/running/done/failed`
  - pushes updates to the current browser session
- **PostgreSQL**
  - stores practice sessions and run records

---

## 6) Data Model

The current practice feature primarily uses the following tables.

### 6.1 `Problem`

Practice depends on shared `Problem` records.

Relevant fields:
- `id`
- `code`
- `title`
- `statement`
- `inputFormat`
- `outputFormat`
- `constraints`
- `exampleInput`
- `exampleOutput`
- `exampleExplanation`
- `difficulty`
- `isDraft`
- `manageStatus`
- `source`

Practice-only visibility rule:
- visible when `!isDraft && manageStatus === ACTIVE && source in {PRACTICE, BOTH}`

### 6.2 `PracticeSession`

`PracticeSession`
- `id`
- `userId`
- `problemId`
- `startedAt`
- `firstRunAt` *(currently present in schema, but not actively used by current submission flow)*
- `firstSubmitAt`
- `solvedAt`
- `selectedLang`
- `runCount`
- `submitCount`

Invariants:
- unique per `(userId, problemId)`

Purpose:
- represents the student’s long-lived relationship with one practice problem
- holds aggregate timestamps and counters

### 6.3 `PracticeRunRecord`

`PracticeRunRecord`
- `id`
- `sessionId`
- `userId`
- `problemId`
- `source`
- `status`
- `isSubmit`
- `language`
- `code`
- `verdict`
- `score`
- `feedback`
- `testcases`
- `judgedBy`
- `rawProviderResponse`
- `errorMessage`
- `compilePassed`
- `stdout`
- `stderr`
- `runtimeMs`
- `createdAt`
- `updatedAt`

Purpose:
- one persisted judged attempt
- stores the code snapshot, review output, and final verdict

### 6.4 Related UI-only state

The frontend also keeps non-database state:

- current editor language
- per-language draft code in local storage
- active submission SSE connection
- local output panel state
- per-problem stopwatch state
- AI hint dialog/loading/result state

---

## 7) Visibility & RBAC Boundary

### 7.1 Page access

Practice pages currently require authentication, but not a student-only role.

This means:
- students can browse and persist submissions
- instructors/admins can browse practice-visible problems too

### 7.2 Query access

The practice query router uses `practiceViewProcedure`, which is authenticated but not student-only.

So:
- list/detail/history queries are protected by login
- they are not restricted to students at the router boundary

### 7.3 Mutation/access split

The current project uses a hybrid model:

- `practiceExecution.openSession`
  - student-only
- `practiceExecution.submitCode`
  - student-only
- `POST /api/practice/submissions`
  - allows `student`, `instructor`, and `admin`
  - student: persisted submission
  - instructor/admin: ephemeral review
- `GET /api/practice/submissions/:submissionId`
  - student-only
- `GET /api/practice/submissions/:submissionId/stream`
  - student-only

This is intentional in the current implementation because the practice problem page supports:
- student persisted history
- instructor/admin temporary AI feedback

---

## 8) Practice Session Lifecycle

### 8.1 Open problem

When a student first submits from `/practice/[id]`:

1. frontend has already loaded problem detail through `trpc.practice.getProblemDetail`
2. submission handling calls `trpc.practiceExecution.openSession` if session information is not already available
3. backend upserts `PracticeSession` by `(userId, problemId)`
4. frontend uses the returned `sessionId` and `problemId` for the persisted submit flow

Opening the detail page alone does not create a session.

### 8.2 Resume existing work

On later visits:

- the same session is reused
- the frontend restores the latest judged run if no local draft already exists
- local browser drafts take precedence over server history

### 8.3 Mark solved

When a Gemini-judged result becomes accepted:

- backend updates the run record to `done`
- backend sets `PracticeSession.solvedAt` if it was previously null

This creates the basis for:
- solved badges in the practice list
- `Completed` / `Not Started` filtering

Current caveat:
- the external Judge callback updates `PracticeRunRecord`, but does not currently set `PracticeSession.solvedAt`
- an accepted Judge-mode submission may therefore not appear as `Completed`

---

## 9) Submission State Machine

### 9.1 Persisted student submissions

States:
- `queued`
- `running`
- `done`
- `failed`

Transitions:
- `queued → running`
  - background judging starts
- `running → done`
  - provider returns a valid result
- `running → failed`
  - provider/network/configuration error
- `queued → failed`
  - early failure before provider completes

### 9.2 Verdicts

Current normalized verdicts:
- `accepted`
- `wrong_answer`
- `partial`
- `runtime_error`
- `failed`

These are UI/domain verdicts, separate from transport status.

### 9.3 Ephemeral staff flow

Instructor/admin reviews skip persisted state transitions in the database:

- request enters the same create endpoint
- backend detects an instructor or admin role
- provider judges immediately
- response returns directly with `persisted: false`

No `PracticeSession` or `PracticeRunRecord` is written in this path.

---

## 10) API Design

The practice feature currently uses both tRPC and REST.

### 10.1 tRPC query layer

`practice.listProblems`
- filters practice-visible problems by:
  - difficulty
  - tag
  - search
  - status

`practice.getProblemDetail`
- returns:
  - statement
  - formats
  - constraints
  - example
  - starter code

`practice.getRunHistory`
- returns the latest persisted practice runs for the current student/problem

`practice.getLatestRunRecord`
- returns the most recent persisted run with code + judging data

### 10.2 tRPC execution layer

`practiceExecution.openSession`
- input: `{ problemCode }`
- upserts the per-student session

`practiceExecution.submitCode`
- student-only persisted submit path
- currently exists, but the main practice page uses the REST create endpoint for actual submission

### 10.3 REST submission APIs

`POST /api/practice/submissions`
- input:
  - `problemId`
  - `language`
  - `code`
- student result:
  - `{ submissionId, status: "queued", persisted: true }`
- instructor result:
  - full judged payload + `persisted: false`
- admin result:
  - full judged payload + `persisted: false`

`GET /api/practice/submissions/:submissionId`
- returns the latest normalized submission payload for the current student

`GET /api/practice/submissions/:submissionId/stream`
- SSE stream
- emits:
  - `connected`
  - `queued`
  - `running`
  - `done`
  - `failed`

### 10.4 AI hint API

`POST /api/s/request_hint`
- requires authentication
- accepts the problem identity, language, and current code
- enriches the request with problem metadata, topics, user rank, and relevant solved problems
- forwards to `${AI_HINT_URL}/request_hint`
- falls back to `JUDGE_URL`, then `http://127.0.0.1:8000`, when `AI_HINT_URL` is unset

### 10.5 Judge callback API

`POST /api/judge-callback`
- receives asynchronous external Judge results
- attempts to match a contest submission by `sid` first
- uses `connection_id`, then `sid`, to find a practice run
- updates the matching `PracticeRunRecord` and publishes an SSE event

`POST /api/m/judge_result`
- compatibility alias for the same callback handler

---

## 11) Frontend Behavior

### 11.1 Practice list

The list page:
- uses `trpc.practice.listProblems`
- renders shared `ProblemCard` tiles
- shows create-problem CTA for roles that can author problems

### 11.2 Practice detail page

The detail page:
- loads problem detail and run history
- manages editor language and code drafts
- posts submissions through `/api/practice/submissions`
- opens SSE stream for persisted student submissions
- renders `PracticeTimer` for local time management
- wraps the editor with `PracticeSolutionEditorWithAiHint`

### 11.3 Draft persistence

The frontend stores editor drafts in browser local storage using a per-problem key:

- prefix: `practice-submission-draft:`

This means:
- draft recovery is immediate on refresh
- local draft state can override older persisted server code

### 11.4 Latest run bootstrap

If there is no local draft but the student has a persisted latest run:

- the page restores:
  - last language
  - last code
  - last verdict/feedback/testcases

This helps practice feel resumable rather than stateless.

### 11.5 Timer and hint state

- timer state is local to the browser and problem code
- AI hint loading/result state lives in the page dialog only
- neither state changes practice completion, score, or submission counters

---

## 12) Judging Design

### 12.1 Gemini provider model

The backend uses a provider interface:

- `JudgingProvider`
- `judgeSubmission(input) -> { score, verdict, feedback, testcases }`

This isolates Gemini review from the outer practice flow.

### 12.2 Gemini mode

Gemini mode:
- is selected when `JUDGING_MODE` is unset or set to `gemini`
- requires `GEMINI_API_KEY`
- uses `GEMINI_MODEL`, defaulting to `gemini-2.5-flash`

Gemini is prompted to:
- review conservatively
- avoid claiming it executed code
- use only:
  - problem statement
  - examples
  - visible tests
  - submitted code

### 12.3 External Judge mode

When `JUDGING_MODE=judge`:

- the service maps the app language to the Judge language
- it resolves a numeric Judge problem ID from `Problem.judgeProblemId` or numeric `Problem.code`
- it posts `sid`, `pid`, `language`, `connection_id`, and `submission` to `${JUDGE_URL}/judge_submission`
- the persisted run remains asynchronous until the Judge calls the callback endpoint

This path can provide real execution results, but depends on correct problem mappings, networking, and callback configuration.

### 12.4 Environment configuration

Use the environment template appropriate to the runtime:

- `.env.dev` as the development base
- `.env.cas` as the CAS/VM deployment base

Relevant variables:

- `JUDGING_MODE=gemini|judge`
- `GEMINI_API_KEY` and optional `GEMINI_MODEL` for Gemini mode
- `JUDGE_URL` for external submission execution
- optional `AI_HINT_URL` for the separate hint service; otherwise it falls back to `JUDGE_URL`

After changing environment values, restart/rebuild the running Next.js process so it loads the new configuration.

### 12.5 Visible tests in Gemini mode

Visible tests are currently derived from the example only:

- if `exampleInput` or `exampleOutput` exists
- provider receives one visible test named `Example`

Gemini mode has no hidden-test execution path. Hidden tests, if any, are owned by the external Judge in Judge mode.

### 12.6 Score normalization in Gemini mode

The Gemini provider clamps/normalizes score ranges by verdict:

- accepted: high score
- partial: middle band
- wrong answer: low-to-mid band
- runtime_error / failed: low band

This keeps the UI numerically consistent even though the system is AI-reviewed.

---

## 13) Reliability / Consistency / Limitations

### 13.1 Good properties of current design

- persisted student history in Postgres
- one stable session per student/problem
- live browser updates over SSE
- resumable editor experience
- provider abstraction keeps future replacement possible
- optional external Judge integration for persisted student attempts
- standalone AI hints without creating submissions
- browser-local timer state that survives refresh

### 13.2 Important current limitations

- Gemini mode has no real code execution sandbox, compiler/runtime truth source, or hidden tests
- Gemini visible tests are derived only from example data
- Gemini `runtimeMs` is not a real execution runtime measurement
- external Judge mode cannot serve the current ephemeral instructor/admin flow
- accepted external Judge callbacks do not currently set `PracticeSession.solvedAt`
- SSE event delivery is process-local; multi-instance deployment would need a shared pub/sub layer
- practice page browsing is authenticated but not student-only
- stopwatch and drafts are browser-local and do not synchronize across devices
- AI hints require a separate service exposing `/request_hint`

### 13.3 Why this is still useful

Even with those limitations, the current design is still valuable for:

- validating practice UI/UX
- collecting persisted student practice history
- exercising async status transitions
- testing live updates and review feedback flow
- supporting authoring/demo workflows locally

---

## 14) Current Implementation Checklist

- practice list page exists
- practice detail page exists
- practice-visible filtering is enforced in backend queries
- one session per student/problem is implemented
- persisted run records are implemented
- latest run restoration is implemented
- browser draft persistence is implemented
- SSE live status updates are implemented
- instructor ephemeral review path is implemented
- admin ephemeral review path is implemented
- Gemini provider abstraction is implemented
- external Judge submission/callback path is implemented
- standalone AI hint dialog/proxy is implemented
- per-problem practice stopwatch is implemented
- Judge-mode accepted-result/session synchronization remains incomplete
