## 1. Upsolve Page

### Ideas:
Build a standalone Upsolve Page after each contest. This page should organize post-contest submissions, solution reports, reflections, and similar problems. It should also connect with competition management features, such as announcements, clarifications, and notifications, so that students can clearly continue learning after the contest ends.

### Key Word:
Upsolving, post-contest learning, reflection, solution report, contest management

### Advantages:
A separate Upsolve Page helps turn contests into a complete learning process instead of a one-time ranking activity. Students can continue solving unfinished problems, improve previous solutions, review explanations, and reflect on why they failed during the contest.

### Disadvantages:
It requires extra backend and frontend work, including a new route, database records for upsolve status, reflection forms, solution reports, and similar-problem recommendations.

### Paper and Original text:
Source 1: Curriculum Design of Competitive Programming: a Contest-based Approach, p. 2:
“Given that contest participants usually pick and solve problems within their reach rather than solving every of them, we emphasize to our students that they are not expected to solve every problem in the contest. Instead, we encourage them to bring unsolved problems back home and upsolve them as homework before the due date."

Source 2: Competitive programming: A teaching methodology analysis applied to first-year programming classes, p. 2:
“When the class, and therefore the contest, ends, the scoreboards is frozen, but the students can still finish the questions outside of the class. The practice of solving the unfinished questions outside of the class environment is called upsolving, which also encloses the practice of redoing the previously done algorithms in a more efficient way."

### Additional note:
The papers support the educational importance of upsolving. However, details such as the missing /upsolve route, incomplete notification feature, and non-real-time clarification tab come from the project’s own implementation and design documentation, not directly from the papers.

## 2. Team Page

### Ideas:
Add a Team Page with a Team model, team routes, team contest participation, and instructor controls for team selection. The platform should support ICPC-style cooperation, where students work in teams, discuss problem-solving strategies, divide tasks, and submit solutions as a group.

### Key Word:
Team contest, cooperative learning, ICPC-style contest, team model, instructor team control

### Advantages:
A Team Page can make the platform closer to real competitive programming environments such as ICPC. It encourages students to learn from each other, improves communication, and allows stronger students to explain solutions while less experienced students still participate.

### Disadvantages:
Team features are more complex than individual practice. The platform needs team creation, team membership, team submissions, team scoreboards, role assignment, and possibly instructor moderation.

### Paper and Original text:
Source: Curriculum Design of Competitive Programming: a Contest-based Approach, pp. 4-5, Section 5.3 Cooperative Learning:
“Given that competitive programming requires extensive tacit skills, we believe group-based cooperative learning can help students to learn from each other."

“To achieve this goal, we designed team contests that require students to work in teams of two or three, mimicking the ICPC contest format."

“To avoid the free rider problem, we require that each team member may solve at most one problem in the contest."

### Additional note:
This source strongly supports the need for Team Page functionality. Since the current project has no Team model or team route, this can be described as a clear future improvement.

## 3. About Page

### Ideas:
Create the About Page. Instead of working mainly as an app shell or redirect page, it should clearly present the platform’s purpose: “learning programming through contests." It should also provide clear entry points such as Start Practice, Join Contest, View Learning Path, and Problem Bank.

### Key Word:
Landing page, motivation, onboarding, navigation, learning through contests

### Advantages:
A About Page helps students understand why the platform exists and how to start using it. Since one major value of competitive programming is increasing motivation, the website should clearly communicate its learning purpose.

### Disadvantages:
This improvement is less directly supported by the papers because the papers discuss educational design, not web landing-page design. Therefore, this point should be presented as a design implication rather than a direct requirement from the literature.

### Paper and Original text:
Source 1: Students Programming Competitions as an Educational Tool and a Motivational Incentive to Students, pp.1: “The author suggests “to consider various forms of student competitions as a way to achieve a number of benefits for their students at a relatively low cost” for information systems (IS) students. He continues in [14] “just the idea of participating in a competition is often enough to increase significantly students motivation level to learn and perform well.”, if one of the value of CP is to increase student motivation, why don’t we clearly state out the learning purpose of this website?


### Additional note:
The papers do not directly say that a website must have buttons like “Start Practice" or “Join Contest." The argument is: if CP is valuable because it motivates students and guides them into contest-based learning, then the Home Page should clearly communicate that value and guide students into the main workflows.

## 4. Learning Path

### Ideas:
Implement a clear Learning Path feature. The platform should not only provide contests and practice problems, but also guide students through topics and levels based on their progress and performance. A standalone Learning Path page could show topic progress, recommended next topics, skill level, and weak areas.

### Key Word:
Learning path, CP1/CP2/CP3, learning objectives, recommendation, progress tracking

### Advantages:
A Learning Path makes the platform feel like a structured educational system rather than only a contest/practice tool. It helps students understand what they have learned, what level they are at, and what they should study next.

### Disadvantages:
A real Learning Path requires more design work. The platform needs topic classification, student progress tracking, difficulty levels, performance analytics, and possibly a recommendation model.

### Paper and Original text:
Source: Curriculum Design of Competitive Programming: a Contest-based Approach, p. 2:
The paper divides Purdue’s CP curriculum into CS 21100, CS 31100, and CS 41100, with different focuses: basic observation skills, expansion of CP1 observation skills and basic techniques, and advanced techniques and implementation practices.

Source: Curriculum Design of Competitive Programming: a Contest-based Approach, p. 2:
“Observation skills reduce a new algorithmic problem to a known problem that can be solved."

“Techniques solve known algorithmic problems efficiently."

“Implementation by coding and debugging builds a solution."

### Additional note:
Luo’s paper does not describe a website learning-path page, but it provides a curriculum structure and learning outcome model. This supports implementing a platform-level Learning Path based on topics, levels, and skill categories.

## 5. Time Pressure

### Ideas:
Strengthen Time Pressure as a core feature of the platform. The platform should more explicitly support timed contests, visible countdowns, penalty-based scoring, post-contest upsolving, and performance analytics under time constraints. When the contest time runs out, the page could automatically switch to Upsolve Mode so students can continue learning without losing the contest-pressure experience.

### Key Word:
Time pressure, timed contest, countdown, penalty, contest mode, upsolve mode

### Advantages:
Time pressure is one of the main differences between competitive programming and ordinary practice. Timed contests train students to read problems quickly, choose solvable problems, implement efficiently, debug under pressure, and manage limited contest time.

### Disadvantages:
Timed contests may increase stress, especially for beginners. The platform should avoid making all practice high-pressure. It should balance timed contests with low-stakes practice and post-contest upsolving.

### Paper and Original text:
Source: Curriculum Design of Competitive Programming: a Contest-based Approach, p. 1:
“While such designs are not without their own merit, we observe that these courses left out the time factor in competitive programming: in a real contest, participants are required to solve problems under demanding time constraints."

Source: Curriculum Design of Competitive Programming: a Contest-based Approach, p. 1:
“Therefore, these contests not only test students, algorithmic knowledge, but also their ability to code efficiently under pressure."

Source: Curriculum Design of Competitive Programming: a Contest-based Approach, p. 2:
“In the end, we decide to adopt a 90-minute contest which fits in most classroom settings with minimal adjustment."

### Additional note:
Without time pressure, the platform risks becoming a general practice website rather than a realistic competitive-programming learning environment. We have an idea is that solve the questions effectively is also important, so we suggest when the time is running out, the web page automatically turns to the upsolve mode.
