# Contest Section - System Design Notes
**Schedule-based contest registration + optional three-student teams + contest problem workspace + direct judge integration + live scoreboard aggregation**

---

## Table of Contents
1. [Overview](#1-overview)
2. [UI & Product Behavior](#2-ui--product-behavior)
3. [Core Rules (Current Project)](#3-core-rules-current-project)
4. [Tech Stack](#4-tech-stack)
5. [System Architecture](#5-system-architecture)
6. [Data Model](#6-data-model)
7. [Visibility & RBAC Boundary](#7-visibility--rbac-boundary)
8. [Contest Lifecycle](#8-contest-lifecycle)
9. [Student Flow](#9-student-flow)
10. [API Design](#10-api-design)
11. [Judging & Submission State](#11-judging--submission-state)
12. [Scoreboard, Hints, and Announcements](#12-scoreboard-hints-and-announcements)
13. [Relationship to Practice](#13-relationship-to-practice)
14. [Reliability / Consistency / Known Gaps](#14-reliability--consistency--known-gaps)
15. [Current Implementation Checklist](#15-current-implementation-checklist)

---

## 1) Overview

The Contest section provides a **shared scheduled contest experience** for registered users.

In the current project, contests are:

- created and edited by instructors/admins through a tRPC authoring flow
- exposed to students through App Router pages and `/api/s/*` REST endpoints
- governed by a **contest-wide schedule** (`startsAt`, `endsAt`, `durationMinutes`)
- registered per student through `Participation`
- able to organize registered students into contest-scoped teams through `Team` and `TeamMember`
- tracked per problem through `ProblemStatus`
- judged by forwarding submissions to an external judge service
- summarized through a live scoreboard derived from stored contest results

Important current behavior:

- contests are **not** using a per-student countdown timer in the main student flow
- students can submit **multiple times** to the same problem while the contest is active
- registered students can create one fixed-size team of three for a contest
- teams are currently organizational; submissions, progress, and scoreboard rows remain per student
- scoreboard rows are built from current stored scores, not from delayed snapshot publication
- practice is now a separate system and should be documented independently

---

## 2) UI & Product Behavior

### 2.1 Contest dashboard

Primary route:
- `/contests`

Behavior:
- shows contests the student is already registered for
- also shows published contests the student can still join
- groups contest state using effective schedule status:
  - `Upcoming`
  - `In Progress`
  - `Closed`

### 2.2 Contest detail page

Route:
- `/contests/[id]`

Behavior:
- loads the selected contest and the student-facing contest problem list
- shows:
  - problem list
  - current scoreboard
- shows student team controls in the page header:
  - an existing team notice when the student already has a contest team
  - a `Create Team` dialog otherwise
  - a migration warning when team data cannot be loaded
- only renders the scoreboard tab when there are scoreboard rows to display

### 2.3 Contest problem page

Route:
- `/contests/[id]/problems/[code]`

Behavior:
- loads the problem statement and starter code
- shows student submission history for that contest problem
- keeps per-problem draft code in browser storage
- supports previous/next problem navigation
- allows contest submission while the contest is active
- disables new submissions when the contest is upcoming or closed

### 2.4 Instructor authoring

Instructor/admin contest authoring is handled separately from student contest play:

- draft list and editor use the `contestAuthoring` tRPC router
- instructors choose visibility, schedule, AI hint settings, experiment-group hint delays, and selected problems
- publishing a contest makes it visible to the student-facing contest flow

### 2.5 Contest team creation

The student contest detail page supports self-service team creation:

- the creator must be a registered `STUDENT` contestant
- the creator supplies a team name of 1-50 trimmed characters
- the creator selects exactly two other registered students
- selected students must not already belong to another team for that contest
- the resulting contest team always has three members, including the creator

There is currently no student join-request, leave-team, rename-team, or delete-team flow.

---

## 3) Core Rules (Current Project)

### 3.1 Contest visibility

For the student contest flow, a contest must generally be:

- `manageStatus = ACTIVE`
- `published = true`
- `status != DRAFT`
- non-private for student discovery (`visibility != PRIVATE`)

Instructors and admins can view a broader set of contests through instructor-aware lookups.

### 3.2 Contest status

The effective student-facing status is computed from schedule:

- `DRAFT`
- `UPCOMING`
- `ACTIVE`
- `ENDED`

If `endsAt` is missing, `durationMinutes` can still be used to derive the effective end time.

### 3.3 Registration and entry

Current student flow has two separate concepts:

- **Register**: create a `Participation` row for the student as a contestant
- **Enter**: initialize per-problem `ProblemStatus` rows for that contest

Students can register for contests that are currently:

- `UPCOMING`
- `ACTIVE`

### 3.4 Submission behavior

Contest submissions in the current project are:

- allowed only while the contest is effectively `ACTIVE`
- persisted in `Submission`
- forwarded to an external judge service
- allowed multiple times per problem

Unlike the older design draft, the current backend does **not** enforce one final submission per problem.

### 3.5 Problem progress

The main student progress record is `ProblemStatus`:

- default status starts as `not started`
- later updates become `correct` or `wrong`
- score is stored per contest/problem/user
- `tries` increments when a pending submission settles to a non-system final result

### 3.6 Contest teams

Contest teams are stored separately from registration:

- `Participation` determines whether a student is registered for a contest
- `Team.contestId` scopes a team to one contest
- `TeamMember` associates users with that team
- general admin-created student groups use the same tables with `Team.contestId = null`

The application checks that a user belongs to at most one team in the selected contest. This rule is not represented by a dedicated database uniqueness constraint.

---

## 4) Tech Stack

### Frontend

- Next.js App Router + TypeScript
- React client pages for contest interaction
- MUI + CSS Modules for UI
- browser local storage for contest code drafts

### Backend

- PostgreSQL as source of truth
- Prisma for persistence
- App Router REST endpoints under `/api/s/*`, `/api/m/*`, and `/api/cron/*`
- tRPC for instructor contest authoring and analytics surfaces
- tRPC for student contest-team reads and creation

### Judge integration

- external judge service configured by `JUDGE_URL`
- direct HTTP submission to `/judge_submission`
- callback handling through:
  - `/api/judge-callback`
  - `/api/m/judge_result`

---

## 5) System Architecture

- **Contest dashboard / pages**
  - server-rendered App Router pages load contest data from DB helpers
- **Student contest API**
  - exposes registration, contest detail, problem detail, submissions, and hint routes
- **Contest submission service**
  - validates user/session/contest state
  - creates `Submission`
  - forwards code to the judge
- **Judge callback handler**
  - applies final judge status to contest submissions
  - also supports practice callback updates through the same endpoint
- **Scoreboard builder**
  - computes rows from `Participation` + `ProblemStatus`
- **Contest team service**
  - reads the current student's contest team and eligible teammates
  - creates a three-person team in a serializable transaction
- **Contest status sync cron**
  - keeps stored `Contest.status` aligned with wall-clock schedule
- **Instructor analytics sidecar**
  - reads contest experiment/session data for post-contest analytics

---

## 6) Data Model

The current contest system primarily uses the following tables.

### 6.1 `Contest`

Relevant fields:

- `id`
- `slug`
- `name`
- `description`
- `status`
- `manageStatus`
- `visibility`
- `startsAt`
- `endsAt`
- `durationMinutes`
- `participants`
- `published`
- `aiHintEnabled`
- `instructorId`

Notes:

- `status` is stored but also interpreted through `getEffectiveContestStatus`
- `participants` is maintained as a counter alongside participation rows

### 6.2 `ContestProblem`

Join table for contest membership:

- `contestId`
- `problemId`
- `ordering`

Current usage:

- defines which problems belong to a contest
- controls the A/B/C-style ordering shown to students

### 6.3 `Participation`

Student registration table:

- `userId`
- `contestId`
- `role`
- `rank`
- `experimentGroup`
- `assignmentMethod`
- `assignedAt`

Current usage:

- `role = contestant` drives student registration
- instructor analytics can also use experiment-group metadata

### 6.4 `ProblemStatus`

Per-student per-problem contest summary:

- `userId`
- `contestId`
- `problemId`
- `status`
- `tries`
- `timePenalty`
- `score`

Current usage:

- initialized when the student enters the contest
- updated as contest submissions settle
- used to build the contest scoreboard

### 6.5 `Submission`

Contest submission history:

- `id`
- `language`
- `submission`
- `status`
- `score`
- `judgeOutput`
- `createdAt`
- `userId`
- `contestId`
- `problemId`

Important current behavior:

- there is **no** unique constraint limiting one submission per problem
- submission history is preserved per user/problem

### 6.6 `Announcement`

Contest-related announcements exist in schema:

- `id`
- `title`
- `message`
- `scope`
- `authorId`
- `contestId`

Current note:

- announcements are used by admin/instructor surfaces
- the current student contest detail API does not yet expose a live contest clarifications feed

### 6.7 `Team` and `TeamMember`

`Team` fields:

- `id`
- `name`
- `contestId` (nullable)
- `createdAt`
- `updatedAt`

`TeamMember` fields:

- `id`
- `teamId`
- `userId`

Relationships and constraints:

- one `Contest` can have many contest-scoped `Team` rows
- one `Team` has many `TeamMember` rows
- one `User` can have many `TeamMember` rows across different teams/contexts
- deleting a contest cascades to its contest teams
- deleting a team or user cascades to its membership rows
- `@@unique([teamId, userId])` prevents the same user from appearing twice in one team
- `@@index([contestId])` supports contest-scoped team lookup
- `contestId = null` identifies general admin-created groups; a non-null value identifies a contest team

The contest-team migration adds the nullable `Team.contestId` foreign key to the earlier general team tables.

### 6.8 `ContestExperimentGroup` and `ContestProblemSession`

These tables exist for analytics and experimentation support.

`ContestExperimentGroup`
- stores per-contest group A/B hint configuration
- includes `aiHintEnabled` and nullable `hintDelayMinutes`
- is unique by `(contestId, groupName)`

`ContestProblemSession`
- `startedAt`
- `firstRunAt`
- `firstSubmitAt`
- `hintEligibleAt`
- `hintTriggeredAt`
- `solvedAt`
- `selectedLang`
- `solved`

Current note:

- these tables support instructor analytics/research features
- they are **not** the primary state model for the student contest request path today

---

## 7) Visibility & RBAC Boundary

### Student access

Student contest APIs require an authenticated user.

For student-facing contest access, the backend generally expects:

- the student to be registered through `Participation`
- the contest to be non-private
- the contest to be active in lifecycle terms (`manageStatus = ACTIVE`)

Contest-team procedures additionally use `studentProcedure` and require:

- a database user with `role = STUDENT`
- a `Participation` row for the contest with `role = contestant`

### Instructor/admin access

Instructor/admin viewers can inspect contests through `findContestForViewer`, which broadens access beyond normal contestant registration.

### Internal/system access

System routes include:

- `/api/judge-callback`
- `/api/m/judge_result`
- `/api/cron/sync-contest-status`

The cron route is protected with `CRON_SECRET`.

---

## 8) Contest Lifecycle

### 8.1 Authoring

Instructors/admins create contests through the `contestAuthoring` router.

Current authoring flow supports:

- contest name and description
- schedule (`startsAt`, `endsAt`)
- visibility (`PUBLIC`, `PRIVATE`, `COURSE_ONLY`)
- AI hint toggle
- group A and group B hint-delay settings (defaults: 5 and 10 minutes)
- selected problem list
- draft vs published state

When AI hints are enabled, authoring replaces the contest's experiment-group settings with group A and B rows. Disabling AI hints removes those rows.

### 8.2 Publishing

Publishing a contest means:

- `published = true`
- `status` becomes one of:
  - `UPCOMING`
  - `ACTIVE`
  - `ENDED`

Draft contests remain hidden from the student flow.

### 8.3 Status synchronization

Contest status is kept aligned with wall-clock time by:

- `getEffectiveContestStatus` during request-time reads
- `/api/cron/sync-contest-status` for stored status synchronization

### 8.4 Registration and participation

Student participation lifecycle:

1. Discover contest from `/api/s/info`
2. Register through `/api/s/contest/register/:cid`
3. Optionally create a three-person contest team through `contestTeams.create`
4. Enter through `/api/s/entercontest/:cid`
5. Work on contest problems while the contest is active

### 8.5 Contest end

Once the contest is ended:

- new submissions are rejected
- students can still review contest pages and prior submissions
- scoreboard remains available from stored results

---

## 9) Student Flow

### 9.1 Contest list

`GET /api/s/info`

Returns:

- contests already registered by the student
- additional contests the student can still join

### 9.2 Register / unregister

Registration endpoints:

- `POST /api/s/contest/register/:cid`
- `POST /api/s/contest/unregister/:cid`

Behavior:

- registration inserts or removes a `Participation`
- contestant registration also increments/decrements the contest participant counter

### 9.3 Enter contest

`POST /api/s/entercontest/:cid`

Behavior:

- verifies the user is already registered
- rejects upcoming or ended contests
- initializes `ProblemStatus` rows for each contest problem
- increments the student `competitionsParticipated` counter

### 9.4 Contest detail

`GET /api/s/contest/:cid`

Returns:

- contest problem status rows for the current user
- scoreboard rows for the contest
- current user role

The page also uses `contestTeams.get` to load the student's current contest team and eligible teammates.

### 9.5 Create a contest team

tRPC procedures:

- `contestTeams.get`
- `contestTeams.create`

Behavior:

- returns the student's existing team, if any
- otherwise returns registered, unassigned student candidates
- creates the team and its three membership rows atomically
- rejects duplicate selections, ineligible users, and members already assigned to a contest team

### 9.6 Problem detail and submissions

Problem endpoints:

- `GET /api/s/problem/:cid/:pid`
- `GET /api/s/submissions/:cid/:pid`

Behavior:

- loads the contest problem statement and related metadata
- creates an initial `ProblemStatus` row if needed
- returns the student submission history for that problem

### 9.7 Submit solution

`POST /api/s/submit/:cid/:pid`

Behavior:

- accepts JSON or multipart submission input
- creates a `Submission` row in `PENDING`
- forwards the submission to the external judge
- may settle inline immediately or later through the callback flow

---

## 10) API Design

### 10.1 Student contest routes

- `GET /api/s/info`
  - student contest dashboard payload

- `POST /api/s/contest/register/:cid`
  - register current user as a contestant

- `POST /api/s/contest/unregister/:cid`
  - remove contestant registration

- `POST /api/s/entercontest/:cid`
  - prepare the user to work on contest problems

- `GET /api/s/contest/:cid`
  - contest problem list and scoreboard

- `GET /api/s/closed/:cid`
  - closed contest metadata route

- `GET /api/s/problem/:cid/:pid`
  - contest problem detail

- `POST /api/s/submit/:cid/:pid`
  - create and judge a contest submission

- `GET /api/s/submissions/:cid/:pid`
  - contest submission history for the current user/problem

### 10.2 Hint routes

- `GET /api/s/hints?pid=...`
  - read stored hint history for the current user/problem

- `POST /api/s/request_hint`
  - forward a hint request to the judge service using current user context

### 10.3 Judge/system routes

- `POST /api/judge-callback`
  - judge writeback route for contest and practice submissions

- `POST /api/m/judge_result`
  - alias to the same judge callback handler

- `GET /api/cron/sync-contest-status`
  - synchronize stored contest statuses with schedule

### 10.4 Instructor authoring routes

Contest authoring is currently handled by tRPC rather than public REST endpoints:

- `contestAuthoring.listDraftContests`
- `contestAuthoring.listProblemLibrary`
- `contestAuthoring.getContestById`
- `contestAuthoring.createContest`
- `contestAuthoring.updateContest`

### 10.5 Contest team procedures

Contest teams use authenticated student tRPC procedures:

- `contestTeams.get({ contestId })`
  - returns the current team and available registered students

- `contestTeams.create({ contestId, name, memberUserIds })`
  - creates one three-student contest team

The related `adminTeams` router manages general student groups where `contestId` is null; it is not the student contest-team API.

---

## 11) Judging & Submission State

### 11.1 Submission creation

When a student submits code:

1. backend validates session and contest visibility
2. backend ensures the contest is effectively `ACTIVE`
3. backend creates a `Submission` row with `status = PENDING`
4. backend maps the app language to judge language
5. backend forwards the request to `JUDGE_URL/judge_submission`

### 11.2 Result application

Judge results are normalized through `applyContestJudgeResult`.

Current effects:

- `Submission.status` is updated
- `Submission.score` and `judgeOutput` are stored
- `ProblemStatus` is upserted/updated
- `tries` increments when a pending submission settles to a counted final result
- user points/problems solved may increase
- user activity and gamification sync may run

### 11.3 Callback handling

The callback route:

- first tries to match a contest `Submission` by `sid`
- otherwise tries to match a practice submission by `connection_id`
- returns:
  - `400` for missing identifiers
  - `404` if no contest or practice submission is found
  - `200` when an update is applied

---

## 12) Scoreboard, Hints, and Announcements

### 12.1 Scoreboard

Current scoreboard behavior:

- rows are derived from `Participation` + `ProblemStatus`
- score is the sum of per-problem stored scores
- solved count is based on `correct` or positive-score statuses
- ranks are sorted by:
  1. preset rank when present
  2. total score descending
  3. solved descending
  4. display name ascending

This is a **live aggregation** approach, not a delayed snapshot publish model.

Contest team membership does not currently change scoreboard aggregation. Each participant continues to have an individual row and score.

### 12.2 Hints

Current hint behavior:

- student hint requests are forwarded to the external judge service
- user context, rank, topics, and related solved-problem context are attached
- stored hint history can be queried from the local `Hint` table

Important current limitation:

- the request route itself does not apply the older planned cooldown/eligibility rules
- local hint persistence is not handled in the request route itself

### 12.3 Announcements and clarifications

Contest announcements exist in schema and admin/instructor surfaces, but the current student contest detail payload does not yet expose a live clarifications feed.

So, today:

- scoreboard is live
- hints are partially integrated
- clarifications/announcements are not yet a full student-facing contest tab backed by live API data

---

## 13) Relationship to Practice

Practice is now a separate subsystem.

The old design statement "Practice Mode (No Timer, No Judging)" is no longer accurate for this project.

Current state:

- contest and practice share the `Problem` bank
- contest uses `Participation`, `ProblemStatus`, and `Submission`
- practice uses `PracticeSession` and `PracticeRunRecord`
- practice has its own AI-reviewed submission flow and SSE updates

See:

- [practice section.md](./practice%20section.md)

---

## 14) Reliability / Consistency / Known Gaps

- contest status is interpreted both from stored fields and from effective schedule computation
- cron helps keep stored `Contest.status` aligned, but request-time code still defensively recomputes status
- submissions depend on external judge availability
- scoreboard consistency is based on current DB state, not snapshot publication
- the student flow currently has **no per-user timer lock**, heartbeat, offline, or forfeiture state machine
- there is no dedicated contest "run against public tests" endpoint in the current student API
- contest clarifications are not yet fully wired as a live student-facing feature
- analytics-oriented tables such as `ContestProblemSession` exist, but they are not the main request-path source of truth for student contest play
- contest teams do not yet aggregate submissions, progress, or scoreboard results
- one-team-per-student-per-contest is application-enforced rather than protected by a database uniqueness constraint
- unregistering from a contest does not currently remove an existing contest-team membership
- team creation checks registration but does not independently restrict creation by effective contest schedule status

---

## 15) Current Implementation Checklist

### Student contest flow

- [x] Students can discover registered and joinable contests
- [x] Students can register and unregister from contests
- [x] Students can enter registered contests
- [x] Contest detail pages show problem lists and scoreboard rows
- [x] Contest problem pages show statements, starter code, and submission history
- [x] New submissions are blocked for upcoming and ended contests
- [x] Multiple submissions per contest problem are supported

### Contest teams

- [x] Registered students can view their current contest team
- [x] Unassigned students can create a named team with exactly two other eligible students
- [x] Contest teams are separated from general admin-created groups by `Team.contestId`
- [x] Contest deletion cascades to contest teams and memberships
- [ ] Team-based submissions and scoreboard aggregation
- [ ] Student leave, rename, delete, or membership-request workflows
- [ ] Database-level one-team-per-student-per-contest constraint

### Judging

- [x] Contest submissions are persisted before judge handoff
- [x] Judge responses can settle inline
- [x] Judge callbacks can update contest submissions later
- [x] Problem status and student score progress are updated from judge results

### Authoring and lifecycle

- [x] Instructor/admin authoring supports draft and published contests
- [x] Contest schedules derive effective status
- [x] Cron endpoint can resynchronize stored status fields

### Known gaps versus the older design draft

- [ ] Per-student countdown timer
- [ ] Heartbeat / offline / forfeiture flow
- [ ] One-final-submission-per-problem enforcement
- [ ] Live student clarifications feed
- [ ] Delayed scoreboard publish snapshots in the main contest request path
