# Backend Local Dev Guide

This project uses a Prisma-first backend workflow:
- Docker for infrastructure (`PostgreSQL` + `Swagger UI`)
- Prisma for schema, migrations, and seeding
- Local app server (`npm run dev`) for backend routes

## 1. Docker Stack Overview

Compose stack name: `coder-dev` (see `docker/docker-compose.yml`).

Services:
- `coder-dev-db` (`postgres:16`): local database
- `coder-dev-swagger` (`swaggerapi/swagger-ui`): API docs UI

Important: the backend API itself is not a Docker service in this repo. It runs from the local Next.js dev server (`npm run dev`) at `http://localhost:3000`.

## 2. Prerequisites

1. Install Docker Desktop and make sure the daemon is running.
2. Install Node.js 20+ and npm.
3. From repository root:

```bash
npm install
```

## 3. Environment Setup

1. Choose the template for the authentication mode you need. Do not use `.env.example`.

For normal local development with quick-access accounts:

```bash
cp .env.dev .env
```

For SFU CAS integration or deployment configuration:

```bash
cp .env.cas .env
```

The templates are bases only. Keep `.env.dev` and `.env.cas` free of real credentials, then replace
their placeholders in the untracked `.env` file.

2. Set database credentials and ports in `.env`:

```env
POSTGRES_DB="judge"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="REPLACE_WITH_A_STRONG_PASSWORD"
DB_PORT="5432"
SWAGGER_PORT="8081"
```

`DATABASE_URL` is optional. If omitted, backend/Prisma derives it from `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_PORT`, and `POSTGRES_DB`.

For local development auth and judging, `.env.dev` includes:

```env
AUTH_MODE="dev"
NEXT_PUBLIC_AUTH_MODE="dev"
SESSION_COOKIE_NAME="session"
DEV_AUTH_COOKIE_SECRET="REPLACE_WITH_A_LONG_RANDOM_SECRET"
JUDGE_URL="http://judge.cmpt.sfu.ca"
JUDGING_MODE="gemini"
GEMINI_API_KEY="REPLACE_WITH_GEMINI_API_KEY"
```

If port `5432` is already used on your machine, change:
- `DB_PORT="5433"`

If you explicitly set `DATABASE_URL`, keep it consistent with the values above.

After switching templates or changing auth variables, restart Next.js. If the old auth mode still
appears, remove the generated build first:

```bash
rm -rf .next
npm run dev
```

## 4. Start Docker Infrastructure

From repo root:

```bash
npm run db:up
```

Check status:

```bash
docker compose --env-file .env -f docker/docker-compose.yml ps
```

Expected:
- Postgres on `localhost:${DB_PORT}`
- Swagger UI on `http://localhost:${SWAGGER_PORT}`

Stop services:

```bash
npm run db:down
```

Reset stack services:

```bash
npm run db:reset
```

## 5. Initialize Prisma Schema + Seed

```bash
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

Useful optional commands:

```bash
npm run prisma:migrate -- --name <change_name>
npm run prisma:push
npm run prisma:studio
```

## 6. Start Local Backend Dev Server

```bash
npm run dev
```

Endpoints:
- App/backend routes: `http://localhost:3000`
- Swagger UI: `http://localhost:${SWAGGER_PORT}` (default `8081`)

Quick health checks:

```bash
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:8081
```

Useful backend route groups now exposed by the Next app:
- Auth: `/api/auth/*`
- Practice submissions: `/api/practice/*`
- Student routes: `/api/s/*`
- Judge/system routes: `/api/judge-callback`, `/api/m/judge_result`, `/api/cron/sync-contest-status`

## 7. Auth Modes

This repo currently supports two auth paths:
- `AUTH_MODE=dev`
  - Local/dev quick-access flow using signed session cookies
  - Backed by `POST /api/auth/dev-login` and `POST /api/auth/dev-signup`
- `AUTH_MODE=cas`
  - SFU CAS login flow through `/api/auth/cas/login` and `/api/auth/cas/callback`
  - With `CAS_VALIDATE_URL` configured, the callback validates tickets directly with SFU
  - The Next server signs and verifies its own CAS session with `CAS_AUTH_COOKIE_SECRET`
  - The external `AUTH_BACKEND_BASE_URL + AUTH_ME_PATH` flow is a compatibility fallback

### 7.1 Current Dev Auth Endpoints

Available in dev mode only:

- `POST /api/auth/dev-login`
  - Body: `{ "email": "sarah.johnson@sfu.ca", "role": "instructor" }`
  - Creates a signed dev session cookie for a configured demo user
- `POST /api/auth/dev-signup`
  - Body: `{ "name": "New Student", "computingId": "abc123", "email": "abc123@sfu.ca" }`
  - Creates a student user and signs them in immediately
- `POST /api/auth/logout`
  - Clears the session cookie

Important:
- Never enable dev auth in production.
- Keep `DEV_AUTH_COOKIE_SECRET` set when `AUTH_MODE=dev`.

### 7.2 Seeded Test Users

From `database/prisma/seed.mjs`, useful local identities are:

- `admin` -> `ADMIN`
- `sjohnson` -> `INSTRUCTOR`
- `mchen` -> `INSTRUCTOR`
- `ewong` -> `INSTRUCTOR`
- `dpatel` -> `TA`
- `student01` (through `student24`) -> `STUDENT`

Note:
- DB roles are uppercase (`ADMIN`, `INSTRUCTOR`, `TA`, `STUDENT`).
- Frontend auth normalizes them to lowercase (`admin`, `instructor`, `ta`, `student`).

### 7.3 Quick CLI Login Test

Use a cookie jar to simulate browser session:

```bash
# Login as instructor (dev-only endpoint)
curl -i -c /tmp/coder-dev.cookies \
  -X POST http://localhost:3000/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah.johnson@sfu.ca","role":"instructor"}'

# Use the session against an app/backend route
curl -i -b /tmp/coder-dev.cookies http://localhost:3000/api/s/info
```

Then open:

- `http://localhost:3000/dashboard`
- `http://localhost:3000/instructor`
- `http://localhost:3000/practice`
- `http://localhost:3000/admin/users` (admin only)

### 7.4 CAS Mode Notes

When running in CAS mode:

1. Start from the CAS template:

   ```bash
   cp .env.cas .env
   ```

2. Confirm `AUTH_MODE="cas"` and `NEXT_PUBLIC_AUTH_MODE="cas"`.
3. Configure the direct SFU CAS flow:
   - `SESSION_COOKIE_NAME`
   - `CAS_AUTH_COOKIE_SECRET`
   - `CAS_LOGIN_BASE_URL`
   - `CAS_VALIDATE_URL`
   - `CAS_SERVICE_URL`
4. Set `CAS_SERVICE_URL` to the exact public HTTPS callback registered with SFU CAS:

   ```env
   CAS_SERVICE_URL="https://coder.cmpt.sfu.ca/api/auth/cas/callback"
   ```

   Login and ticket validation must use this exact same value. Scheme, hostname, port, path, query,
   and trailing-slash differences can cause ticket validation to fail.
5. Replace all secret placeholders in `.env`, then restart/rebuild the app.
6. Use:
   - `GET /api/auth/cas/login`
   - `POST /api/auth/cas/login`
   - `GET /api/auth/cas/callback`

On a successful first login, Coder reads the computing ID returned by SFU CAS and creates a local
`STUDENT` user if no matching database user exists. Existing database roles are preserved.

`AUTH_BACKEND_BASE_URL`, `AUTH_ME_PATH`, and `AUTH_BACKEND_CAS_PATH` support the older external auth
backend fallback. They are not the primary validation path when `CAS_VALIDATE_URL` is configured.

`NEXT_PUBLIC_BACKEND_URL` is the base for the general frontend API client; it does not control where
the browser is sent for SFU CAS login.

## 8. Fresh Machine Bootstrap

### 8.1 Development mode (dev)

```bash
npm install
cp .env.dev .env
# Replace all placeholders before continuing.
npm run db:up
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run dev
```

### 8.2 CAS mode (cas)

```bash
npm install
cp .env.cas .env
# Replace all placeholders and verify CAS_SERVICE_URL before continuing.
npm run db:up
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

Seeding is optional in CAS mode. Unknown authenticated SFU users are provisioned automatically as
students, while instructor and administrator roles must be assigned deliberately.

## 9. Legacy SQL Import (Optional)

If you need to bootstrap from `docker/initdb/judge_full_latest.sql`:

```bash
docker compose --env-file .env -f docker/docker-compose.yml -f docker/docker-compose.sql-import.yml down -v
docker compose --env-file .env -f docker/docker-compose.yml -f docker/docker-compose.sql-import.yml up -d
```

This bypasses Prisma seed and is only for legacy compatibility checks.

## 10. File Map

- Prisma config: `prisma.config.ts`
- Prisma schema: `database/prisma/schema.prisma`
- Prisma migrations: `database/prisma/migrations`
- Prisma seed: `database/prisma/seed.mjs`
- Prisma client singleton: `src/lib/prisma.ts`
- Docker stack: `docker/docker-compose.yml`
- Optional SQL overlay: `docker/docker-compose.sql-import.yml`
- OpenAPI spec: `docs/backendAPI.yaml`
- API summary: `docs/API Doc.md`
- Vercel cron schedule: `vercel.json`
- Next API routes: `src/app/api`
- Practice submission service: `src/server/practice/submissionService.ts`

## 11. Troubleshooting

- `Cannot connect to the Docker daemon`
  - Start Docker Desktop, then rerun `npm run db:up`.
- Prisma `P1010`/access denied during deploy or seed
  - Confirm `.env` credentials are correct.
  - If you set `DATABASE_URL`, ensure it matches your `POSTGRES_*` and `DB_PORT` values.
  - Check Docker service health with `docker compose ... ps`.
- Local Postgres conflict on `5432`
  - Change `DB_PORT` to `5433`, then run `npm run db:down && npm run db:up`.
  - If `DATABASE_URL` is set, update it to port `5433` too.
- Swagger UI does not load on a remote VM
  - `localhost` in your browser usually refers to your own machine, not the VM.
  - Use SSH port forwarding, or open the OpenAPI file directly at `docs/backendAPI.yaml`.
- Judge-related routes fail in practice or contest submission
  - Confirm `JUDGE_URL` is reachable from the machine running the app.
  - For AI practice judging, confirm `GEMINI_API_KEY` is set when `JUDGING_MODE="gemini"`.
- CAS returns to the login page
  - Confirm `CAS_SERVICE_URL` exactly matches the callback registered with SFU and the service value
    used for ticket validation.
  - Confirm `CAS_VALIDATE_URL` and `CAS_AUTH_COOKIE_SECRET` are configured.
  - Restart the app after environment changes; remove `.next` first if an old mode remains compiled.
