# Backend Local Dev Guide

This project uses a Prisma-first backend workflow:
- Docker for infrastructure (`PostgreSQL` + `Swagger UI`)
- Prisma for schema, migrations, and seeding
- Local app server (`npm run dev`) for backend routes

## 1. Docker Stack Overview

Compose stack name: `coder-dev` (see `database/docker-compose.yml`).

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
POSTGRES_PASSWORD="change_me"
DB_PORT="5432"
SWAGGER_PORT="8081"
DATABASE_URL="postgresql://postgres:change_me@localhost:5432/judge?schema=public"
```

If port `5432` is already used on your machine, change both values to `5433`:
- `DB_PORT="5433"`
- `DATABASE_URL=...@localhost:5433/...`

## 4. Start Docker Infrastructure

From repo root:

```bash
npm run db:up
```

Check status:

```bash
docker compose --env-file .env -f database/docker-compose.yml ps
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

## 7. Fresh Machine Bootstrap

```bash
npm install
cp .env.example .env
npm run db:up
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run dev
```

## 8. Legacy SQL Import (Optional)

If you need to bootstrap from `database/initdb/judge_full_latest.sql`:

```bash
cd database
docker compose --env-file ../.env -f docker-compose.yml -f docker-compose.sql-import.yml down -v
docker compose --env-file ../.env -f docker-compose.yml -f docker-compose.sql-import.yml up -d
```

This bypasses Prisma seed and is only for legacy compatibility checks.

## 9. File Map

- Prisma config: `prisma.config.ts`
- Prisma schema: `prisma/schema.prisma`
- Prisma seed: `prisma/seed.mjs`
- Prisma client singleton: `src/lib/prisma.ts`
- Docker stack: `database/docker-compose.yml`
- Optional SQL overlay: `database/docker-compose.sql-import.yml`
- OpenAPI spec: `docs/backendAPI.yaml`

## 10. Troubleshooting

- `Cannot connect to the Docker daemon`
  - Start Docker Desktop, then rerun `npm run db:up`.
- Prisma `P1010`/access denied during deploy or seed
  - Confirm `.env` credentials match `DATABASE_URL`.
  - Confirm the DB port in `DATABASE_URL` matches `DB_PORT`.
  - Check Docker service health with `docker compose ... ps`.
- Local Postgres conflict on `5432`
  - Change to `5433` in both `DB_PORT` and `DATABASE_URL`, then run `npm run db:down && npm run db:up`.
