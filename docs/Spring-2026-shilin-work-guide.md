# Spring 2026 Platform Research and System Guide

Term: Spring 2026
Author: Shilin Mao (Sam)

---

## Personal Work Overview

The Spring 2026 work summarized in this guide focused on the following areas:

- [gamification research](#1-gamification-research-and-product-implications)
- [how participation can be measured](#21-participation-is-represented-through-multiple-dashboard-signals)
- [how participation can be increased](#24-participation-is-increased-through-guidance-not-only-rewards)
- [the advantages and limitations of AI in this educational context](#17-artificial-intelligence-inside-e-learning-systems)
- [how gamification ideas can be applied to this platform](#5-applying-gamification-ideas-to-this-platform)
- [the student dashboard](#4-student-dashboard)
- [the instructor dashboard](#5-instructor-dashboard)
- [the admin dashboard](#6-admin-dashboard)
- [the instructor analysis page](#8-instructor-analysis-page)
- [the instructor analysis data pipeline](#87-backend-structure)
- [the instructor analysis export workflow](#86-export-system)

### Additional Content

- [removal of the TA role](#9-removal-of-the-ta-role)
- [platform extension ideas](#10-platform-extension-ideas)
- [summary](#11-summary)

---

## 1. Gamification Research

The semester began with literature review rather than immediate implementation. The goal of this phase was to understand which gamification mechanisms were educationally useful, which ones were risky, and which ideas could be translated into a programming-learning platform.

### 1.1 Paper 1

**Paper:** Sailer, M., & Homner, L. (2020). *The gamification of learning: A meta-analysis*. *Educational Psychology Review, 32*(1), 77-112.

**Key Word:** Rank

**Advantages:** can raise engagement/participation

**Disadvantages:** may reduce intrinsic motivation for some learners; can create negative pressure

**Original text:**

Competition can cause social pressure to increase learners’ level of engagement and can
have a constructive effect on participation and learning (Burguillo 2010). However, it also has
the potential to either enhance or undermine intrinsic motivation (Rigby and Ryan 2011). In
this context, two types of competition can be distinguished. On the one hand, destructive
competition occurs if succeeding by tearing others down is required, resulting in feelings of
irrelevance and oppression. On the other hand, constructive competition occurs if it is good-
natured and encourages cooperation and mutual support (i.e., if competition is aimed at
improving everyone’s skills instead of defeating someone). In this sense, constructive
competition has the potential to foster feelings of relatedness, thereby enhancing intrinsic
motivation (Rigby and Ryan 2011).

**Additional note from external sources:**

- the meta-analysis reports positive effects of gamification on cognitive, motivational, and behavioral learning outcomes
- it also notes that outcomes depend on design choices and context rather than on simply adding game elements
- one moderator emphasized in the paper is that competition combined with collaboration can be more effective than competition used alone

### 1.2 Paper 2

**Paper:** Ding, L., Er, E., & Orey, M. (2018). *An exploratory study of student engagement in gamified online discussions*. *Computers & Education, 120*, 213-226. https://doi.org/10.1016/j.compedu.2018.02.007

**Key Word:** Leaderboards

**Advantages:** Leaderboards increased students’ awareness of their participation level and encouraged frequent engagement, as students checked them multiple times per week.

**Disadvantages:** Leaderboards may create pressure or demotivation for lower-ranked students, potentially discouraging participation.

**Original text:**

Students reported in the survey that on average they check the progress bar (M = 2.89, SD
= 3.19) and the leader board (M = 2.96, SD = 3.16) three times a week respectively.

**Additional note from external sources:**

- the paper reports that gamified online-discussion design can positively affect engagement
- it also identifies practical obstacles such as technical issues, peer behavior, and instructor workload
- the study is useful because it shows that visible progress signals are repeatedly consulted by students in real use

### 1.3 Paper 3

**Paper:** Buckley, P., & Doyle, E. (2016). *Gamification and student motivation*. *Interactive Learning Environments, 24*(6), 1162-1175. https://doi.org/10.1080/10494820.2014.964263

**Key Word:** number of days

**Advantages:** Very easy to implement, Cheap to compute

**Disadvantages:** Too simple, Cannot tell real effort from noise

**Original text:**

We defined participation as the number of unique days that a student made at least one
trade on the PM.
The data revealed that the participation variable had violated parametric assumptions due to
non-normally distributed data, so a Spearman’s rho test was utilized.
There was a small, positive correlation between intrinsic motivation to know and participation,
r = 0.194, n = 75, p ≤ .05.

**Additional note from external sources:**

- the paper connects gamification to student motivation rather than arguing that gamification automatically improves all outcomes
- it is a useful reminder that simple engagement variables are operationally convenient but conceptually limited

### 1.4 Paper 4

**Paper:** Su, C.-H., & Cheng, C.-H. (2015). *A mobile gamification learning system for improving the learning motivation and achievements*. *Journal of Computer Assisted Learning, 31*(3), 268-286. https://doi.org/10.1111/jcal.12088

**Key Word:** Leaderboard (Ranking by performance)

**Advantages:** Easy to implement with sorting, Makes progress visible

**Disadvantages:** Effect not isolated, Can discourage low-ranked users

**Original text:**

Some of the gamification features, such as leaderboards, badges and missions, are used in
an MGLS to guide students through multiple activities towards the completion of specific
learning objectives.
The students of the experimental group, who used an MGLS, had a better learning
achievement than either of the control groups in the post-test.

**Additional note from external sources:**

- the system studied in the paper combines multiple gamification features inside a structured learning flow
- this matters because the benefit appears to come from integration with learning objectives, not from isolated UI features alone

**Key Word:** Badges

**Advantages:** Increases short-term motivation

**Disadvantages:** Needs careful reward design

**Original text:**

Students collect badges for achievements, and the badges can be redeemed for real-world
rewards, such as gifts.
Students experienced positive learning motivation when using an MGLS and were also
satisfied with its effectiveness.
The learning achievement of the experimental group was higher than either of the two control
groups.

**Additional note from external sources:**

- the paper suggests that badges work best when tied to visible achievement and meaningful activity
- it also suggests that badges are more useful as part of a wider system than as a standalone reward mechanic

### 1.5 Paper 5

**Paper:** Barata, G., Gama, S., Jorge, J., & Gonçalves, D. J. (2013). *Improving participation and learning with gamification*. In *Proceedings of the First International Conference on Gameful Design, Research, and Applications (Gamification ’13)* (pp. 10-17). ACM. https://doi.org/10.1145/2583008.2583010

**Key Word:** Challenges (Task-based Gamification)

**Advantages:** Directly drives participation

**Disadvantages:** Needs careful task design, Too many challenges increase workload

**Original text:**

Challenges were tasks students had to complete to be granted XP and achievements.
There was a significant increase of 133% in challenge posts by student (Mann-Whitney’s U,
p < 0.001).

**Additional note from external sources:**

- the paper is especially useful because it studies gamification in a real course environment
- it reports not only more participation, but also stronger online activity and proactivity over time

### 1.6 Paper 6

**Paper:** Simões, J., Díaz Redondo, R., & Fernández Vilas, A. (2013). *A social gamification framework for a K-6 learning platform*. *Computers in Human Behavior, 29*(2), 345-353. https://doi.org/10.1016/j.chb.2012.06.007

**Key Word:** Social Interaction as Participation

**Advantages:** Encourages platform activity

**Disadvantages:** Social activity != learning, Hard to compare fairly

**Original text:**

Users can share their recent activity, comment friends’ profiles, shared images, photos and
projects.
A way to engage learners in a collaborative production of knowledge is to promote social
rewards.

**Additional note from external sources:**

- the paper presents social gamification as a framework rather than a single mechanic
- this is useful because it shows how participation can be increased through ecosystems of actions, feedback, and lightweight rewards

**Key Word:** No Hard Penalty / Error Tolerance

**Advantages:** Reduces fear of participation

**Disadvantages:** Needs anti-abuse rules, Hard to rank effort

**Original text:**

Consider the failure as part of the learning process… without penalizing the student.
Positive failure feedback lead students to keep trying, raising their level of engagement.

**Additional note from external sources:**

- this paper is one of the clearest supports for treating failure as part of an engagement system rather than only as a negative outcome
- it is especially relevant for educational products where continued effort matters more than one-time correctness

### 1.7 Paper 7

**Paper:** Urh, M., Vukovic, G., Jereb, E., & Pintar, R. (2015). *The model for introduction of gamification into e-learning in higher education*. *Procedia - Social and Behavioral Sciences, 197*, 388-397. https://doi.org/10.1016/j.sbspro.2015.07.154

**Key Word:** Artificial intelligence

**Advantages:** Strong support for future AI features

**Disadvantages:** Complex to implement fully

**Original text:**

Personalization of e-learning should be supported by artificial intelligence.
Artificial intelligence allows professors to find specific actions, patterns, major mistakes and
other behavioural characteristics of students.

**Gamification elements classified in the research notes:**

- Most commonly used: badges, leaderboard, levels, points, progress bar
- Commonly used: avatars, challenges, feedback, key / unlock, rewards, rank, tour / narrative
- Occasionally used: awards, chat, coins, hints / tips, medals, star, timer, trophy, virtual shop

**Additional note from external sources:**

- the paper frames AI as part of a structured e-learning model rather than as an isolated plug-in
- the main implication is that personalization and adaptive interpretation are valuable, but they need clear educational goals and supporting system design

### 1.8 Paper 8

**Paper:** Lyu, W., Wang, Y., Chung, T. (Rachel), Sun, Y., & Zhang, Y. (2024). *Evaluating the effectiveness of LLMs in introductory computer science education: A semester-long field study*.

**Key Word:** Longitudinal field study (real-world, semester-long)

**Advantages:** Strong external validity (real course, long duration)

**Disadvantages:** Engagement signals can be messy in real courses

**Original text:**

we conducted a semester-long, between-subjects study
achieved statistically significant improvements in their final scores

**Additional note from external sources:**

- the semester-long design gives this paper unusual relevance for real educational platforms
- compared with short controlled studies, it offers stronger evidence about how AI support behaves over time in normal classroom use

**Key Word:** Prompt quality correlated with response effectiveness

**Advantages:**

**Disadvantages:** Needs a way to operationalize “prompt quality”  
Correlation doesn’t specify best prompting strategy

**Original text:**

students turned to CodeTutor for different tasks
prompt quality was significantly correlated with CodeTutor’s response effectiveness

**Additional note from external sources:**

- this paper is especially relevant for analytics design because it shows that AI usage should be studied as a behavior pattern, not only as a feature toggle
- it supports building systems that can observe hint use, prompting behavior, and longer-term performance change

---

## 2. Applying the Research to the Platform

The research findings in the previous section were used as design constraints for the platform rather than being treated as background reading only. The main translation from research into product design was to avoid treating engagement as a single number or a single feature. Instead, the platform uses several complementary signals and surfaces.

### 2.1 Participation is represented through multiple dashboard signals

The literature review suggested that participation cannot be reduced to one metric such as rank or active days. That idea was applied by building a student-facing dashboard that combines several kinds of personal signals at the same time.

Examples currently reflected in the student dashboard include:

- **Total Solved** as a direct learning-progress signal
- **Participation** as a contest and submission activity signal
- **Total Score** as a cumulative performance signal
- **Global Rank** as a competition-related signal
- **active days in 7d** as a lightweight recent-engagement signal
- **login streak** as a consistency signal
- **weekly stats** such as problems solved, contests participated, score earned, and time spent
- **badges** as a compact achievement signal

Taken together, these choices apply the research finding that participation is multi-dimensional. The dashboard does not assume that one number is enough to explain how engaged a student is.

### 2.2 Competition is used, but it is not the only motivational structure

The papers on rank and leaderboards suggested that competition can help increase engagement, but can also create pressure, especially for lower-ranked students. That finding was applied by allowing leaderboard-style signals to appear in the platform, while preventing them from becoming the only organizing principle of the student experience.

Examples of this design choice include:

- showing **Global Rank** and **Total Score** as only part of the student summary
- combining rank with **progress-oriented** information such as solved problems and recent activity
- combining rank with **achievement-oriented** information such as badges
- using dashboard cards that balance competition, consistency, and participation

This means the platform still uses competition as a motivational tool, but it is embedded inside a broader progress model rather than standing alone.

### 2.3 Gamification ideas were applied through badges, progress summaries, and next-step guidance

The research suggested that badges, challenges, and visible progress can support motivation when they are used carefully. That was applied to the platform in a form that is lightweight and integrated into the dashboard rather than presented as a separate game layer.

The most visible applications are:

- **badges** shown on the student dashboard as short, recognizable achievement markers
- **weekly summaries** that make progress visible over a recent time window
- **score and solved counts** that show accumulated effort and success
- **contest action states** such as registered, joinable, or upcoming, which turn the dashboard into a guided action surface

In other words, the platform does not gamify by adding decorative effects. It gamifies by turning progress, participation, and achievement into visible structures that encourage continued use.

### 2.4 Participation is increased through guidance, not only rewards

The research also suggested that engagement improves when users are guided toward meaningful next steps. That finding was applied especially strongly in the dashboard work.

Examples include:

- the student dashboard is designed to answer what should be done next
- contest states are made explicit through `Register`, `Registered`, and `Join Now`
- active-contest alerts are used to draw attention to relevant ongoing activity
- the dashboard contest confirmation flow adds a deliberate step before entry or registration

This is an important product application of the research: participation is not increased only through points or rankings, but also through clearer workflow guidance.

### 2.5 Role-specific dashboards are also a research application

The research suggested that the same engagement data should not be shown in the same form to every audience. That idea was applied by separating the platform into role-specific dashboards.

This led to:

- a **student dashboard** centered on personal performance, personal participation, and immediate next actions
- an **instructor dashboard** centered on course-level and contest-level oversight
- an **admin dashboard** centered on platform health, operations, and activity

This separation is part of the research translation, because it treats engagement and performance as context-dependent rather than universally displayed.

### 2.6 AI is treated as both a platform feature and a research variable

The AI-related papers suggested that AI support should not only be added as a convenience feature. It should also be measurable. That idea was applied by connecting hint-related behavior to the instructor analysis system.

This means AI is reflected in the platform in two ways:

- as a student-facing feature through AI-enabled contest structures and hint interactions
- as an instructor-facing analytic object through metrics that describe hint timing and post-hint outcomes

This is an important step beyond simply adding an AI button. It allows the platform to study how AI-related interactions affect learning behavior.

### 2.7 The instructor analysis page is the strongest research-to-product translation

The clearest implementation of the research appears in the instructor analysis page. The literature suggested a need for:

- comparison across conditions or groups
- student-level behavioral metrics
- timing-aware interpretation of intervention effects
- structured export for later review and analysis

Those needs were translated into the current analysis system through:

- **contest comparison**
- **group comparison**
- **student comparison**
- **gamification statistics**
- **AI hint statistics**
- **export in CSV, JSON, and PDF**

The metric set also reflects the research orientation of the page. For each contest, the page includes:

- Solve rate
- Mean solve time
- Median solve time
- Attempts to solve

For each problem/student view, the page includes:

- Time to first submission
- Time to first correct submission
- Post-hint solve probability
- Attempts before hint
- Attempts after hint
- Time to solve after hint

This is the part of the platform where the research most directly becomes a concrete interface.

---

## 3. Platform Context and Role Model

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

#### Personal performance and clear next-step guidance

Student users need:

- personal contest data such as score, rank, and contests already joined
- recent progress tied to the student’s own activity
- activity and engagement signals connected to the student’s own behavior
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

## 4. Student Dashboard

### 4.1 Purpose

The student dashboard is the main student-facing landing page after login. It is designed to answer four immediate questions:

- What contests already belong to this student?
- What contests are visible but not yet joined?
- What has happened recently in the student’s activity?
- What motivational signals or progress summaries are useful right now?

The student dashboard is therefore a hybrid page that combines:

- contest state and contest access logic
- recent summary metadata for motivation and progress

### 4.2 Route structure

The route is:

- `src/app/(app)/dashboard/page.tsx`

The student branch of this route performs a server-side fetch:

- `getStudentContestInfoPayload(user)`

That payload is then transformed by:

- `mapStudentDashboardContests(...)`

The resulting `contestSummary` is passed into:

- `src/fe/dashboard/page/DashboardPage.tsx`

### 4.3 Two distinct data paths

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

### 4.4 What metadata contains

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

### 4.5 Backend inputs for metadata

The metadata repository reads:

- current student totals such as `pointsAcquired`, `problemsSolved`, `competitionsParticipated`
- recent submissions
- recent login activities
- earned achievements
- ranking students
- grouped counts for login frequency, submission frequency, and participation count

This is why the student metadata layer functions as an engagement and progress summary rather than a raw event log.

### 4.6 Contest logic

The student dashboard contest model distinguishes between:

- contests the student has already registered for or participated in
- contests that are visible and open but not yet joined

This distinction is important and must be preserved.

The intended behavior is:

- **`My Contests` includes only contests already registered for or participated in**
- unregistered contests do not appear in `My Contests`
- the dashboard alert for an active contest should only appear if the student is already registered

That distinction was reinforced in the contest confirmation flow.

### 4.7 Contest confirmation flow

The student dashboard now supports confirm-before-continue behavior for contest actions. This affects:

- the dashboard alert
- `My Contests`
- `Upcoming Contests`

The action states include:

- `Register`
- `Registered`
- `Join Now`

The purpose is to avoid immediate action without context and to keep contest membership logic visible to the user.

### 4.8 Rendering and freshness model

The student dashboard is neither fully real-time nor purely static.

It uses:

- server-side render for the contest summary path
- client-side tRPC query for the metadata path
- short-lived caching for dashboard metadata

This is appropriate because:

- contest access is operational and should be correct on first render
- summary metadata can tolerate slight staleness

---

## 5. Instructor Dashboard

### 5.1 Purpose

The instructor dashboard is the instructor-facing operational overview page. It is separate from the instructor analysis page.

Its role is to present:

- current contest status
- upcoming schedule
- authored or owned contest information
- recent announcements
- compact metrics snapshots

### 5.2 Frontend structure

The main page is:

- `src/fe/dashboard/page/InstructorDashboardPage.tsx`

The page renders:

- a statistics section
- `InstructorContestsSection`
- `InstructorAnnouncementsWidget`
- `InstructorMetricsSnapshotWidget`
- a schedule sidebar based on `UpcomingContests`

### 5.3 Current instructor dashboard statistics

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

### 5.4 Other instructor dashboard sections

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

### 5.5 Backend structure

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

### 5.6 Data freshness

The frontend fetch hook uses:

- `trpc.instructorDashboard.get.useQuery(...)`

with:

- `staleTime: 30000`

So the instructor dashboard is a cached operational page, refreshed on a moderate interval rather than a streaming page.

---

## 6. Admin Dashboard

### 6.1 Purpose

The admin dashboard is a platform-operations page rather than a course page. It answers questions about:

- overall user population
- contest operations
- problem-bank scale
- platform activity
- system health

### 6.2 Frontend structure

The main page is:

- `src/fe/dashboard/page/AdminDashboardPage.tsx`

It renders:

- a top statistics section
- `AdminContestOverviewSection`
- `AdminActivityWidget`
- `AdminHealthSnapshotWidget`
- a platform schedule sidebar

### 6.3 Current admin dashboard statistics

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

### 6.4 Other admin dashboard sections

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

### 6.5 Backend structure

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

### 6.6 Freshness model

The frontend hook is:

- `src/fe/dashboard/services/adminDashboard.ts`

It uses:

- `trpc.adminDashboard.get.useQuery(...)`

with:

- `ADMIN_DASHBOARD_STALE_TIME_MS`

So the admin dashboard behaves like a cached real-time overview rather than a precomputed warehouse or a live event stream.

---

## 7. Removal of the TA Role

### 7.1 Why this change was necessary

The repository previously contained active and semi-active traces of a `TA` role across:

- frontend role unions
- route checks
- admin-facing mock or management UI
- login/development access surfaces
- dashboard branching logic

That situation creates inconsistency because one role can appear to exist in some places while being unsupported or partially supported in others.

### 7.2 What was changed

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

### 7.3 Why this was a structural cleanup rather than a cosmetic cleanup

Removing a role affects multiple layers simultaneously:

- type definitions
- navigation capability checks
- route permissions
- UI conditionals
- admin role presentation

For that reason, the work was treated as an authorization and consistency cleanup, not a one-file deletion.

### 7.4 Effect on later work

The cleanup also simplified later implementation by making the role split clearer:

- student dashboard behavior could be student-only
- instructor dashboard and analysis could assume instructor-only behavior
- admin dashboard logic could use admin-only procedures

That cleaner role model reduced ambiguity throughout the platform.

---

## 8. Instructor Analysis Page

### 8.1 Why it exists

After the role cleanup, the instructor side of the platform needed a dedicated analysis page rather than relying only on a general dashboard. The purpose of this page is to support post-contest interpretation of student behavior, group differences, and hint-related outcomes.

It is therefore different from the instructor dashboard:

- the **instructor dashboard** is an operational overview
- the **instructor analysis page** is a deeper analytical surface

### 8.2 Route and page structure

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

### 8.3 Comparison blocks

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

### 8.4 Comparison selectors

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

### 8.5 Other major analysis sections

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

### 8.6 Export system

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

### 8.7 Backend structure

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

### 8.8 Snapshot logic

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

### 8.9 Metric meanings

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

### 8.10 Current implementation vs the earlier analytics design note

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

## 9. Removal of the TA Role

### 9.1 Scope of the change

### 9.2 Why the change mattered

### 9.3 Effects on the role model and platform behavior

---

## 10. Platform Extension Ideas

### 10.1 Future product directions

### 10.2 Future research directions

### 10.3 Future technical directions

---

## 11. Summary

The Spring 2026 work described here pushed the platform in a consistent direction:

- more explicit role separation
- more meaningful student-facing progress signals
- clearer instructor-facing operational and analytical surfaces
- stronger platform-level visibility for admins
- a cleaner active authorization model after removal of the `TA` role

The common thread across these changes is that educational software should not only display data. It should display the **right level of data to the right role**, using signals that are informed by both implementation constraints and educational research.
