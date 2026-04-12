# Deployment
**How to run the project locally, on a school VM, and in production-like environments**

---

## Table of Contents
1. [Overview](#1-overview)
2. [Runtime Pieces](#2-runtime-pieces)
3. [Environment Variables](#3-environment-variables)
4. [Local Development Setup](#4-local-development-setup)
5. [School VM Notes](#5-school-vm-notes)
6. [Production-like Deployment Notes](#6-production-like-deployment-notes)
7. [Cron and Background Behavior](#7-cron-and-background-behavior)
8. [Swagger / OpenAPI](#8-swagger--openapi)
9. [Common Troubleshooting](#9-common-troubleshooting)

---

## 1) Overview

The project is deployed as a **Next.js application** with:

- a PostgreSQL database
- Prisma migrations
- Next App Router pages and API routes
- optional Swagger UI in Docker
- external judge integrations for contest hints/submissions
- optional Gemini-backed judging for practice

In the current project, the most common environments are:

- local development on a laptop/desktop
- school VM development
- production-like hosting with Vercel-style cron support

---

## 2) Runtime Pieces

### 2.1 Main application

- runs with `npm run dev` for development
- runs with `npm run build` + `npm run start` for a production-style Node process

Default app URL:

- `http://localhost:3000`

### 2.2 Database

- PostgreSQL is expected as the system of record
- local Docker setup is provided under `docker/docker-compose.yml`
- Prisma migrations are the intended schema management path

### 2.3 Swagger UI

- optional Docker service
- serves the OpenAPI spec from `docs/backendAPI.yaml`

### 2.4 External services

- contest submissions and hint requests use `JUDGE_URL`
- practice judging can use Gemini through `JUDGING_MODE="gemini"`

---

## 3) Environment Variables

The repo includes `.env.example` and expects a root `.env`.

Important variables:

### Database and local tooling

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DB_PORT`
- `DATABASE_URL`
- `SWAGGER_PORT`

### Auth

- `NEXT_PUBLIC_AUTH_MODE`
- `AUTH_MODE`
- `SESSION_COOKIE_NAME`
- `DEV_AUTH_COOKIE_SECRET`
- `AUTH_BACKEND_BASE_URL`
- `AUTH_ME_PATH`
- `AUTH_BACKEND_CAS_PATH`
- `CAS_LOGIN_BASE_URL`
- `NEXT_PUBLIC_BACKEND_URL`

### Judging and AI

- `JUDGE_URL`
- `JUDGING_MODE`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

### System / cron

- `CRON_SECRET`

### Current note

For local development in this repo, the common default pattern is:

- `AUTH_MODE="dev"`
- `NEXT_PUBLIC_AUTH_MODE="dev"`
- `NEXT_PUBLIC_BACKEND_URL="http://localhost:3000/api"`
- `AUTH_BACKEND_BASE_URL="http://localhost:3000"`

---

## 4) Local Development Setup

### 4.1 Recommended local flow

1. Create `.env` from `.env.example`.
2. Start Docker services:

```bash
npm run db:up
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Apply migrations:

```bash
npm run prisma:deploy
```

5. Seed sample data:

```bash
npm run prisma:seed
```

6. Start the app:

```bash
npm run dev
```

### 4.2 Useful local URLs

- app: `http://localhost:3000`
- Swagger UI: `http://localhost:${SWAGGER_PORT}` (default `8081`)

### 4.3 Useful local scripts

- `npm run db:up`
- `npm run db:down`
- `npm run db:reset`
- `npm run db:logs`
- `npm run prisma:generate`
- `npm run prisma:deploy`
- `npm run prisma:seed`
- `npm run prisma:studio`
- `npm run openapi:up`
- `npm run openapi:down`

### 4.4 Production-style local start

If you want to test the built app:

```bash
npm run build
npm run start
```

---

## 5) School VM Notes

School VM usage is a little different from local laptop development.

### 5.1 Common reality on the VM

You may have:

- the app running on the VM
- no Docker installed
- no browser directly running on the VM

That means:

- `localhost` in your own browser usually refers to your own machine, not the VM
- Swagger on `localhost:8081` only works if the Swagger container is actually running on the VM

### 5.2 Recommended VM workflow

If Docker is available on the VM:

1. start DB/Swagger with `npm run db:up`
2. run migrations and seed
3. start the app with `npm run dev`
4. use SSH port forwarding from your laptop

Example:

```bash
ssh -L 3000:127.0.0.1:3000 <vm-login>
ssh -L 8081:127.0.0.1:8081 <vm-login>
```

Then open:

- `http://localhost:3000`
- `http://localhost:8081`

### 5.3 If Docker is not available on the VM

You can still run the Next app, but:

- the Docker-based Postgres setup will not be available
- the Docker-based Swagger UI will not be available

In that case, you usually need:

- an already available database
- or a different DB service provisioned on the VM

### 5.4 VM caveat for Swagger

The current Swagger workflow in this repo depends on Docker compose. Without Docker, the YAML still exists, but the Swagger website itself does not automatically exist on the VM.

---

## 6) Production-like Deployment Notes

### 6.1 Application shape

The app is currently structured well for deployment as:

- a Next.js server
- backed by PostgreSQL
- with environment-based auth configuration

### 6.2 Production-mode auth expectations

In a production-like environment, auth is expected to use:

- `AUTH_MODE="cas"`
- `NEXT_PUBLIC_AUTH_MODE="cas"`

And to have:

- `AUTH_BACKEND_BASE_URL`
- `AUTH_BACKEND_CAS_PATH`
- `CAS_LOGIN_BASE_URL`
- `SESSION_COOKIE_NAME`

configured correctly.

### 6.3 Build/start commands

Typical production-style commands:

```bash
npm run prisma:deploy
npm run build
npm run start
```

### 6.4 Judge dependency

Contest features depend on `JUDGE_URL` being reachable from the deployed app.

That affects:

- contest submission
- contest hint requests

Practice judging may additionally depend on:

- `JUDGING_MODE`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

---

## 7) Cron and Background Behavior

The repo includes:

- `vercel.json`

Current cron configuration:

- `GET /api/cron/sync-contest-status`
- schedule: every minute

Purpose:

- keep stored contest status aligned with wall-clock schedule

Security:

- the route requires `CRON_SECRET`
- callers must provide it through `x-cron-secret` or `secret`

Current note:

- this is the only explicit scheduled system behavior wired in the repo today
- analytics does not currently have its own job queue or snapshot scheduler

---

## 8) Swagger / OpenAPI

### 8.1 Spec location

- `docs/backendAPI.yaml`

### 8.2 Local UI

Start only Swagger:

```bash
npm run openapi:up
```

Stop Swagger:

```bash
npm run openapi:down
```

Or start everything through:

```bash
npm run db:up
```

### 8.3 Port

Swagger UI uses:

- `SWAGGER_PORT`

Default:

- `8081`

---

## 9) Common Troubleshooting

### App starts but routes fail

Check:

- `NEXT_PUBLIC_BACKEND_URL`
- `AUTH_BACKEND_BASE_URL`
- `DATABASE_URL`

### Login page works but session is not recognized

Check:

- `AUTH_MODE`
- `SESSION_COOKIE_NAME`
- `DEV_AUTH_COOKIE_SECRET`
- whether the session cookie is actually being set

### CAS login fails

Check:

- `AUTH_MODE="cas"`
- `AUTH_BACKEND_BASE_URL`
- `AUTH_BACKEND_CAS_PATH`
- `CAS_LOGIN_BASE_URL`
- whether the backend auth service is reachable from the app host

### Contest submit or hint requests fail

Check:

- `JUDGE_URL`
- network reachability to the judge
- whether the problem has a valid judge mapping

### Practice judging fails

Check:

- `JUDGING_MODE`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

### Swagger does not open

Check:

- Docker is installed and running
- `npm run db:up` or `npm run openapi:up` succeeded
- `SWAGGER_PORT` is not already occupied

### Port already in use

Common fixes:

- change `DB_PORT` if local Postgres is already using `5432`
- change `SWAGGER_PORT` if `8081` is already taken
- if you change DB port manually, also keep `DATABASE_URL` consistent
