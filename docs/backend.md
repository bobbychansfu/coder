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

1. Copy env template:

```bash
cp .env.example .env
```

2. Set database and ports in `.env`:

```env
POSTGRES_DB="judge"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="REPLACE_WITH_A_STRONG_PASSWORD"
DB_PORT="5432"
SWAGGER_PORT="8081"
```

`DATABASE_URL` is optional. If omitted, backend/Prisma derives it from `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_PORT`, and `POSTGRES_DB`.

If port `5432` is already used on your machine, change:
- `DB_PORT="5433"`

If you explicitly set `DATABASE_URL`, keep it consistent with the values above.

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

## 7. Local Dev Login (Temporary, Pre-CAS)

Until CAS is integrated, use a dev-only login flow so RBAC, middleware, and page guards can be tested locally.

### 7.1 Suggested Dev Auth Endpoints

Implement these backend endpoints in dev mode only (for example, behind `DEV_AUTH_ENABLED=true`):

- `POST /auth/dev/login`
  - Body: `{ "computingId": "admin" }`
  - Behavior:
    - Find `User` by `computingId`
    - Create session
    - Set `HttpOnly` session cookie
    - Return current user profile (`id`, `computingId`, `role`)
- `GET /me`
  - Reads session cookie
  - Returns current user (`id`, `role`, etc.) or `401`
- `POST /auth/dev/logout`
  - Clears session cookie

Important:
- Never enable these endpoints in production.
- Keep `/auth/dev/*` disabled when CAS is live.

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
# Login as admin (dev-only endpoint)
curl -i -c /tmp/coder-dev.cookies \
  -X POST http://localhost:5000/auth/dev/login \
  -H "Content-Type: application/json" \
  -d '{"computingId":"admin"}'

# Verify current session user
curl -i -b /tmp/coder-dev.cookies http://localhost:5000/me
```

Then open:

- `http://localhost:3000/dashboard`
- `http://localhost:3000/contests/create` (should pass for instructor/admin; TA depends on flags)
- `http://localhost:3000/admin/users` (admin only)

### 7.4 Replace With CAS Later

When CAS integration is ready:

1. Disable/remove `/auth/dev/*` endpoints.
2. Keep `GET /me` contract stable (frontend already depends on it).
3. Keep session cookie behavior unchanged (HttpOnly + SameSite + Secure in prod).

## 8. Fresh Machine Bootstrap

```bash
npm install
cp .env.example .env
npm run db:up
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run dev
```

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
