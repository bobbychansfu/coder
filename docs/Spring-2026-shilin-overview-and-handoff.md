# Spring 2026 Platform Research and System Guide

Term: Spring 2026  
Prepared for project continuity, technical reference, and supervisor review

---

## Project Scope

This document explains the major Spring 2026 workstreams in this repository at the level of system behavior, implementation structure, and design rationale. It focuses on four connected areas:

- gamification research and the product ideas derived from that research
- the role-specific dashboard system
- the instructor analysis page and its data pipeline
- the removal of the `TA` role from the active application flow

The goal is not to list completed tasks. The goal is to explain how these parts of the system work, why they were built the way they were, and where the important code paths live.

Related repository documentation:

- `README.md`
- `docs/frontend.md`
- `docs/backend.md`
- `docs/workflow.md`
- `docs/system design/analytics section.md`

---

## 1. Platform Context and Role Model

The platform serves three different audiences with different first-screen needs:

- `student`
- `instructor`
- `admin`

The current active role model is defined in:

- `src/lib/authz.ts`

Route-level authorization is enforced through:

- `src/lib/requireRole.ts`
- `src/server/trpc/init.ts`

This role split matters because the dashboard is not treated as a generic homepage. It is treated as the first operational surface after login.

Each role needs different information immediately:

### Student

Student users need:

- personal contest access
- recent progress
- activity and engagement signals
- achievements and badges
- a clear answer to “what should be done next”

### Instructor

Instructor users need:

- contest oversight
- student/course-level summaries
- announcement visibility
- metrics snapshots
- deeper analysis for post-contest interpretation

### Admin

Admin users need:

- platform-wide usage signals
- contest operations status
- user growth and role distribution
- submission throughput
- recent platform-level activity

Because these roles have different decision needs, the platform uses role-specific dashboards instead of one shared dashboard with minor conditional rendering.

The main route that performs role branching is:

- `src/app/(app)/dashboard/page.tsx`

That route sends:

- admins to `AdminDashboardPage`
- instructors to `InstructorDashboardPage`
- students to `DashboardPage`

This is an important architectural decision because role separation happens at the route boundary, not only at the component boundary.

---

## 2. Gamification Research and Product Implications

The semester began with literature review rather than immediate implementation. The purpose of this phase was to determine which gamification mechanisms were educationally useful, which ones were risky, and which signals were realistic to operationalize in the platform.

The notes collected in `Gamification.pdf` point toward a consistent design principle:

**engagement signals are useful, but they should not be reduced to shallow competition or decorative reward mechanics.**

### 2.1 Competition and rank

**Paper:** Sailer, M., & Homner, L. (2020). *The gamification of learning: A meta-analysis*. *Educational Psychology Review, 32*(1), 77-112.

**Key idea recorded in the notes:** rank / competition

**Observed advantages:**

- can increase engagement
- can increase participation

**Observed disadvantages:**

- can reduce intrinsic motivation for some learners
- can create negative pressure

**Design implication for this project:**

Rank is useful as one signal, but should not be the only organizing principle in a student-facing experience. This directly supports the decision to use dashboards that include progress, activity, badges, weekly statistics, and contest state rather than only global rank.

### 2.2 Leaderboards as visibility tools

**Paper:** Ding, L., Er, E., & Orey, M. (2018). *An exploratory study of student engagement in gamified online discussions*. *Computers & Education, 120*, 213-226. https://doi.org/10.1016/j.compedu.2018.02.007

**Key idea recorded in the notes:** leaderboards

**Observed advantages:**

- increase awareness of participation level
- encourage repeated engagement
- are checked frequently by students

**Observed disadvantages:**

- may create pressure for lower-ranked students
- may reduce participation if students feel permanently behind

**Design implication for this project:**

Leaderboard-style feedback is helpful, but must be balanced by other feedback channels. This reinforced the choice to build dashboard metadata around multiple signals instead of only ranking.

### 2.3 Simple engagement metrics such as number of active days

**Paper:** Buckley, P., & Doyle, E. (2016). *Gamification and student motivation*. *Interactive Learning Environments, 24*(6), 1162-1175. https://doi.org/10.1080/10494820.2014.964263

**Key idea recorded in the notes:** number of days

**Observed advantages:**

- easy to implement
- cheap to compute

**Observed disadvantages:**

- too simple to capture real effort
- can confuse signal with noise

**Design implication for this project:**

Simple indicators such as active days, login streaks, and weekly counts are good dashboard components, but they should be treated as lightweight engagement signals rather than direct proxies for learning quality.

### 2.4 Leaderboards and badges inside a mobile learning system

**Paper:** Su, C.-H., & Cheng, C.-H. (2015). *A mobile gamification learning system for improving the learning motivation and achievements*. *Journal of Computer Assisted Learning, 31*(3), 268-286. https://doi.org/10.1111/jcal.12088

**Key ideas recorded in the notes:**

- leaderboard (ranking by performance)
- badges

**Observed advantages of leaderboard-like ranking:**

- easy to implement with sorting
- makes progress visible

**Observed disadvantages of leaderboard-like ranking:**

- effect is not isolated from other gamification features
- can discourage lower-ranked users

**Observed advantages of badges:**

- increase short-term motivation

**Observed disadvantages of badges:**

- need careful reward design

**Design implication for this project:**

Badges are appropriate when framed as progress and recognition, not as superficial decoration. This supports the existence of badges on the student dashboard, but also suggests they should be combined with meaningful context such as recent activity and participation.

### 2.5 Task-based challenges

**Paper:** Barata, G., Gama, S., Jorge, J., & Gonçalves, D. J. (2013). *Improving participation and learning with gamification*. In *Proceedings of the First International Conference on Gameful Design, Research, and Applications (Gamification ’13)* (pp. 10-17). ACM. https://doi.org/10.1145/2583008.2583010

**Key idea recorded in the notes:** challenges / task-based gamification

**Observed advantages:**

- directly drives participation

**Observed disadvantages:**

- needs careful task design
- too many challenges can increase workload

**Design implication for this project:**

Structured participation prompts are promising, but should not overload users. This supports limited, high-signal dashboard prompts rather than constant task pressure.

### 2.6 Social interaction and error tolerance

**Paper:** Simões, J., Díaz Redondo, R., & Fernández Vilas, A. (2013). *A social gamification framework for a K-6 learning platform*. *Computers in Human Behavior, 29*(2), 345-353. https://doi.org/10.1016/j.chb.2012.06.007

**Key ideas recorded in the notes:**

- social interaction as participation
- no hard penalty / error tolerance

**Observed advantages of social interaction:**

- encourages activity on the platform

**Observed disadvantages of social interaction:**

- social activity is not the same thing as learning
- hard to compare fairly

**Observed advantages of error tolerance:**

- reduces fear of participation

**Observed disadvantages of error tolerance:**

- needs anti-abuse rules
- difficult to rank fairly

**Design implication for this project:**

Participation should be encouraged without over-penalizing failure. This supports activity-based summary signals and motivates building learning systems that interpret failed attempts as part of a process, not only as negative outcomes.

### 2.7 Artificial intelligence inside e-learning systems

**Paper:** Urh, M., Vukovic, G., Jereb, E., & Pintar, R. (2015). *The model for introduction of gamification into e-learning in higher education*. *Procedia - Social and Behavioral Sciences, 197*, 388-397. https://doi.org/10.1016/j.sbspro.2015.07.154

**Key idea recorded in the notes:** artificial intelligence

**Observed advantages:**

- strong support for future AI features

**Observed disadvantages:**

- full implementation is complex

**Design implication for this project:**

AI support should be treated as both a user-facing feature and an analytics opportunity. This is directly related to the instructor analysis page, which tracks hint-related behavior and supports interpretation of AI-assisted learning patterns.

### 2.8 Longitudinal, real-world AI study in CS education

**Paper:** Lyu, W., Wang, Y., Chung, T. (Rachel), Sun, Y., & Zhang, Y. (2024). *Evaluating the effectiveness of LLMs in introductory computer science education: A semester-long field study*.

**Key ideas recorded in the notes:**

- longitudinal field study
- prompt quality correlated with response effectiveness

**Observed advantages:**

- strong external validity
- real classroom duration

**Observed disadvantages:**

- engagement signals in real courses can be noisy
- prompt quality is hard to operationalize
- correlation alone does not prescribe a best prompting strategy

**Design implication for this project:**

AI features in an educational coding platform should not be evaluated only through short demos or isolated sessions. They should be measured over time, with attention to hint usage, prompt behavior, contest timing, and student-level differences. That logic strongly supports the existence of an instructor analysis system.

### 2.9 Research-to-product translation

Taken together, the literature supports the following product decisions:

- student-facing feedback should combine progress, activity, and achievement, not only competition
- instructor-facing views should focus on interpretable summaries and behavioral patterns
- AI hint usage should be observable and analyzable
- educational dashboards should support motivation without over-relying on punitive or purely competitive mechanics

Those conclusions directly shaped the dashboard system and the instructor analysis work described below.

---

## 3. Student Dashboard

### 3.1 Purpose

The student dashboard is the main student-facing landing page after login. It is designed to answer four immediate questions:

- What contests already belong to this student?
- What contests are visible but not yet joined?
- What has happened recently in the student’s activity?
- What motivational signals or progress summaries are useful right now?

The student dashboard is therefore a hybrid page that combines:

- contest state and contest access logic
- recent summary metadata for motivation and progress

### 3.2 Route structure

The route is:

- `src/app/(app)/dashboard/page.tsx`

The student branch of this route performs a server-side fetch:

- `getStudentContestInfoPayload(user)`

That payload is then transformed by:

- `mapStudentDashboardContests(...)`

The resulting `contestSummary` is passed into:

- `src/fe/dashboard/page/DashboardPage.tsx`

### 3.3 Two distinct data paths

The student dashboard intentionally uses two separate data paths.

#### Path A: contest summary

This is server-side and role-dependent. It determines:

- `My Contests`
- `Upcoming Contests`
- the active dashboard alert
- action labels such as `Register`, `Registered`, and `Join Now`

This path is based on student contest information, not on generic dashboard UI state.

#### Path B: metadata

This is client-fetched through tRPC using:

- `src/fe/dashboard/services/dashboardMetadata.ts`

That hook calls:

- `trpc.dashboardMetadata.getStudent.useQuery(...)`

with a 30-second `staleTime`.

The server route is:

- `src/server/trpc/routers/dashboardMetadata.ts`

The repository is:

- `src/server/dashboardMetadata/repository.ts`

This path is responsible for the motivational and summary layer rather than contest access itself.

### 3.4 What metadata contains

The student metadata layer currently produces three major frontend sections:

#### A. Statistics

Mapped in:

- `src/fe/dashboard/services/dashboardMetadata.mapper.ts`

The statistics cards currently include:

- **Total Solved**  
  Total number of solved problems, with a subtitle showing active days in the last 7 days.

- **Participation**  
  Number of contests participated in, with a subtitle showing submissions in the last 7 days.

- **Total Score**  
  Accumulated score, with a subtitle showing points rank.

- **Global Rank**  
  Participation-oriented rank, with a subtitle showing login streak days.

#### B. Weekly Stats

The weekly summary currently includes:

- **Problems Solved**
- **Contests Participated**
- **Score Earned**
- **Time Spent**

These are recent-window signals rather than lifetime totals.

#### C. Badges

The page currently surfaces a trimmed set of earned badges, including:

- badge name
- icon
- color
- earned date when available

### 3.5 Backend inputs for metadata

The metadata repository reads:

- current student totals such as `pointsAcquired`, `problemsSolved`, `competitionsParticipated`
- recent submissions
- recent login activities
- earned achievements
- ranking students
- grouped counts for login frequency, submission frequency, and participation count

This is why the student metadata layer functions as an engagement and progress summary rather than a raw event log.

### 3.6 Contest logic

The student dashboard contest model distinguishes between:

- contests the student has already registered for or participated in
- contests that are visible and open but not yet joined

This distinction is important and must be preserved.

The intended behavior is:

- **`My Contests` includes only contests already registered for or participated in**
- unregistered contests do not appear in `My Contests`
- the dashboard alert for an active contest should only appear if the student is already registered

That distinction was reinforced in the contest confirmation flow.

### 3.7 Contest confirmation flow

The student dashboard now supports confirm-before-continue behavior for contest actions. This affects:

- the dashboard alert
- `My Contests`
- `Upcoming Contests`

The action states include:

- `Register`
- `Registered`
- `Join Now`

The purpose is to avoid immediate action without context and to keep contest membership logic visible to the user.

### 3.8 Rendering and freshness model

The student dashboard is neither fully real-time nor purely static.

It uses:

- server-side render for the contest summary path
- client-side tRPC query for the metadata path
- short-lived caching for dashboard metadata

This is appropriate because:

- contest access is operational and should be correct on first render
- summary metadata can tolerate slight staleness

---

## 4. Instructor Dashboard

### 4.1 Purpose

The instructor dashboard is the instructor-facing operational overview page. It is separate from the instructor analysis page.

Its role is to present:

- current contest status
- upcoming schedule
- authored or owned contest information
- recent announcements
- compact metrics snapshots

### 4.2 Frontend structure

The main page is:

- `src/fe/dashboard/page/InstructorDashboardPage.tsx`

The page renders:

- a statistics section
- `InstructorContestsSection`
- `InstructorAnnouncementsWidget`
- `InstructorMetricsSnapshotWidget`
- a schedule sidebar based on `UpcomingContests`

### 4.3 Current instructor dashboard statistics

Mapped in:

- `src/fe/dashboard/services/instructorDashboard.mapper.ts`

The statistics section currently includes:

- **Contests Held**  
  The number of contests associated with the instructor, with a subtitle showing active and upcoming counts.

- **Problems Authored**  
  The number of authored problems or problems connected to instructor-owned contest sets.

- **Students Reached**  
  The number of students reached across instructor-created contests.

- **Last Metrics Sync**  
  A relative timestamp showing how recently the dashboard snapshot was updated.

### 4.4 Other instructor dashboard sections

#### A. Schedule

The schedule sidebar shows:

- contest title
- date
- relative `timeUntil`
- status
- readiness state

The readiness state can be:

- `Ready`
- `Needs Attention`
- `Blocked`

#### B. Contest overview

Each contest summary includes:

- title
- date
- status
- participants
- problems count
- number of assigned experiment groups
- whether AI hints are enabled

#### C. Announcements

The announcements widget shows recent activity items with relative timestamps.

#### D. Snapshot widgets

The snapshot widgets present compact derived summaries intended for quick instructor scanning rather than deep analysis.

### 4.5 Backend structure

The tRPC router is:

- `src/server/trpc/routers/instructorDashboard.ts`

It uses:

- `protectedProcedure`

and then explicitly checks:

- `ctx.user.role === "instructor"`

The repository is:

- `src/server/instructorDashboard/repository.ts`

It loads:

- contests owned by the instructor
- experiment groups
- participations
- problem statuses
- contest problem sessions
- authored problem count
- recent announcements

### 4.6 Data freshness

The frontend fetch hook uses:

- `trpc.instructorDashboard.get.useQuery(...)`

with:

- `staleTime: 30000`

So the instructor dashboard is a cached operational page, refreshed on a moderate interval rather than a streaming page.

---

## 5. Admin Dashboard

### 5.1 Purpose

The admin dashboard is a platform-operations page rather than a course page. It answers questions about:

- overall user population
- contest operations
- problem-bank scale
- platform activity
- system health

### 5.2 Frontend structure

The main page is:

- `src/fe/dashboard/page/AdminDashboardPage.tsx`

It renders:

- a top statistics section
- `AdminContestOverviewSection`
- `AdminActivityWidget`
- `AdminHealthSnapshotWidget`
- a platform schedule sidebar

### 5.3 Current admin dashboard statistics

Mapped in:

- `src/fe/dashboard/services/adminDashboard.mapper.ts`

The statistics section currently includes:

- **Platform Users**  
  Total user count, with subtitle lines summarizing role counts.

- **Contest Operations**  
  Current active contests, with a subtitle showing upcoming contests.

- **Problem Bank**  
  Total authored problems available on the platform.

- **Last Metrics Sync**  
  Relative freshness label, with a subtitle showing submissions in the last 24 hours.

### 5.4 Other admin dashboard sections

#### A. Platform schedule

The schedule sidebar shows upcoming or active platform contests with:

- title
- course code or fallback status label
- date
- time-until label
- readiness state

#### B. Contest overview

Each row includes:

- title
- instructor / owner
- date
- status
- visibility
- participants
- number of problems
- number of announcements
- whether the contest is published

#### C. Activity widget

The activity widget shows recent platform events with relative timestamps.

#### D. Health snapshot widget

This widget summarizes compact operational metrics derived from recent submissions, users, and contests.

### 5.5 Backend structure

The router is:

- `src/server/trpc/routers/adminDashboard.ts`

Unlike the instructor dashboard, this route uses:

- `adminProcedure`

which is defined in:

- `src/server/trpc/init.ts`

This means admin authorization is built into the shared tRPC layer for this route.

The repository is:

- `src/server/adminDashboard/repository.ts`

It constructs a real-time aggregated snapshot containing:

- role counts
- problem bank size
- contest counts
- submissions in the last 24 hours
- submissions in the previous 24 hours
- pending submissions
- accepted submissions in the last 24 hours
- failure submissions in the last 24 hours
- new users in the last 7 days
- new students, instructors, and admins in the last 7 days
- recent contests
- recent announcements
- recent users

The contest query is bounded by:

- `ADMIN_DASHBOARD_CONTEST_LIMIT = 12`

which prevents the dashboard overview from loading an unbounded number of contests for display.

### 5.6 Freshness model

The frontend hook is:

- `src/fe/dashboard/services/adminDashboard.ts`

It uses:

- `trpc.adminDashboard.get.useQuery(...)`

with:

- `ADMIN_DASHBOARD_STALE_TIME_MS`

So the admin dashboard behaves like a cached real-time overview rather than a precomputed warehouse or a live event stream.

---

## 6. Removal of the TA Role

### 6.1 Why this change was necessary

The repository previously contained active and semi-active traces of a `TA` role across:

- frontend role unions
- route checks
- admin-facing mock or management UI
- login/development access surfaces
- dashboard branching logic

That situation creates inconsistency because one role can appear to exist in some places while being unsupported or partially supported in others.

### 6.2 What was changed

The active role model was narrowed to:

- `student`
- `instructor`
- `admin`

This required updates across:

- shared role typing in `src/lib/authz.ts`
- role-aware client helpers
- route guards
- login quick-access flows
- admin user-management UI and mock data

### 6.3 Why this was a structural cleanup rather than a cosmetic cleanup

Removing a role affects multiple layers simultaneously:

- type definitions
- navigation capability checks
- route permissions
- UI conditionals
- admin role presentation

For that reason, the work was treated as an authorization and consistency cleanup, not a one-file deletion.

### 6.4 Effect on later work

The cleanup also simplified later implementation by making the role split clearer:

- student dashboard behavior could be student-only
- instructor dashboard and analysis could assume instructor-only behavior
- admin dashboard logic could use admin-only procedures

That cleaner role model reduced ambiguity throughout the platform.

---

## 7. Instructor Analysis Page

### 7.1 Why it exists

After the role cleanup, the instructor side of the platform needed a dedicated analysis page rather than relying only on a general dashboard. The purpose of this page is to support post-contest interpretation of student behavior, group differences, and hint-related outcomes.

It is therefore different from the instructor dashboard:

- the **instructor dashboard** is an operational overview
- the **instructor analysis page** is a deeper analytical surface

### 7.2 Route and page structure

The main page is:

- `src/fe/instructor/page/ResearchAnalyticsPage.tsx`

This page currently presents several distinct blocks:

- a page header and export action
- a live analytics card
- a contest comparison block
- a group comparison block
- a student comparison block
- a gamification statistics block
- an AI hint statistics block

### 7.3 Comparison blocks

The comparison UI is one of the most important characteristics of the page.

It currently includes three comparison sections:

#### A. Contest Comparison

This compares two contests against each other using four metrics:

- **Solve rate (% solved)**  
  Percentage of problems solved within the selected contest context.

- **Mean solve time**  
  Average time required to solve.

- **Median solve time**  
  Middle solve-time value, used to reduce sensitivity to outliers.

- **Attempts to solve**  
  Average number of attempts needed to solve.

#### B. Group Comparison

This compares two selected groups, potentially across selected contests, using problem-level metrics:

- **Time to first submission**  
  How long it takes before the first submission is made.

- **Time to first correct submission**  
  How long it takes before the first correct solution is submitted.

- **Post-hint solve probability**  
  Probability of eventually solving after a hint has been triggered.

- **Attempts before hint**  
  Number of attempts before the hint was requested or triggered.

- **Attempts after hint**  
  Number of attempts after the hint was requested or triggered.

- **Time to solve after hint**  
  Time elapsed between hint trigger and successful solve.

#### C. Student Comparison

This compares two specific students and combines contest-level and problem-level metrics.

The current comparison rows include:

- Solve rate
- Mean solve time
- Median solve time
- Attempts to solve
- Time to first submission
- Time to first correct submission
- Post-hint solve probability
- Attempts before hint
- Attempts after hint
- Time to solve after hint

### 7.4 Comparison selectors

The page currently supports multiple selector combinations.

The comparison helper logic is defined in:

- `src/fe/instructor/page/researchAnalytics.helpers.ts`

The available selector structures are:

#### Contest comparison selectors

- left contest
- right contest

#### Group comparison selectors

- left contest
- left group
- right contest
- right group

#### Student comparison selectors

- left contest
- left group
- left student
- right contest
- right group
- right student

The group options are currently:

- All Groups
- Group A
- Group B
- Group C

The time-range options used in chart sections are currently:

- Past One Month
- Past One Semester
- Past One Year
- Since Launch

The data file also contains policy and consent options:

- policy version filters
- consent-status filters

These exist as structured options in the research analytics data layer and represent part of the analytics vocabulary even if every selector is not always surfaced in the current visible layout.

### 7.5 Other major analysis sections

#### A. Live instructor analytics card

This section provides a contest/problem data view that resolves into:

- contest-level rows
- ordered problem-level rows

Those rows are also reused by export logic.

#### B. Gamification statistics

This section is rendered using:

- `SolveTimeDistributionCard`

It currently uses a selectable time range and visualizes trend data based on:

- `gamificationTrendsByRange`

The goal is to show broader engagement or performance movement rather than a single static snapshot.

#### C. AI hint statistics

This section is rendered using:

- `HintEngagementTimelineCard`

It also uses a selectable time range and visualizes:

- `aiHintTrendsByRange`

The y-axis label is currently:

- `Overall cohort metric`

This block is intended to expose how hint engagement evolves over time.

### 7.6 Export system

The analysis page supports export through:

- `ExportAnalysisDialog`
- `useResearchAnalyticsExport`

The export dialog allows section-by-section selection. The current selectable export sections are:

- Contest Data
- Problem Data
- Contest Comparison
- Group Comparison
- Student Comparison
- Gamification Statistics
- AI Hint Statistics

The export dialog also supports:

- `Select All`
- individual section selection
- file format selection

The currently supported export formats are:

- `CSV`
- `JSON`
- `PDF`

#### CSV export

CSV export serializes selected sections into tabular text. For the instructor-analysis-specific export utility, it includes:

- snapshot metadata
- contest group metrics
- problem student metrics

For the comparison dashboard export flow, CSV is constructed section by section from the currently selected export blocks.

#### JSON export

JSON export serializes the selected sections into structured JSON objects. This is the best format for downstream scripting or developer inspection.

#### PDF export

PDF export is implemented as a browser print flow:

- it opens a print window
- renders selected sections into simple HTML
- then uses the browser’s print dialog to produce a PDF

This is intentionally presentation-oriented rather than machine-oriented.

### 7.7 Backend structure

The backend route is:

- `src/server/trpc/routers/instructorAnalysis.ts`

It currently:

- requires an authenticated user
- explicitly checks that `ctx.user.role === "instructor"`
- validates input with `contestId`, `problemId`, and `snapshotPreference`

The main repository is:

- `src/server/instructorAnalysis/repository.ts`

The main computation module is:

- `src/server/instructorAnalysis/metrics.ts`

The serializer is:

- `src/server/instructorAnalysis/serializer.ts`

### 7.8 Snapshot logic

The current system supports:

- `latest`
- `preliminary`
- `final`

These preferences resolve to:

- `PRELIMINARY_5M`
- `FINAL_15M`

The repository determines:

- whether a snapshot is ready
- what watermark should be used
- what message should be shown to the instructor
- whether the result should be `NOT_READY`, `DONE`, or `FAILED`

The current implementation computes snapshot rows on request rather than reading from precomputed snapshot tables.

### 7.9 Metric meanings

The page and backend use the following metric definitions.

#### For each contest

- **Solve rate (% solved)**  
  The percentage of expected problem-solving opportunities that ended in a solve.

- **Mean solve time**  
  The arithmetic average of solve durations.

- **Median solve time**  
  The middle solve duration after sorting all valid solve durations.

- **Attempts to solve**  
  The average number of submissions needed before a solve.

#### For each problem / student row

- **Time to first submission**  
  Time from the anchor start to the student’s first submission.

- **Time to first correct submission**  
  Time from the anchor start to the first successful solve.

- **Post-hint solve probability**  
  Whether a solve occurred after a hint interaction, represented as a probability-style metric.

- **Attempts before hint**  
  Number of submissions before hint trigger.

- **Attempts after hint**  
  Number of submissions after hint trigger.

- **Time to solve after hint**  
  Time between hint trigger and successful solve.

### 7.10 Current implementation vs the earlier analytics design note

The repository also contains:

- `docs/system design/analytics section.md`

That document describes a more advanced analytics architecture based on:

- PostgreSQL snapshot tables
- Redis/BullMQ delayed jobs
- SSE-triggered refresh

That document remains useful as a design reference, but it is not the currently merged implementation. The current implementation is simpler:

- request-time snapshot resolution
- request-time metric computation
- frontend comparison and export built on top of that response model

---

## 8. Implementation Pattern Used Across These Features

Several consistent implementation patterns appeared across the dashboard and analysis work.

### 8.1 Start from the user-visible surface

The implementation pattern generally followed this order:

1. define what the page must show
2. identify which role owns that behavior
3. determine what data must exist on first render
4. separate server-loaded operational data from client-fetched summary data when useful
5. add mapper and presentation layers after the data shape is stable

### 8.2 Separate repository, serializer, mapper, and UI responsibilities

Across dashboard and analytics work, responsibilities are split into layers:

- **repository**  
  Reads database state and constructs raw snapshots or aggregates.

- **serializer**  
  Shapes backend data into API responses.

- **service / mapper**  
  Converts backend response types into frontend-friendly view models.

- **page / components**  
  Decide layout, labels, interaction, and visual grouping.

This layered structure is visible most clearly in:

- admin dashboard
- instructor dashboard
- instructor analysis
- student dashboard metadata

### 8.3 Use hybrid rendering where appropriate

The repository does not force every page into one rendering strategy.

Examples:

- student dashboard contest state is server-side because it affects immediate actionability
- student metadata is client-fetched because it is summary-oriented and can tolerate slight staleness
- instructor and admin dashboards use tRPC client queries with stale-time caching
- instructor analysis computes request-time snapshots and presents them through a comparison-oriented frontend

This hybrid strategy keeps the product responsive without pretending everything is real-time streaming.

---

## 9. Main Code Paths

The following paths are the most important entry points for understanding this work.

### Role and auth model

- `src/lib/authz.ts`
- `src/lib/requireRole.ts`
- `src/lib/session.ts`
- `src/server/trpc/init.ts`

### Dashboard route and student dashboard

- `src/app/(app)/dashboard/page.tsx`
- `src/fe/dashboard/page/DashboardPage.tsx`
- `src/fe/dashboard/services/dashboardContests.ts`
- `src/fe/dashboard/services/dashboardMetadata.ts`
- `src/fe/dashboard/services/dashboardMetadata.mapper.ts`
- `src/server/dashboardMetadata/repository.ts`
- `src/server/trpc/routers/dashboardMetadata.ts`
- `src/server/api/s/studentContestInfo.ts`

### Instructor dashboard

- `src/fe/dashboard/page/InstructorDashboardPage.tsx`
- `src/fe/dashboard/services/instructorDashboard.ts`
- `src/fe/dashboard/services/instructorDashboard.mapper.ts`
- `src/server/instructorDashboard/repository.ts`
- `src/server/trpc/routers/instructorDashboard.ts`

### Admin dashboard

- `src/fe/dashboard/page/AdminDashboardPage.tsx`
- `src/fe/dashboard/services/adminDashboard.ts`
- `src/fe/dashboard/services/adminDashboard.mapper.ts`
- `src/server/adminDashboard/repository.ts`
- `src/server/adminDashboard/serializer.ts`
- `src/server/trpc/routers/adminDashboard.ts`

### Instructor analysis

- `src/fe/instructor/page/ResearchAnalyticsPage.tsx`
- `src/fe/instructor/components/ExportAnalysisDialog.tsx`
- `src/fe/instructor/page/researchAnalytics.helpers.ts`
- `src/fe/instructor/page/useResearchAnalyticsExport.ts`
- `src/fe/instructor/data/researchAnalytics.ts`
- `src/lib/types/instructorAnalysis.ts`
- `src/server/instructorAnalysis/metrics.ts`
- `src/server/instructorAnalysis/repository.ts`
- `src/server/instructorAnalysis/serializer.ts`
- `src/server/trpc/routers/instructorAnalysis.ts`

### Reference research artifact

- `Gamification.pdf`

---

## 10. Summary

The Spring 2026 work described here pushed the platform in a consistent direction:

- more explicit role separation
- more meaningful student-facing progress signals
- clearer instructor-facing operational and analytical surfaces
- stronger platform-level visibility for admins
- a cleaner active authorization model after removal of the `TA` role

The common thread across these changes is that educational software should not only display data. It should display the **right level of data to the right role**, using signals that are informed by both implementation constraints and educational research.
