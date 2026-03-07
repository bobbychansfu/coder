# API Endpoints Documentation

## Local Swagger/OpenAPI Preview

1. Start local infrastructure:

```bash
npm run db:up
```

2. Open Swagger UI:
- `http://localhost:${SWAGGER_PORT}` (default `8081`)

3. Source OpenAPI file:
- `docs/backendAPI.yaml`

## 🔐 Authentication & Basics

- `GET /`
  - [cite_start]**Description:** CAS Login entry point or redirect to frontend. [cite: 31]
  - **Params:** `ticket` (query)
- `GET /login/`
  - [cite_start]**Description:** Render password login page (or redirect). [cite: 32]
- `POST /login/`
  - [cite_start]**Description:** Process password-based login. [cite: 33]
  - **Body:** `uname`, `password`
- `GET /logout/`
  - [cite_start]**Description:** Logout the current user. [cite: 33]

---

## 👨‍🎓 Student Endpoints (`/s/`)

### General & Profile

- `GET /s/info`
  - [cite_start]**Description:** Get summary info for student contests. [cite: 51]
- `GET /s/profile`
  - [cite_start]**Description:** Get current user profile details. [cite: 58]
- `POST /s/update_profile`
  - [cite_start]**Description:** Update user profile. [cite: 59]
  - **Body:** `fname`, `lname`, `nickname`
- `GET /s/achievements`
  - [cite_start]**Description:** Get list of user achievements. [cite: 61]
- `GET /s/achievements/:id/icon`
  - [cite_start]**Description:** Get the icon image for a specific achievement. [cite: 61]

### Contest Workflow

- `POST /s/contest/register/:cid`
  - [cite_start]**Description:** Register for a specific contest. [cite: 52]
- `GET /s/contest/unregister/:cid`
  - [cite_start]**Description:** Unregister from a contest. [cite: 52]
- `GET /s/entercontest/:cid`
  - [cite_start]**Description:** Enter contest lobby (Checks registration status). [cite: 53]
- `GET /s/contest/:cid`
  - [cite_start]**Description:** Get contest details and problem statuses. [cite: 55]
- `GET /s/closed/:cid`
  - [cite_start]**Description:** Get info for a closed contest. [cite: 54]

### Problem Solving & Submissions

- `GET /s/problem/:cid/:pid`
  - [cite_start]**Description:** Get details for a specific problem. [cite: 55]
- `POST /s/submit/:cid/:pid`
  - [cite_start]**Description:** **Submit Code**. [cite: 56]
  - **Body:** `filecode` OR `textcode`, `language`, `connection_id`
- `GET /s/submissions/:cid/:pid`
  - [cite_start]**Description:** Get submission history for a specific problem. [cite: 57]
- `GET /s/allsubmissions`
  - [cite_start]**Description:** Get all submissions for the current user. [cite: 58]

### AI Hints

- `POST /s/request_hint`
  - [cite_start]**Description:** Request an AI-generated hint. [cite: 60]
  - **Body:** `pid`
- `GET /s/hints`
  - [cite_start]**Description:** Retrieve hint history for a problem. [cite: 60]
  - **Query:** `computing_id`, `pid`

---

## 👨‍🏫 Instructor Endpoints (`/i/`)

### Dashboard & Contests

- `GET /i/info`
  - [cite_start]**Description:** Get instructor dashboard summary. [cite: 37]
- `GET /i/contests`
  - [cite_start]**Description:** Get list of all contests (Admin/Instructor view). [cite: 40]
- `GET /i/contest/create`
  - [cite_start]**Description:** Get data required to render the create contest form. [cite: 38]
- `POST /i/contest/create`
  - [cite_start]**Description:** Create or update a contest. [cite: 39]
  - **Body:** `name`, `starts_at`, `ends_at`, `published`, `type`, `location`, `newProblems`
- `GET /i/contest/:cid`
  - [cite_start]**Description:** Get contest details for editing. [cite: 42]

### User Management

- `GET /i/adduser`
  - [cite_start]**Description:** Get form data for adding a new user. [cite: 43]
- `POST /i/adduser`
  - [cite_start]**Description:** Add a new user manually. [cite: 44]
  - **Body:** `username`, `password`

### Monitoring & Grading

- `GET /i/problem/:cid/:pid`
  - [cite_start]**Description:** Get problem details (Instructor view). [cite: 40]
- `POST /i/submit/:cid/:pid`
  - [cite_start]**Description:** Submit code (Instructor test run). [cite: 41]
- `GET /i/submissions/:cid/:pid`
  - [cite_start]**Description:** View all student submissions for a problem. [cite: 44]
- `GET /i/allsubmissions`
  - [cite_start]**Description:** View all submissions globally. [cite: 45]

---

## 🤖 System & Judging (`/m/`)

- `POST /m/judge_result`
  - [cite_start]**Description:** Webhook to receive results from the Judge. [cite: 34]
  - **Body:** `sid`, `status`, `judge_output`, `score`
- `GET /m/scoreboard/:cid`
  - [cite_start]**Description:** Get scoreboard data for a contest. [cite: 34]
- `GET /m/submissions`
  - [cite_start]**Description:** Retrieve status for multiple submissions (polling). [cite: 35]
  - **Query:** `sids`
- `POST /m/report_ai_hint`
  - [cite_start]**Description:** Callback to report the result of AI hint generation job. [cite: 36]
  - **Body:** `code`, `feedback`, `validation`, `connection_id`, `is_job_successful`
