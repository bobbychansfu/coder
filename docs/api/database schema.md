# Database Schema
**Current Prisma/PostgreSQL schema overview for auth, contests, practice, analytics, and gamification**

---

## Table of Contents
1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Core Enums](#3-core-enums)
4. [Domain Overview](#4-domain-overview)
5. [Table Reference](#5-table-reference)
6. [Key Relationships](#6-key-relationships)
7. [Important Constraints](#7-important-constraints)
8. [Current Caveats](#8-current-caveats)

---

## 1) Overview

The project uses **Prisma** on top of **PostgreSQL**.

The schema currently covers these main areas:

- users and roles
- contests and contest participation
- problems and starter code
- contest submissions and scoreboard-related state
- practice sessions and practice run history
- analytics / experiment-group support
- announcements, hints, activities, and achievements

Primary source of truth:

- `database/prisma/schema.prisma`

---

## 2) Tech Stack

- ORM: Prisma
- Database: PostgreSQL
- Client generator: `prisma-client-js`

---

## 3) Core Enums

### `UserRole`

- `ADMIN`
- `INSTRUCTOR`
- `TA`
- `STUDENT`

### `ContestStatus`

- `DRAFT`
- `UPCOMING`
- `ACTIVE`
- `ENDED`

### `ManageLifecycleStatus`

- `DRAFT`
- `ACTIVE`
- `ARCHIVED`
- `DELETED`

Notes:

- `Problem` uses `isDraft` for draft state
- `Contest` uses `ContestStatus.DRAFT`
- `ManageLifecycleStatus` is mostly used as a management lifecycle flag

### `Visibility`

- `PUBLIC`
- `PRIVATE`
- `COURSE_ONLY`

### `AnnouncementScope`

- `PLATFORM`
- `CONTEST`

### `SubmissionStatus`

- `PENDING`
- `ACCEPTED`
- `WRONG_ANSWER`
- `TIME_LIMIT_EXCEEDED`
- `RUNTIME_ERROR`
- `SYSTEM_ERROR`
- `COMPILE_ERROR`

### `CodingLanguage`

- `CPLUSPLUS`
- `JAVA`
- `TYPESCRIPT`
- `JAVASCRIPT`
- `PYTHON`

### `ProblemSource`

- `PRACTICE`
- `CONTEST`
- `BOTH`

### `ExperimentGroup`

- `A`
- `B`
- `C`

### `AssignmentMethod`

- `MANUAL`
- `RANDOM`
- `RATIO_RANDOM`

---

## 4) Domain Overview

### 4.1 Identity and user profile

Core tables:

- `User`
- `UserActivity`
- `Achievement`
- `UserAchievement`

### 4.2 Problem bank

Core tables:

- `Problem`
- `ProblemStarterCode`
- `Topic`

### 4.3 Contest system

Core tables:

- `Contest`
- `ContestProblem`
- `Participation`
- `ProblemStatus`
- `Submission`
- `Announcement`

### 4.4 Practice system

Core tables:

- `PracticeSession`
- `PracticeRunRecord`

### 4.5 Hinting and analytics support

Support tables:

- `Hint`
- `ContestExperimentGroup`
- `ContestProblemSession`

Current note:

- `ContestExperimentGroup` and `ContestProblemSession` are important for instructor analytics, but they are not as central to the main contest request path as `Participation`, `ProblemStatus`, and `Submission`

---

## 5) Table Reference

### 5.1 `User`

Purpose:

- stores login identity, role, profile info, and cumulative student progress

Important fields:

- `id`
- `computingId` `@unique`
- `email` `@unique`
- `firstName`
- `lastName`
- `nickname`
- `studentNumber`
- `role`
- `pointsAcquired`
- `problemsSolved`
- `competitionsParticipated`
- `rank`
- `createdAt`
- `updatedAt`

Main relationships:

- creates contests
- authors announcements
- owns submissions, hints, activities, participations, practice sessions, and contest problem sessions

### 5.2 `PracticeSession`

Purpose:

- one persisted practice workspace per user/problem

Important fields:

- `id`
- `userId`
- `problemId`
- `startedAt`
- `firstRunAt`
- `firstSubmitAt`
- `solvedAt`
- `selectedLang`
- `runCount`
- `submitCount`

Constraints:

- `@@unique([userId, problemId])`

### 5.3 `PracticeRunRecord`

Purpose:

- stores individual practice runs/submissions and AI judging results

Important fields:

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

Indexes:

- `@@index([sessionId, createdAt])`
- `@@index([userId, problemId, createdAt])`
- `@@index([status, updatedAt])`

### 5.4 `Contest`

Purpose:

- stores contest metadata, schedule, visibility, and publishing state

Important fields:

- `id`
- `slug` `@unique`
- `name`
- `description`
- `classSection`
- `type`
- `location`
- `status`
- `manageStatus`
- `visibility`
- `startsAt`
- `endsAt`
- `durationMinutes`
- `participants`
- `published`
- `aiHintEnabled`
- `createdAt`
- `updatedAt`
- `instructorId`

Main relationships:

- linked to contest problems, announcements, submissions, problem statuses, participations, experiment groups, and contest problem sessions

### 5.5 `Problem`

Purpose:

- shared problem bank for both contest and practice

Important fields:

- `id`
- `code` `@unique`
- `judgeProblemId` `@unique`
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
- `timeConstraint`
- `memConstraint`
- `points`
- `source`
- `createdAt`
- `updatedAt`

Main relationships:

- linked to starter code, topics, contest links, submissions, problem statuses, hints, practice sessions, and contest problem sessions

### 5.6 `ProblemStarterCode`

Purpose:

- stores starter code per problem/language

Important fields:

- `id`
- `problemId`
- `language`
- `code`
- `isAiGenerated`
- `generatedFrom`
- `createdAt`
- `updatedAt`

Constraints:

- `@@unique([problemId, language])`

### 5.7 `ContestProblem`

Purpose:

- many-to-many join table between contests and problems

Important fields:

- `contestId`
- `problemId`
- `ordering`

Constraints:

- `@@id([contestId, problemId])`
- `@@unique([contestId, ordering])`

### 5.8 `ContestExperimentGroup`

Purpose:

- stores experiment-group settings for a contest, mainly for analytics/research behavior

Important fields:

- `id`
- `contestId`
- `groupName`
- `aiHintEnabled`
- `hintDelayMinutes`
- `createdAt`
- `updatedAt`

Constraints:

- `@@unique([contestId, groupName])`

### 5.9 `ContestProblemSession`

Purpose:

- per-user per-contest-problem analytics/session record

Important fields:

- `id`
- `userId`
- `contestId`
- `problemId`
- `startedAt`
- `firstRunAt`
- `firstSubmitAt`
- `hintEligibleAt`
- `hintTriggeredAt`
- `solvedAt`
- `selectedLang`
- `solved`

Constraints:

- `@@unique([userId, contestId, problemId])`

Current note:

- this table is important for instructor analytics
- it appears less actively used in the current main student contest flow than `Submission` and `ProblemStatus`

### 5.10 `ProblemStatus`

Purpose:

- per-user per-contest-problem summary used for contest progress and scoreboard calculations

Important fields:

- `userId`
- `contestId`
- `problemId`
- `status`
- `tries`
- `timePenalty`
- `score`

Constraints:

- `@@id([userId, contestId, problemId])`

### 5.11 `UserActivity`

Purpose:

- lightweight activity/event log for dashboard and progress history

Important fields:

- `id`
- `userId`
- `type`
- `name`
- `createdAt`

### 5.12 `Achievement`

Purpose:

- achievement catalog

Important fields:

- `id`
- `code`
- `name`
- `description`
- `icon`
- `xpReward`
- `topicId`

### 5.13 `UserAchievement`

Purpose:

- join table between users and earned achievements

Important fields:

- `userId`
- `achievementId`
- `earnedAt`

Constraints:

- `@@id([userId, achievementId])`

### 5.14 `Topic`

Purpose:

- tags/topics attached to problems

Important fields:

- `id`
- `name`
- `problemId`

Constraints:

- `@@unique([name, problemId])`

### 5.15 `Hint`

Purpose:

- stores generated hint history per user/problem

Important fields:

- `id`
- `userId`
- `problemId`
- `code`
- `feedback`
- `validation`
- `hintNum`
- `createdAt`

### 5.16 `Participation`

Purpose:

- registration and grouping table for users in contests

Important fields:

- `userId`
- `contestId`
- `role`
- `rank`
- `experimentGroup`
- `assignmentMethod`
- `assignedAt`

Constraints:

- `@@id([userId, contestId])`
- `@@index([contestId, experimentGroup])`

Current note:

- student contest registration uses `role = contestant`
- `rank` and `experimentGroup` also support analytics and scoreboard behavior

### 5.17 `Announcement`

Purpose:

- platform-wide or contest-specific announcements

Important fields:

- `id`
- `title`
- `message`
- `scope`
- `createdAt`
- `updatedAt`
- `authorId`
- `contestId`

### 5.18 `Submission`

Purpose:

- stores contest submissions and final judge results

Important fields:

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

Indexes:

- `@@index([contestId, problemId])`
- `@@index([userId, createdAt])`

Current note:

- there is no unique constraint limiting one contest submission per user/problem
- multiple contest submissions per problem are currently allowed

---

## 6) Key Relationships

### 6.1 User-centered

- `User` -> many `Contest` as creator
- `User` -> many `Submission`
- `User` -> many `PracticeSession`
- `User` -> many `Participation`
- `User` -> many `Hint`
- `User` -> many `UserActivity`
- `User` -> many `Announcement`

### 6.2 Problem-centered

- `Problem` -> many `ProblemStarterCode`
- `Problem` -> many `Topic`
- `Problem` -> many `Submission`
- `Problem` -> many `PracticeSession`
- `Problem` -> many `Hint`
- `Problem` <-> many `Contest` through `ContestProblem`

### 6.3 Contest-centered

- `Contest` -> many `ContestProblem`
- `Contest` -> many `Participation`
- `Contest` -> many `ProblemStatus`
- `Contest` -> many `Submission`
- `Contest` -> many `Announcement`
- `Contest` -> many `ContestExperimentGroup`
- `Contest` -> many `ContestProblemSession`

### 6.4 Practice-centered

- `PracticeSession` belongs to one `User`
- `PracticeSession` belongs to one `Problem`
- `PracticeSession` -> many `PracticeRunRecord`

---

## 7) Important Constraints

### Identity and uniqueness

- `User.computingId` is unique
- `User.email` is unique
- `Contest.slug` is unique
- `Problem.code` is unique
- `Problem.judgeProblemId` is unique

### Join-table uniqueness

- one starter-code entry per problem/language
- one contest-problem mapping per contest/problem
- one contest ordering slot per problem position
- one participation row per user/contest
- one `ProblemStatus` row per user/contest/problem
- one `PracticeSession` row per user/problem
- one `ContestProblemSession` row per user/contest/problem
- one `UserAchievement` row per user/achievement

### Lifecycle fields to watch

- `Contest.status`
- `Contest.manageStatus`
- `Contest.visibility`
- `Contest.published`
- `Problem.isDraft`
- `Problem.manageStatus`
- `Problem.source`
- `Submission.status`

---

## 8) Current Caveats

- `Problem` and `Contest` use slightly different draft/lifecycle patterns:
  - problems use `isDraft`
  - contests use `ContestStatus.DRAFT`
  - both also use `manageStatus`
- `ContestProblemSession` and `ContestExperimentGroup` are important for research/analytics, but they are not as fully wired into the current main contest flow as the core contest tables
- `Submission` currently allows repeated submissions for the same contest problem
- `participants` on `Contest` is a stored counter, so it should stay conceptually aligned with `Participation`
- practice and contest share the same `Problem` bank, so visibility and source flags matter a lot:
  - `source = PRACTICE`
  - `source = CONTEST`
  - `source = BOTH`

---

## Suggested Reading Order

If someone is new to the project, a good order is:

1. `User`
2. `Problem`
3. `Contest`
4. `ContestProblem`
5. `Participation`
6. `ProblemStatus`
7. `Submission`
8. `PracticeSession`
9. `PracticeRunRecord`
10. analytics support tables
