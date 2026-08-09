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

The repo uses two base environment templates and expects the selected configuration at root `.env`:

- `.env.dev` for local development and quick-access authentication
- `.env.cas` for SFU CAS and VM/production-like deployment

Do not use `.env.example`. Copy the appropriate base before starting the app:

```bash
# Local development
cp .env.dev .env

# SFU CAS / deployed VM
cp .env.cas .env
```

The templates contain placeholders only. Replace passwords, cookie-signing secrets, API keys,
and other credentials in the untracked `.env`, and never commit that file.

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
- `GUEST_AUTH_COOKIE_SECRET`
- `CAS_AUTH_COOKIE_SECRET`
- `AUTH_BACKEND_BASE_URL`
- `AUTH_ME_PATH`
- `AUTH_BACKEND_CAS_PATH`
- `CAS_LOGIN_BASE_URL`
- `CAS_VALIDATE_URL`
- `CAS_SERVICE_URL`
- `NEXT_PUBLIC_BACKEND_URL`

### Judging and AI

- `JUDGE_URL`
- `AI_HINT_URL`
- `JUDGING_MODE`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

### System / cron

- `CRON_SECRET`

### Current note

For local development, start from `.env.dev`. Its auth settings should be:

- `AUTH_MODE="dev"`
- `NEXT_PUBLIC_AUTH_MODE="dev"`
- `NEXT_PUBLIC_BACKEND_URL="http://localhost:3000/api"`
- `AUTH_BACKEND_BASE_URL="http://localhost:3000"`

For the deployed VM, start from `.env.cas`. Its auth settings should include:

- `AUTH_MODE="cas"`
- `NEXT_PUBLIC_AUTH_MODE="cas"`
- `CAS_LOGIN_BASE_URL="https://cas.sfu.ca/cas/login"`
- `CAS_VALIDATE_URL="https://cas.sfu.ca/cas/serviceValidate"`
- `CAS_SERVICE_URL` set to the exact public HTTPS callback registered with SFU
- a strong, deployment-specific `CAS_AUTH_COOKIE_SECRET`

`NEXT_PUBLIC_BACKEND_URL` controls the general frontend API client. It does not control the SFU CAS
login or validation destination.

---

## 4) Local Development Setup

### 4.1 Recommended local flow

1. Create `.env` from the development base:

```bash
cp .env.dev .env
```

2. Replace the placeholder database password, cookie secrets, and any API keys in `.env`.
3. Install dependencies and start Docker services:

```bash
npm install
npm run db:up
```

4. Generate the Prisma client:

```bash
npm run prisma:generate
```

5. Apply migrations:

```bash
npm run prisma:deploy
```

6. Seed sample data:

```bash
npm run prisma:seed
```

7. Start the development server:

```bash
npm run dev
```

After changing environment variables, stop the running server and restart it. If the old mode remains
in generated output, rebuild the development cache:

```bash
rm -rf .next
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

For the deployed Coder VM, use `.env.cas`, not `.env.dev`:

```bash
cp .env.cas .env
```

Replace all placeholders in `.env`, especially database credentials, `CAS_AUTH_COOKIE_SECRET`,
`CAS_SERVICE_URL`, judge URLs, API keys, and `CRON_SECRET`.

For a production-style VM process:

```bash
npm install
npm run prisma:generate
npm run prisma:deploy
rm -rf .next
npm run build
npm run start
```

Do not run `npm run dev` after `npm run build` for a deployed process. `npm run dev` creates and uses a
separate development build. Use `npm run start` to run the production build.

If Docker is available and this VM owns its database, start DB/Swagger with `npm run db:up` before
deploying migrations. Seeding is optional and normally should not be repeated on an existing VM.

For temporary development access over SSH, port forwarding is still available:

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

### 5.5 Running the VM app with PM2

After a successful production build, start one PM2 process:

```bash
pm2 start npm --name coder -- start
pm2 save
```

For later deployments, rebuild first and then restart the existing process with the current `.env`:

```bash
npm run prisma:generate
npm run prisma:deploy
rm -rf .next
npm run build
pm2 restart coder --update-env
```

Check the process and logs with:

```bash
pm2 list
pm2 logs coder
```

Do not run `pm2 start ...` repeatedly for an existing app name; doing so can create duplicate Coder
processes and port conflicts. Use `pm2 restart coder --update-env` after the first setup.

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

- `CAS_AUTH_COOKIE_SECRET`
- `CAS_LOGIN_BASE_URL`
- `CAS_VALIDATE_URL`
- `CAS_SERVICE_URL`
- `SESSION_COOKIE_NAME`

configured correctly.

With `CAS_VALIDATE_URL` configured, the Next callback validates the ticket directly with SFU,
automatically provisions an unknown computing ID as a local `STUDENT`, and signs a local CAS session.
Existing database roles are preserved.

`AUTH_BACKEND_BASE_URL`, `AUTH_BACKEND_CAS_PATH`, and `AUTH_ME_PATH` are compatibility settings for
the older external auth-backend fallback. They are not the primary SFU validation path in `.env.cas`.

### 6.3 Build/start commands

Typical production-style commands:

```bash
npm install
npm run prisma:generate
npm run prisma:deploy
rm -rf .next
npm run build
npm run start
```

The build must complete successfully before replacing or restarting the running production process.

### 6.4 Judge dependency

Contest features depend on `JUDGE_URL` being reachable from the deployed app.

That affects:

- contest submission
- contest hint requests

AI hints use `AI_HINT_URL` when it is set; otherwise they fall back to `JUDGE_URL` and append
`/request_hint`. Both URLs must be reachable from the machine running Coder. Do not use `127.0.0.1`
unless the corresponding judge service runs on the same VM.

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
- `CAS_AUTH_COOKIE_SECRET` in CAS mode
- whether the session cookie is actually being set

### CAS login fails

Check:

- `AUTH_MODE="cas"`
- `NEXT_PUBLIC_AUTH_MODE="cas"`
- `CAS_LOGIN_BASE_URL`
- `CAS_VALIDATE_URL`
- `CAS_AUTH_COOKIE_SECRET`
- `CAS_SERVICE_URL` exactly matches the callback registered with SFU
- login and ticket validation use the exact same `CAS_SERVICE_URL`
- the app was restarted after `.env` changed

If the old auth configuration is still active:

```bash
rm -rf .next
npm run build
pm2 restart coder --update-env
```

### Contest submit or hint requests fail

Check:

- `JUDGE_URL`
- `AI_HINT_URL` for `/request_hint`
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
