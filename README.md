# 🚀 eTech Platform

> ✨ Short project tagline (TBD)

## 🔎 Introduction

A research-driven competitive programming and algorithm practice platform.

**cs-coder** is a full-stack competitive programming platform designed for beginner or advanced computing science students to practice algorithmic problem solving, receive intelligent hints, and track their learning progress over time. The platform supports research studies in areas such as learning analytics, human–computer interaction, and computing science education.

Stack: **Next.js**, **Redis**, **PostgreSQL**, and **Flask**

The platform currently supports:

- Algorithmic problem solving with real-time feedback  
- AI-assisted hint generation and configurable hint-timing logic   
- Instructor Contest and Problem creation

Future Plans:

- Learning analytics dashboards for tracking performance, attempts, and strategy indicators  
- Research instrumentation for controlled studies in competitive programming pedagogy  
- Integration with course workflows, allowing instructors to monitor progress and identify learners who may need additional support  

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
- Frontend setup: `docs/frontend.md`
- Backend setup: `docs/backend.md`
- Workflow and standards: `docs/workflow.md`

Quick links:
<a href="docs/frontend.md"><kbd>Frontend Docs</kbd></a>
<a href="docs/backend.md"><kbd>Backend Docs</kbd></a>
<a href="docs/workflow.md"><kbd>Workflow Docs</kbd></a>

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

---

## 📄 License

MIT License. See `LICENSE`.
