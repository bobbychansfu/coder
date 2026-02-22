# Backend Local Dev Guide

This project now uses a Prisma-first backend development flow for local work:
- Docker for infrastructure (PostgreSQL + Swagger UI)
- Prisma for schema, migrations, and seeding
- OpenAPI YAML (`docs/backendAPI.yaml`) rendered in Swagger UI

## 1. Prerequisites

1. Install Docker Desktop and make sure Docker daemon is running.
2. Install Node.js 20+ and npm.
3. From repository root, install dependencies:

```bash
npm install
```

## 2. Environment Variables

1. Copy the env template:

```bash
cp .env.example .env
```

2. Default local value:

```env
POSTGRES_DB="judge"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="change_me"
DB_PORT="5432"
SWAGGER_PORT="8081"
DATABASE_URL="postgresql://postgres:change_me@localhost:5432/judge?schema=public"
```

## 3. Start Local Infrastructure (Docker)

From repo root:

```bash
npm run db:up
```

What starts:
- PostgreSQL: `localhost:${DB_PORT}`
- Swagger UI: `http://localhost:${SWAGGER_PORT}`

Stop services:

```bash
npm run db:down
```

Reset services + DB volume:

```bash
npm run db:reset
```

## 4. Prisma Setup (Schema + Client + Seed)

Generate Prisma client:

```bash
npm run prisma:generate
```

Apply committed migrations:

```bash
npm run prisma:deploy
```

Create a new migration during development:

```bash
npm run prisma:migrate -- --name <change_name>
```

If you only want to sync schema without migration files:

```bash
npm run prisma:push
```

Seed local mock data:

```bash
npm run prisma:seed
```

Open Prisma Studio:

```bash
npm run prisma:studio
```

Reset DB and re-run migrations + seed:

```bash
npm run prisma:reset
```

## 5. OpenAPI / Swagger Workflow

OpenAPI source of truth:
- `docs/backendAPI.yaml`

Swagger UI:
- `http://localhost:8081`

When API changes:
1. Update `docs/backendAPI.yaml`
2. Refresh Swagger UI page
3. Keep request/response examples aligned with Prisma-backed behavior

## 6. Local Bootstrap (Recommended)

Run this sequence on a fresh machine:

```bash
npm install
cp .env.example .env
npm run db:up
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run dev
```

## 7. Legacy SQL Import (Optional)

If you explicitly need to initialize from `database/initdb/judge_full_latest.sql`:

```bash
cd database
docker compose -f docker-compose.yml -f docker-compose.sql-import.yml down -v
docker compose -f docker-compose.yml -f docker-compose.sql-import.yml up -d
```

Note:
- This bypasses Prisma seed.
- Use this only for legacy compatibility checks.

## 8. File Map

- Prisma config: `prisma.config.ts`
- Prisma schema: `prisma/schema.prisma`
- Prisma seed: `prisma/seed.mjs`
- Prisma client singleton: `src/lib/prisma.ts`
- Docker services: `database/docker-compose.yml`
- Optional SQL import overlay: `database/docker-compose.sql-import.yml`
- OpenAPI spec: `docs/backendAPI.yaml`

## 9. Troubleshooting

- `Cannot connect to the Docker daemon`:
  - Start Docker Desktop, then rerun `npm run db:up`.
- Prisma seed returns `P1010 (DatabaseAccessDenied)`:
  - Confirm `.env` credentials (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) match your `DATABASE_URL`
  - Ensure Docker Postgres is up (`npm run db:up`).
