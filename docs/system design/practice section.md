# 🧩 Practice Section — System Design Notes
**Authenticated practice library + per-student persisted sessions + AI-reviewed submissions + SSE progress updates**

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
- AI-reviewed through a backend judging provider
- updated live in the browser using **Server-Sent Events (SSE)**

Important current behavior:

- students get **persisted** practice history
- instructors can still open practice problems, but their AI reviews are **ephemeral** and not saved
- the current judging flow is **AI review**, not real sandbox execution

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
- `Not Started` means the student has no session yet for that problem

### 2.2 Practice problem page

Route:
- `/practice/[id]`

Behavior:
- loads problem statement, examples, starter code, and prior practice history
- opens or resumes a per-student practice session
- lets the user edit code with draft persistence in browser storage
- submits code for AI review
- shows live progress:
  - `queued`
  - `running`
  - `done`
  - `failed`

### 2.3 Student vs instructor behavior

Students:
- use persisted practice sessions and persisted run history
- get SSE updates for live judging status
- can revisit prior code and latest judged result

Instructors:
- can view practice problems and submit code for temporary AI review
- do **not** persist sessions or submission history from the frontend practice page
- see a UI note that their reviews are temporary

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

- session is created on first open
- same session is reused on later visits
- counters and timestamps accumulate over time

### 3.3 Submission model

Practice submissions are not one-shot like contests.

Students can submit repeatedly:
- each submit creates a new `PracticeRunRecord`
- the parent `PracticeSession.submitCount` increments
- `firstSubmitAt` is set once
- `solvedAt` is set the first time a verdict becomes accepted

### 3.4 Judging model

Current practice judging is:
- asynchronous for students
- ephemeral for instructors
- AI-based, not real compilation/execution

The provider evaluates conservatively using:
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

### Judging

- provider abstraction under `src/server/practice/provider.ts`
- Gemini-backed implementation under `src/server/practice/providers/geminiJudgingProvider.ts`

---

## 5) System Architecture

- **Practice List / Detail UI**
  - fetches practice-visible problems and problem detail through tRPC
- **Practice Session Layer**
  - creates/reuses one session per student/problem
- **Submission API**
  - accepts code submissions
  - either persists them (student) or judges ephemerally (instructor)
- **Submission Service**
  - validates problem visibility
  - writes `PracticeSession` / `PracticeRunRecord`
  - schedules async judging work
- **Judging Provider**
  - performs AI review and returns verdict, score, feedback, and testcase notes
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
- one persisted AI-reviewed attempt
- stores the code snapshot, review output, and final verdict

### 6.4 Related UI-only state

The frontend also keeps non-database state:

- current editor language
- per-language draft code in local storage
- active submission SSE connection
- local output panel state

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
  - allows `student` and `instructor`
  - student: persisted submission
  - instructor: ephemeral review
- `GET /api/practice/submissions/:submissionId`
  - student-only
- `GET /api/practice/submissions/:submissionId/stream`
  - student-only

This is intentional in the current implementation because the practice problem page supports:
- student persisted history
- instructor temporary AI feedback

---

## 8) Practice Session Lifecycle

### 8.1 Open problem

When a student opens `/practice/[id]`:

1. frontend loads problem detail through `trpc.practice.getProblemDetail`
2. frontend calls `trpc.practiceExecution.openSession`
3. backend upserts `PracticeSession` by `(userId, problemId)`
4. frontend stores returned `sessionId` and `problemId`

### 8.2 Resume existing work

On later visits:

- the same session is reused
- the frontend restores the latest judged run if no local draft already exists
- local browser drafts take precedence over server history

### 8.3 Mark solved

When an async judged result becomes accepted:

- backend updates the run record to `done`
- backend sets `PracticeSession.solvedAt` if it was previously null

This creates the basis for:
- solved badges in the practice list
- `Completed` / `Not Started` filtering

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

### 9.3 Ephemeral instructor flow

Instructor reviews skip persisted state transitions in the database:

- request enters the same create endpoint
- backend detects `user.role === "instructor"`
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

---

## 12) Judging Design

### 12.1 Provider model

The backend uses a provider interface:

- `JudgingProvider`
- `judgeSubmission(input) -> { score, verdict, feedback, testcases }`

This makes it possible to swap implementations later without changing the outer practice flow.

### 12.2 Current Gemini implementation

The current provider:
- is selected by `JUDGING_MODE`
- defaults to Gemini
- requires `GEMINI_API_KEY`

Gemini is prompted to:
- review conservatively
- avoid claiming it executed code
- use only:
  - problem statement
  - examples
  - visible tests
  - submitted code

### 12.3 Visible tests

Visible tests are currently derived from the example only:

- if `exampleInput` or `exampleOutput` exists
- provider receives one visible test named `Example`

There is no hidden-test execution path in the current practice system.

### 12.4 Score normalization

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

### 13.2 Important current limitations

- no real code execution sandbox
- no compiler/runtime truth source
- no hidden/private testcase judging
- visible tests are derived only from example data
- `runtimeMs` in practice is not a real execution runtime measurement
- SSE event delivery is process-local; multi-instance deployment would need a shared pub/sub layer
- practice page browsing is authenticated but not student-only

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
- Gemini provider abstraction is implemented
- true execution-based judging is **not** implemented
- hidden testcase judging is **not** implemented

