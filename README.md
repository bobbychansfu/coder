# 🚀 eTech Platform

> ✨ Short project tagline (TBD)

## 🔎 Introduction

A research-driven competitive programming and algorithm practice platform.

**cs-coder** is a full-stack competitive programming platform designed for beginner or advanced computing science students to practice algorithmic problem solving, receive intelligent hints, and track their learning progress over time. The platform supports research studies in areas such as learning analytics, human–computer interaction, and computing science education.

Stack: **Next.js**, **Redis**, **PostgreSQL**, and **Flask**

The platform currently supports:

- Algorithmic problem solving with real-time feedback  
- AI-assisted hint generation and configurable hint-timing logic   
- Instructor contest and problem creation
- Persisted practice sessions with configurable Gemini or external Judge evaluation
- Instructor research analytics and experiment-group comparisons
- Student contest teams and administrator-managed student groups
- Development, SFU CAS, and administrator-created guest login flows

Future Plans:

- Team-based submissions and scoreboard aggregation
- A guided learning path based on topics, progress, and weak areas
- Deeper course-workflow integration and learner-support notifications

Coder is actively developed as part of ongoing research in competitive programming education, learning trajectories, and data-driven instructional design. It will be used in pilot studies and upper-division CP courses at Simon Fraser University.

---

## 🌍 Environments & Continuous Deployment

This repository uses continuous deployment to publish different branches to different environments (URLs below).

### 🧪 Development (Main)
- Branch: `main` (or `master`)
- URL: TBD

### 🚦 Staging
- Branch: `staging`
- URL: TBD

> 💡 Tip: GitHub “Environments” are often used to represent deploy targets like `development`, `staging`, and `production`.  [oai_citation:1‡GitHub Resources](https://resources.github.com/learn/pathways/automation/essentials/configure-your-deployment-environment/?utm_source=chatgpt.com)

---

## 🧰 Development Setup & Workflow

📌 **Engineering Guide:** please check under `docs/`

This guide covers:
- Frontend setup: `docs/guide/frontend.md`
- Backend setup: `docs/guide/backend.md`
- Workflow and standards: `docs/workflow.md`

Quick links:
<a href="docs/guide/frontend.md"><kbd>Frontend Docs</kbd></a>
<a href="docs/guide/backend.md"><kbd>Backend Docs</kbd></a>
<a href="docs/workflow.md"><kbd>Workflow Docs</kbd></a>

### Practice Judging

Practice submissions use the provider selected by `JUDGING_MODE`, while contest submissions continue to use the external SFU Judge.

- Gemini practice mode requires `JUDGING_MODE=gemini`, `GEMINI_API_KEY`, and optionally `GEMINI_MODEL`.
- External Judge practice mode uses `JUDGING_MODE=judge` and `JUDGE_URL`.
- Practice flow: frontend `POST /api/practice/submissions` -> backend persists student submissions -> the selected provider evaluates them -> the frontend receives normalized results through polling/SSE as applicable.
- Contest flow is independent of `JUDGING_MODE`; it submits mapped contest problems to `JUDGE_URL` and receives results through `/api/judge-callback`.

---

## 🧱 Project Structure

- `src/app`: Next.js routes, layouts, and global styles
- `src/fe`: Front-end modules, components, and feature code
- `src/server/api`: Backend API entry points
- `src/lib`: Shared utilities and services
- `middlewares`: Request/response middleware
- `src/types`: Shared types and interfaces
- `database/prisma`: Database schema, migrations, and seed data
- `docker`: Docker stack files (compose, init SQL, local infra docs)
- `docs`: Project documentation and onboarding notes

---

## 🔐 Default Usernames & Passwords

"data seed xxxx (admin)"

| Email        | Password     | Role                  |
|----------------|--------------|-----------------------|
| admin@sfu.ca | password | ADMIN  |

"data seed xxxx (other roles)"

| Username        | Password     | Role                      |
|----------------|--------------|---------------------------|
| sarah.johnson@sfu.ca   | password   | INSTRUCTOR  |
| dev.patel@sfu.ca   | password   |   TA    |
| amy.01@sfu.ca   | password   | STUDENT    |


---

## 🤝 Contributors

| Name          | Email          |
|-------------- |----------------|
| Bobby Chan    | bobbyc@sfu.ca  |
| Dingsong Zhou | dza68@sfu.ca   |
| Ran Wang      | rwa122@sfu.ca  |
| Shilin Mao    | sma382@sfu.ca  |

---

## 📄 License

MIT License. See `LICENSE`.
