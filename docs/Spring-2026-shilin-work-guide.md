# Spring 2026 Platform Research and System Guide

Term: Spring 2026
Author: Shilin Mao (Sam)

---

## Personal Work Overview

The Spring 2026 work summarized in this guide focused on the following areas:

- [gamification research](#1-gamification-research)
- [how participation can be measured](#2-how-participation-can-be-measured)
- [how participation can be increased](#3-how-participation-can-be-increased)
- [the advantages and limitations of AI in this educational context](#4-the-advantages-and-limitations-of-ai-in-this-educational-context)
- [how gamification ideas can be applied to this platform](#5-applying-gamification-ideas-to-this-platform)
- [the student dashboard](#6-student-dashboard)
- [the instructor dashboard](#7-instructor-dashboard)
- [the admin dashboard](#8-admin-dashboard)
- [the instructor analysis page](#9-instructor-analysis-page)
- [the instructor analysis data pipeline](#10-instructor-analysis-data-pipeline)
- [the instructor analysis export workflow](#11-instructor-analysis-export-workflow)

### Additional Content

- [removal of the TA role](#12-removal-of-the-ta-role)
- [platform extension ideas](#13-platform-extension-ideas)
- [summary](#14-summary)

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

## 2. How Participation Can Be Measured

The research notes suggest that participation is measurable, but not by a single universally correct variable. Different papers emphasize different observable proxies.

### 2.1 Visible participation through leaderboard checking

The discussion-study paper by Ding, Er, and Orey shows one way of measuring participation: repeated attention to progress indicators.

The relevant evidence from the notes is:

Students reported in the survey that on average they check the progress bar (M = 2.89, SD
= 3.19) and the leader board (M = 2.96, SD = 3.16) three times a week respectively.

This implies that participation can be partly measured through repeated interaction with visible progress signals.

### 2.2 Participation through number of active days

The Buckley and Doyle paper gives a much simpler operational definition:

We defined participation as the number of unique days that a student made at least one
trade on the PM.
The data revealed that the participation variable had violated parametric assumptions due to
non-normally distributed data, so a Spearman’s rho test was utilized.
There was a small, positive correlation between intrinsic motivation to know and participation,
r = 0.194, n = 75, p ≤ .05.

This is useful because it shows that participation can be measured cheaply, but also that a simple count of active days does not fully describe effort or learning quality.

### 2.3 Participation measurement in this platform

Based on the research above, participation in this platform is treated as a combination of signals rather than one variable. Current platform signals include:

- contest participation
- recent submissions
- active days in the last 7 days
- login streaks
- points and score accumulation
- achievements and badges

These signals appear in the student dashboard through statistics cards, weekly stats, and badge displays.

---

## 3. How Participation Can Be Increased

The papers suggest several different ways to increase participation. Some rely on competition, some on visibility, some on structured tasks, and some on social or low-penalty design.

### 3.1 Competition and rank

The Sailer and Homner meta-analysis suggests that competition can increase engagement and participation, but only when it is constructive rather than destructive.

The note emphasizes that competition can either support or reduce intrinsic motivation, depending on how it is designed.

### 3.2 Leaderboards

The Ding, Er, and Orey paper and the Su and Cheng paper both support the idea that leaderboards can increase engagement by making progress visible.

At the same time, both lines of evidence point to a risk:

- lower-ranked students may feel pressure
- rank alone may not support all learners equally well

### 3.3 Badges

The Su and Cheng paper supports badges as a short-term motivational structure:

Students collect badges for achievements, and the badges can be redeemed for real-world
rewards, such as gifts.
Students experienced positive learning motivation when using an MGLS and were also
satisfied with its effectiveness.
The learning achievement of the experimental group was higher than either of the two control
groups.

This suggests that badges can increase motivation when they are tied to visible achievement.

### 3.4 Challenges

The Barata et al. paper supports task-based challenges as a direct way to drive activity:

Challenges were tasks students had to complete to be granted XP and achievements.
There was a significant increase of 133% in challenge posts by student (Mann-Whitney’s U,
p < 0.001).

This makes challenges a strong participation driver, but also one that can increase workload if used too aggressively.

### 3.5 Social interaction and low-penalty design

The Simões et al. paper contributes two useful participation ideas.

First, social interaction can promote activity:

Users can share their recent activity, comment friends’ profiles, shared images, photos and
projects.
A way to engage learners in a collaborative production of knowledge is to promote social
rewards.

Second, low-penalty design can keep students trying:

Consider the failure as part of the learning process… without penalizing the student.
Positive failure feedback lead students to keep trying, raising their level of engagement.

These ideas are especially useful in educational settings where repeated participation matters more than one isolated success.

---

## 4. The Advantages and Limitations of AI in This Educational Context

Two papers in the research notes are especially relevant here: the Urh et al. paper on introducing gamification into e-learning in higher education, and the 2024 field study on LLM effectiveness in introductory computer science education.

### 4.1 Advantages of AI

From the Urh et al. note:

Personalization of e-learning should be supported by artificial intelligence.
Artificial intelligence allows professors to find specific actions, patterns, major mistakes and
other behavioural characteristics of students.

This supports AI as a way to personalize learning and to reveal useful student behavior patterns.

From the 2024 field-study note:

we conducted a semester-long, between-subjects study
achieved statistically significant improvements in their final scores

This supports the idea that AI assistance can have real value in an authentic course setting.

### 4.2 Limitations of AI

The notes also make the limitations clear.

From the Urh et al. note:

- AI is promising, but full implementation is complex

From the 2024 field-study note:

- engagement signals can be messy in real courses
- prompt quality is difficult to operationalize
- correlation between prompt quality and response effectiveness does not directly yield a best prompting strategy

The relevant research-note lines are:

students turned to CodeTutor for different tasks
prompt quality was significantly correlated with CodeTutor’s response effectiveness

This is useful because it suggests that AI features should be paired with analytics, not only interface design.

### 4.3 AI in this platform

In this platform, AI is relevant in two different ways:

- as a student-facing feature through AI-enabled hint behavior
- as an instructor-facing research variable through hint timing and post-hint metrics

That is why AI belongs not only in product design, but also in the instructor analysis system.

---

## 5. Applying Gamification Ideas to This Platform

The research findings above were used as design constraints rather than left as background reading.

### 5.1 Role-specific design

The platform serves three different audiences with different first-screen needs:

- `student`
- `instructor`
- `admin`

This role split matters because the dashboard is not treated as a generic homepage. It is treated as the first operational surface after login.

The current active role model is defined in:

- `src/lib/authz.ts`

Route-level authorization is enforced through:

- `src/lib/requireRole.ts`
- `src/server/trpc/init.ts`

### 5.2 Student-facing gamification application

The student dashboard applies gamification ideas through:

- score and point visibility
- global rank visibility
- total solved count
- weekly activity summaries
- badges
- clear contest action states
- next-step guidance

This means gamification in the platform is not only decorative. It is embedded into the student’s main operational view.

### 5.3 Instructor-facing application

The instructor-facing application of the research is different. Instead of showing motivation signals for the instructor personally, the platform uses instructor-facing pages to interpret student and contest behavior.

This includes:

- instructor dashboard snapshots
- contest oversight
- the instructor analysis page
- hint-related interpretation
- group and student comparison

### 5.4 Admin-facing application

For admins, the application is even more indirect. The admin dashboard does not use badges or challenge mechanics. Instead, it applies the broader lesson that the right information should be surfaced to the right audience.

This leads to:

- platform-wide user statistics
- contest operations monitoring
- activity snapshots
- recent announcements and recent users

### 5.5 Why this matters for the platform

The research does not translate into one single “gamification feature.” It translates into:

- what is shown to students
- how progress is framed
- how participation is measured
- how AI use is interpreted
- how instructors review outcomes after contests

This is why the research and the implementation belong in the same guide.

---

## 6. Student Dashboard

### 6.1 Purpose

The student dashboard is the main student-facing landing page after login. It is designed to answer four immediate questions:

- What contests already belong to this student?
- What contests are visible but not yet joined?
- What has happened recently in the student’s activity?
- What motivational signals or progress summaries are useful right now?

The student dashboard is therefore a hybrid page that combines:

- contest state and contest access logic
- recent summary metadata for motivation and progress

### 6.2 Route structure

The route is:

- `src/app/(app)/dashboard/page.tsx`

The student branch of this route performs a server-side fetch:

- `getStudentContestInfoPayload(user)`

That payload is then transformed by:

- `mapStudentDashboardContests(...)`

The resulting `contestSummary` is passed into:

- `src/fe/dashboard/page/DashboardPage.tsx`

### 6.3 Two distinct data paths

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

### 6.4 What metadata contains

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

### 6.5 Backend inputs for metadata

The metadata repository reads:

- current student totals such as `pointsAcquired`, `problemsSolved`, `competitionsParticipated`
- recent submissions
- recent login activities
- earned achievements
- ranking students
- grouped counts for login frequency, submission frequency, and participation count

This is why the student metadata layer functions as an engagement and progress summary rather than a raw event log.

### 6.6 Contest logic

The student dashboard contest model distinguishes between:

- contests the student has already registered for or participated in
- contests that are visible and open but not yet joined

This distinction is important and must be preserved.

The intended behavior is:

- **`My Contests` includes only contests already registered for or participated in**
- unregistered contests do not appear in `My Contests`
- the dashboard alert for an active contest should only appear if the student is already registered

That distinction was reinforced in the contest confirmation flow.

### 6.7 Contest confirmation flow

The student dashboard now supports confirm-before-continue behavior for contest actions. This affects:

- the dashboard alert
- `My Contests`
- `Upcoming Contests`

The action states include:

- `Register`
- `Registered`
- `Join Now`

The purpose is to avoid immediate action without context and to keep contest membership logic visible to the user.

### 6.8 Rendering and freshness model

The student dashboard is neither fully real-time nor purely static.

It uses:

- server-side render for the contest summary path
- client-side tRPC query for the metadata path
- short-lived caching for dashboard metadata

This is appropriate because:

- contest access is operational and should be correct on first render
- summary metadata can tolerate slight staleness

---

## 7. Instructor Dashboard

### 7.1 Purpose

The instructor dashboard is the instructor-facing operational overview page. It is separate from the instructor analysis page.

Its role is to present:

- current contest status
- upcoming schedule
- authored or owned contest information
- recent announcements
- compact metrics snapshots

### 7.2 Frontend structure

The main page is:

- `src/fe/dashboard/page/InstructorDashboardPage.tsx`

The page renders:

- a statistics section
- `InstructorContestsSection`
- `InstructorAnnouncementsWidget`
- `InstructorMetricsSnapshotWidget`
- a schedule sidebar based on `UpcomingContests`

### 7.3 Current instructor dashboard statistics

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

### 7.4 Other instructor dashboard sections

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

### 7.5 Backend structure

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

### 7.6 Data freshness

The frontend fetch hook uses:

- `trpc.instructorDashboard.get.useQuery(...)`

with:

- `staleTime: 30000`

So the instructor dashboard is a cached operational page, refreshed on a moderate interval rather than a streaming page.

---

## 8. Admin Dashboard

### 8.1 Purpose

The admin dashboard is a platform-operations page rather than a course page. It answers questions about:

- overall user population
- contest operations
- problem-bank scale
- platform activity
- system health

### 8.2 Frontend structure

The main page is:

- `src/fe/dashboard/page/AdminDashboardPage.tsx`

It renders:

- a top statistics section
- `AdminContestOverviewSection`
- `AdminActivityWidget`
- `AdminHealthSnapshotWidget`
- a platform schedule sidebar

### 8.3 Current admin dashboard statistics

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

### 8.4 Other admin dashboard sections

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

### 8.5 Backend structure

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

### 8.6 Freshness model

The frontend hook is:

- `src/fe/dashboard/services/adminDashboard.ts`

It uses:

- `trpc.adminDashboard.get.useQuery(...)`

with:

- `ADMIN_DASHBOARD_STALE_TIME_MS`

So the admin dashboard behaves like a cached real-time overview rather than a precomputed warehouse or a live event stream.

---

## 9. Instructor Analysis Page

### 9.1 Why it exists

After the role cleanup, the instructor side of the platform needed a dedicated analysis page rather than relying only on a general dashboard. The purpose of this page is to support post-contest interpretation of student behavior, group differences, and hint-related outcomes.

It is therefore different from the instructor dashboard:

- the **instructor dashboard** is an operational overview
- the **instructor analysis page** is a deeper analytical surface

### 9.2 Route and page structure

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

### 9.3 Comparison blocks

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

### 9.4 Comparison selectors

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

### 9.5 Other major analysis sections

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

---

## 10. Instructor Analysis Data Pipeline

### 10.1 Backend structure

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

### 10.2 Snapshot logic

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

### 10.3 Metric meanings

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

### 10.4 Current implementation vs the earlier analytics design note

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

## 11. Instructor Analysis Export Workflow

### 11.1 Export system

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

### 11.2 CSV export

CSV export serializes selected sections into tabular text. For the instructor-analysis-specific export utility, it includes:

- snapshot metadata
- contest group metrics
- problem student metrics

For the comparison dashboard export flow, CSV is constructed section by section from the currently selected export blocks.

### 11.3 JSON export

JSON export serializes the selected sections into structured JSON objects. This is the best format for downstream scripting or developer inspection.

### 11.4 PDF export

PDF export is implemented as a browser print flow:

- it opens a print window
- renders selected sections into simple HTML
- then uses the browser’s print dialog to produce a PDF

This is intentionally presentation-oriented rather than machine-oriented.

---

## 12. Removal of the TA Role

### 12.1 Scope of the change

The removal of the `TA` role was not treated as a single-page cleanup. It affected the active application flow across:

- shared role typing
- authorization helpers
- route-level role checks
- dashboard branching
- admin-facing role presentation
- login and development quick-access flows

The practical goal was to make the active role model internally consistent again.

### 12.2 Why the change mattered

The repository had reached a state where `TA` still appeared in some code paths even though the platform’s core user experience was already centered on three main roles:

- `student`
- `instructor`
- `admin`

That kind of partial role support is risky because it can create contradictory behavior:

- one screen may still expose the role
- another screen may no longer support it
- a route guard may treat it one way while a dashboard branch treats it another way

Removing the role from the active flow made the rest of the platform easier to reason about.

### 12.3 Effects on the role model and platform behavior

After the cleanup, the dashboard system and the role-sensitive parts of the platform became clearer:

- the student dashboard could focus only on student-facing contest and progress behavior
- the instructor dashboard and instructor analysis page could assume instructor-only behavior
- the admin dashboard could stay aligned with explicit admin procedures

This also reduced ambiguity in later feature work, especially when touching:

- `src/lib/authz.ts`
- `src/lib/requireRole.ts`
- `src/server/trpc/init.ts`
- role-aware frontend rendering paths

---

## 13. Platform Extension Ideas

### 13.1 Future product directions

Several product directions follow naturally from the current state of the platform:

- deeper student-facing challenge systems tied to weekly or contest-based goals
- more explicit progress narratives that explain what a student should do next
- richer badge semantics so that badges represent meaningful behavior rather than only counts
- better contest-entry guidance for newly visible but not-yet-joined contests
- expanded instructor-facing comparison views that can explain changes over time, not only snapshot differences

### 13.2 Future research directions

The current analytics system already supports contest-level and problem-level interpretation, but several research directions remain open:

- more systematic study of hint timing and its relationship to eventual solve behavior
- longer-term measurement of whether dashboard signals actually improve student participation
- cleaner comparison of experiment groups across multiple contests rather than one contest at a time
- stronger operational definitions for prompt quality and AI-supported learning behavior
- follow-up validation of whether gamification signals remain useful across a full semester rather than only short windows

### 13.3 Future technical directions

From a technical perspective, the most obvious future directions are:

- moving instructor-analysis snapshot computation toward persisted or background-generated snapshots
- reducing repeated request-time computation for expensive analytics queries
- expanding test coverage around role-sensitive dashboard behavior
- continuing to split oversized data or configuration files into smaller modules
- keeping old branches as reference material only, while re-extracting production work from the latest `main` or student baseline branches

---

## 14. Summary

The Spring 2026 work described here pushed the platform in a consistent direction:

- more explicit role separation
- more meaningful student-facing progress signals
- clearer instructor-facing operational and analytical surfaces
- stronger platform-level visibility for admins
- a cleaner active authorization model after removal of the `TA` role

The common thread across these changes is that educational software should not only display data. It should display the **right level of data to the right role**, using signals that are informed by both implementation constraints and educational research.
