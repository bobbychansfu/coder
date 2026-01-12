# Backend Guide

## 1. Project Description

The SFU Judge Codeserver is a **monolithic Node.js/Express backend** designed to orchestrate a coding contest platform. It serves as the central hub connecting:

1.  **Users** (Students, Instructors, Admins) via a web interface.
2.  **Judge Server** (External microservice) for executing and validating user code.
3.  **Database** (PostgreSQL) for persistent storage of users, problems, contests, and results.

The system handles user authentication (CAS/Local), contest lifecycle management, problem curation, submission queuing, and real-time result broadcasting.

## 2. Core Tech Stack

- **Runtime Environment:** Node.js
- **Web Framework:** Express.js (v4.18+)
- **Database:** PostgreSQL
  - **Driver/ORM:** `pg-promise` (Low-level SQL abstraction)
  - **Migrations:** `node-pg-migrate`
- **Real-time Communication:** `socket.io` (v4.5+)
  - Used for pushing submission status updates and AI hints to clients.
- **Authentication:**
  - Primary: CAS (Central Authentication Service) - _assumed based on file names_.
  - Development: Local Password strategy (Session-based).
- **View Engine:** EJS (embedded JavaScript templates) - _Legacy/Server-side rendering, shifting towards JSON API_.

## 3. Project Structure Tree (Core Logic)

This tree highlights the architectural components, excluding dependencies and static assets.

```text
backend/codeserver/
├── index.js                  # Entry Point: Server setup, Socket.io init, Route binding
├── routes/                   # HTTP Request Handlers (Controllers)
│   ├── auth/                 # Authentication logic
│   │   ├── cas-login.js      # CAS specific login flow
│   │   ├── password-login.js # Local dev login flow
│   │   └── logout.js         # Session destruction
│   ├── admin.js              # Admin-specific endpoints
│   ├── instructor.js         # Instructor: Create contests, upload problems
│   ├── student.js            # Student: Join contests, submit code, view status
│   ├── main.js               # Shared/Public: Scoreboards, Judge callbacks
│   ├── middlewares.js        # Auth guards (isStudent, isInstructor, etc.)
│   └── ejs-helpers.js        # View rendering utilities
├── models/                   # Data Access Layer
│   ├── db.js                 # GOD OBJECT: Centralized SQL queries for ALL entities
│   └── enums.js              # Shared constants (User Roles, etc.)
└── migrations/               # Database Schema Version Control
```

## 4. API Routing Overview

The API is segmented by user role, enforced via middleware in `index.js`.

### 4.1 Authentication (`/`, `/login`, `/logout`)

- Manages user sessions.
- Supports dual strategies (CAS for prod, Password for dev).

### 4.2 Student Routes (`/s`)

- **Prefix:** `/s` (Guarded by `isStudent`)
- **Key Endpoints:**
  - `GET /info`: Dashboard data (Enrolled contests, Open contests).
  - `POST /contest/register/:cid`: Enroll in a contest.
  - `GET /contest/unregister/:cid`: Withdraw from a contest.
  - `POST /submit`: (Inferred) Handle code submission to the Judge queue.

### 4.3 Instructor Routes (`/i`)

- **Prefix:** `/i` (Guarded by `isInstructor`)
- **Key Endpoints:**
  - `GET /info`: Instructor dashboard.
  - `GET /contest/create`: Fetch form data for contest creation (problems list).
  - _Note:_ Heavily relies on `models/db.js` for complex joins.

### 4.4 Main / System Routes (`/m`)

- **Prefix:** `/m`
- **Key Functions:**
  - **Scoreboard:** `GET /scoreboard/:cid` - Complex logic calculating ranks, penalties, and scores on-the-fly.
  - **Judge Callbacks:** Endpoints for the external Judge Server to report results back (e.g., `POST /judge_result`).

## 5. Architectural Observations & Logic Analysis

- **Data Access Pattern:** The project uses a **Table Gateway / DAO** pattern implemented in `models/db.js`.
  - _Critique:_ This file acts as a "God Object," containing queries for Users, Problems, Contests, Submissions, and Hints. It creates high coupling and makes maintenance difficult.
- **Business Logic Placement:** Logic is split between `routes/` (Controllers) and `models/db.js`.
  - _Example:_ Scoreboard calculation sits directly in the `routes/main.js` handler, making it hard to test or reuse.
- **Real-time Integration:** Socket.io is initialized in `index.js` but business logic for emitting events (like `io.sockets.emit`) is scattered or passed down via `app.get('socketio')`.

## 6. Roadmap / Development Plan

### Phase 1: Stabilization & Security (Immediate)

- [ ] **Security Audit:** Re-enable and enforce `isJudgeAuthorized` middleware on all Judge Server callback routes (currently flagged as TODO).
- [ ] **Input Validation:** Implement a schema validation library (e.g., `Joi` or `zod`) for all POST bodies, especially contest creation and code submissions.

### Phase 2: Refactoring (Technical Debt)

- [ ] **Decompose `models/db.js`:** Split the massive `helpers` object into domain-specific services:
  - `services/UserService.js`
  - `services/ContestService.js`
  - `services/SubmissionService.js`
- [ ] **Extract Business Logic:** Move heavy logic (like Scoreboard calculation in `routes/main.js`) into `services/ScoreboardService.js`.

### Phase 3: Modernization

- [ ] **API Decoupling:** Fully migrate from EJS rendering to a strict RESTful JSON API to support the standalone Frontend application.
- [ ] **Testing Strategy:** Introduce a testing framework (Jest/Mocha).
  - Unit tests for the new Service layer.
  - Integration tests for API endpoints.
