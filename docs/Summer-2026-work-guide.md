# Development Timeline

## Overall Strategy
From Week 6 to Week 13, the two developers will first work in parallel on Timer and AI Hint because these two features can be developed independently. After Timer and AI Hint are integrated, the team will implement post-contest upsolve mode, then spend a dedicated week improving dashboard status and navigation around the main learning flow. The Login page already has partial SFU account linking work, so the remaining login/SFU linking work, Signup page, and About page will be completed after the core learning-flow features.

---

## Week 6: Parallel Development of Timer and AI Hint

### Henry: AI Hint
Placement:
- Contest problem page
- Practice problem page
- Shared AI hint component
- AI hint backend service/API

Key elements:
- Build reusable AI hint button/panel.
- Add AI hint to practice page.
- Add AI hint to contest page.
- Add loading, success, and error states.
- Track hint usage.
- Respect contest hint settings.
- Avoid directly revealing full solutions.

Deliverable:
- AI hint works on both contest and practice pages.

### Spencer: Timer
Placement:
- Contest problem page
- Practice problem page
- Shared timer component

Key elements:
- Build reusable timer component.
- Add timer to contest page.
- Add timer to practice page.
- Support normal, warning, and expired states.
- Keep timer correct after page refresh.
- Handle contest expiration behavior.

Deliverable:
- Timer works on both contest and practice pages.

---

## Week 7: Integration Testing and Minimal Dashboard Updates

### Timer and AI Hint Integration
Both Henry and Spencer:
- Test Timer and AI Hint together on contest page.
- Test Timer and AI Hint together on practice page.
- Fix layout or interaction conflicts.
- Make sure timer expiration does not break submissions or hints.
- Make sure AI hints do not interfere with the submission flow.

### Dashboard Updates
Placement:
- Student dashboard
- Instructor dashboard
- Admin dashboard if needed

Key elements:
- Add or update basic dashboard entry points for contest/practice features.
- Add simple links to active contests and practice pages.
- Keep dashboard changes minimal so the week stays focused on integration stability.

Deliverable:
- Timer and AI Hint are stable.
- Dashboard has basic navigation support for the main learning flow.

---

## Week 8: Post-contest Upsolve Mode

Placement:
- Existing contest problem page after the contest ends
- Contest result page
- Submission/history data model and ranking separation

### Henry - Front end
- Reuse the existing contest problem page in upsolve mode after the timer ends.
- Add clear upsolve mode UI state on ended contest problems.
- Show solved, attempted, and unsolved status without changing the official contest result.
- Add navigation from contest result page back to ended contest problems.
- Make submission history distinguish official contest submissions from upsolve submissions.

### Spencer - Back end
- Add backend/data support for upsolve mode.
- Separate upsolve submissions from official contest submissions.
- Provide problem progress/status data.
- Run each upsolve submission through the judge or AI judge.
- Ensure upsolve submissions do not affect official contest ranking.

Key elements:
- Students can continue solving on the original contest problem page after a contest ends.
- Upsolve submissions still run through the judge or AI judge.
- Upsolve submissions are separated from official contest submissions.
- Official contest ranking remains unchanged.
- UI clearly labels after-contest submissions as upsolve/practice attempts.

Deliverable:
- Post-contest upsolve mode works end-to-end on the existing contest problem page.

---

## Week 9: Dashboard Updates and Polish

Placement:
- Student dashboard
- Instructor dashboard
- Admin dashboard if needed
- Contest result page links into dashboard

### Henry
- Add dashboard links to ended contests that support upsolve mode.
- Make student dashboard states clearer for active, ended (upsolve-ready) contests.
- Improve practice and contest entry points.
- Add or polish empty, loading, and error states for dashboard sections.

### Spencer
- Provide dashboard data needed for active, ended, and upsolve-ready contest states.
- Add or update instructor dashboard status summaries if needed.
- Verify dashboard links route to the correct contest/practice pages.
- Keep dashboard data fresh after submissions, contest ending, and upsolve attempts.

Key elements:
- Dashboard supports the main learning flow from practice to contest to upsolve.
- Students can quickly find active contests, practice pages, and ended contests.
- Instructors can see clearer contest/practice status without needing a full analytics rebuild.
- Dashboard polish stays focused on navigation, status clarity, and reliability.

Deliverable:
- Dashboard navigation and status states are clear for active contests, practice work, and post-contest upsolve.

---

## Week 10: Login SFU Linking, Signup, and About Page

Placement:
- Login page
- Existing SFU account linking flow on the Login page
- Signup page
- About page
- Authentication routes/API if needed

### Henry
- Complete the remaining Login page SFU linking UI.
- Signup/about page UI.
- Form layout and validation display.
- User-facing error states.
- About page content/layout.

### Spencer
- Complete the remaining Login page SFU linking logic.
- Signup API integration.
- Role-based redirect and protected route checks.
- Account creation validation.

Key elements:
- Finish the existing SFU account linking work on the Login page.
- Complete signup flow.
- Add or polish about page.
- Validate required fields.
- Redirect users correctly after login.
- Protect restricted pages.

Deliverable:
- Login SFU linking, signup, and about page are completed or polished.

---

## Week 11: Team/Group Selection MVP

Placement:
- Team button and team entry points
- Student-side team/group selection after contest registration
- Instructor-side team/group membership controls
- Team/group membership display
- Contest pages if team/group context affects participation
- Participation/group assignment data and API support

### Henry
- Complete the Team button UI and connect it to the correct team flow.
- Add the student-side team/group selection flow after contest registration.
- Add instructor-facing controls for viewing or adjusting team/group membership.
- Polish team/group membership display.
- Add user-facing empty, loading, and error states for team/group actions.
- Make sure team entry points are easy to find from relevant pages.

### Spencer
- Complete or adjust backend/API support for contest team/group assignment.
- Validate permissions for team/group actions.
- Support student team/group selection after contest registration.
- Support instructor-side membership adjustment through the existing participation/group model.
- Make sure team/group state works correctly with contest participation.
- Add focused tests for the team/group flow.

Key elements:
- Students can choose a team/group after registering for a contest.
- Instructors can manage contest team/group membership from the platform.
- Team/group membership state is clear and reliable.
- Team/group actions have appropriate validation and error handling.
- This is scoped as a usable team/group selection MVP, not full team submissions or team scoreboards.

Deliverable:
- Team/group selection and membership management are brought to a clearly usable MVP state.

---

## Week 12: Secondary Features, Cleanup, and Stabilization

Scoped secondary features:
- Practice completion progress indicator.
- Edit profile button.
- Highest-priority missing Add button workflows.
- Basic contest/practice notification or reminder states.
- Basic instructor-facing analytics polish.
- Empty, loading, and error states for pages touched during Weeks 6-11.

Both Henry and Spencer:
- Fix known bugs from Timer, AI Hint, Dashboard, Upsolve, Login/Signup, and Team/Group Selection.
- Clean up UI inconsistencies.
- Update documentation.
- Add or improve tests around the highest-risk flows.

Deliverable:
- Scoped secondary features are completed, and the main product flow is cleaned up for final QA.

---

## Week 13 and Final Week: Documentation and PR

Both developers:
- End-to-end test contest flow.
- End-to-end test practice flow.
- Test dashboard navigation/status.
- Test timer behavior.
- Test AI hint behavior.
- Test upsolve behavior after contest ends.
- Test login and signup.
- Fix final bugs.
- Update final documentation.
- Prepare final PR and demo.

Deliverable:
- Core features are stable and demo-ready.
- Final documentation and PR are prepared.

---

## Summary Timeline

| Week | Main Work |
|---|---|
| Week 6 | Timer and AI Hint parallel development |
| Week 7 | Integration testing and minimal dashboard updates |
| Week 8 | Post-contest upsolve mode on existing contest pages |
| Week 9 | Dashboard updates and polish |
| Week 10 | Login SFU linking, signup, and about page |
| Week 11 | Team/group selection MVP |
| Week 12 | Secondary features, cleanup, test improvements, and stabilization |
| Week 13 | Documentation, PR, and demo |
