# API Endpoints Documentation

## Local Swagger Preview

1. Start local infrastructure:

```bash
npm run db:up
```

2. Open Swagger UI:
- `http://localhost:${SWAGGER_PORT}` (default `8081`)

3. OpenAPI source of truth:
- `docs/backendAPI.yaml`

4. Run the app if you want to try endpoints against a live server:

```bash
npm run dev
```

Default app URL:
- `http://localhost:3000`

## Notes

- This document is a quick human-readable summary.
- The more complete contract lives in `docs/backendAPI.yaml`.
- Instructor endpoints in Swagger are still marked as planned and may not map to concrete Next.js REST routes yet.

## Authentication (`/api/auth/*`)

- `GET /api/auth/cas/login`
  - Redirects the browser to CAS.
  - Optional query: `next`
- `POST /api/auth/cas/login`
  - Returns a CAS redirect URL in JSON.
  - Optional body: `{ next }`
- `GET /api/auth/cas/callback`
  - Completes CAS login and redirects back into the app.
  - Query: `ticket`, optional `next`
- `POST /api/auth/dev-login`
  - Dev-only login flow.
  - Body: `{ email, role }`
- `POST /api/auth/dev-signup`
  - Dev-only student signup plus login.
  - Body: `{ name, computingId, email, studentNumber? }`
- `POST /api/auth/guest-login`
  - Signs in an active guest account created by an administrator.
  - Body: `{ username, password }`
- `POST /api/auth/logout`
  - Clears the session cookie.

## Practice (`/api/practice/*`)

- `POST /api/practice/submissions`
  - Creates a practice submission.
  - Students get a persisted queued submission.
  - Instructors and admins get an ephemeral judged response without creating practice history.
  - Body: `{ problemId, language, code }`
- `GET /api/practice/submissions/:submissionId`
  - Returns a persisted practice submission for the current student.
- `GET /api/practice/submissions/:submissionId/stream`
  - Streams practice submission updates with Server-Sent Events.

## Student (`/api/s/*`)

### Profile and progress

- `GET /api/s/info`
  - Returns the current user’s contest summary payload.
- `GET /api/s/profile`
  - Returns the current user profile and activity history.
- `POST /api/s/update_profile`
  - Updates the current user profile.
  - Body: `{ fname, lname?, nickname, student_number }`
  - `lname` may be empty; this supports CAS-provisioned and guest users who do not have a stored last name.
- `GET /api/s/achievements`
  - Returns achievements plus topic XP and total XP.
- `GET /api/s/achievements/:id/icon`
  - Returns the stored PNG icon for an achievement.

### Contest workflow

- `POST /api/s/contest/register/:cid`
  - Registers the current user for a contest when registration is open.
- `GET /api/s/contest/unregister/:cid`
  - Unregisters the current user from a contest.
- `GET /api/s/entercontest/:cid`
  - Validates contest state, initializes problem status rows, and enters the contest.
- `GET /api/s/contest/:cid`
  - Returns contest problem status and scoreboard data for the viewer.
- `GET /api/s/closed/:cid`
  - Returns closed-contest info for the viewer.

### Problems and submissions

- `GET /api/s/problem/:cid/:pid`
  - Returns contest problem details, rendered HTML, and downloadable assets.
- `POST /api/s/submit/:cid/:pid`
  - Submits contest code to the judge.
  - Accepts JSON or `multipart/form-data`.
  - Request body supports:
    - `language`
    - `textcode` or `code`
    - `filecode` for multipart uploads
    - optional `connection_id`
- `GET /api/s/submissions/:cid/:pid`
  - Returns submission history for one contest problem.
- `GET /api/s/allsubmissions`
  - Returns all submissions for the current user.

### AI hints

- `POST /api/s/request_hint`
  - Requests an AI-generated hint for a problem.
  - Body must include `pid`
- `GET /api/s/hints?pid=:pid`
  - Returns stored hint history for the current user and problem.

## Instructor (`/api/i/*`)

- These entries are kept here for reference because they still exist in Swagger.
- In this project, many instructor REST endpoints are still planning/design contracts rather than concrete `src/app/api` routes.

### Dashboard and contests

- `GET /api/i/info`
  - Instructor dashboard summary
- `GET /api/i/contests`
  - Instructor/admin contest list
- `GET /api/i/contest/create`
  - Data required to render the contest authoring form
- `POST /api/i/contest/create`
  - Create a contest
  - Planned body includes contest metadata plus selected/new problems
- `GET /api/i/contest/:cid`
  - Contest details for editing
- `PATCH /api/i/contests/:contestId`
  - Partial contest update

### Problems and authoring

- `GET /api/i/problem/:cid/:pid`
  - Problem details for instructor review
- `PATCH /api/i/problems/:problemId`
  - Partial problem update

### Users and submissions

- `GET /api/i/adduser`
  - Form data for adding a user manually
- `POST /api/i/adduser`
  - Add a new user manually
- `POST /api/i/submit/:cid/:pid`
  - Instructor test-run submission
- `GET /api/i/submissions/:cid/:pid`
  - View submissions for a problem
- `GET /api/i/allsubmissions`
  - View all submissions globally

## System and judging

### Admin guest accounts (`/api/admin/*`)

- `GET /api/admin/guest-users`
  - Returns guest accounts for the admin user-management UI.
- `POST /api/admin/guest-users`
  - Creates a guest login and its linked user record.
  - Body: `{ username, firstName, lastName?, password }`

- `POST /api/judge-callback`
  - Main judge webhook.
  - Handles both contest submissions and persisted practice submissions.
  - Body includes `sid`, `status`, `judge_output`, `score`, `connection_id`
- `POST /api/m/judge_result`
  - Legacy alias for `/api/judge-callback`
- `GET /api/cron/sync-contest-status`
  - Protected cron endpoint that syncs contest `status` with wall-clock time.
  - Requires `x-cron-secret` header or `secret` query matching `CRON_SECRET`

## Internal transport

- `GET /api/trpc/:trpc`
- `POST /api/trpc/:trpc`
  - Internal tRPC transport used by the frontend client.
  - Not intended as a normal REST integration surface.

### Current team and group procedures

- `contestTeams.get({ contestId })`
  - Student-only query returning the student's current contest team and eligible registered teammates.
- `contestTeams.create({ contestId, name, memberUserIds })`
  - Student-only mutation that atomically creates a three-person contest team.
- `adminTeams.summary()`
  - Admin-only query returning student grouping and membership data.
- `adminTeams.createGroups(...)`
  - Admin-only mutation for creating general student groups (`contestId = null`).
- `adminTeams.updateMembers(...)`
  - Admin-only mutation for changing group membership.
- `adminTeams.deleteGroups(...)`
  - Admin-only mutation for deleting selected general groups.
- `adminUsers.update(...)` and `adminUsers.delete(...)`
  - Admin-only mutations used by user management.

## Instructor note

- Swagger still contains `/api/i/*` instructor contracts for planning and reference.
- Those entries should be treated as design-time API documentation unless a concrete REST route exists under `src/app/api`.
