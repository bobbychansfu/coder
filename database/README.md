# Local Database + Swagger (Prisma-first)

This repository uses a Prisma-first local setup:
- PostgreSQL runs in Docker
- Schema/migrations are managed by Prisma
- Mock data is loaded by Prisma seed
- OpenAPI is served in Swagger UI container

Compose stack name: `coder-dev`.

Services:
- `coder-dev-db` for Postgres
- `coder-dev-swagger` for Swagger UI

The backend app/API is started locally with `npm run dev` (not inside Docker).

## Start services

```bash
npm run db:up
```

Services:
- Postgres: `localhost:${DB_PORT}`
- Swagger UI: `http://localhost:${SWAGGER_PORT}`

Database credentials:
- DB: `${POSTGRES_DB}`
- User: `${POSTGRES_USER}`
- Password: `${POSTGRES_PASSWORD}`

Configure these values in root `.env` (see `.env.example`).

If `5432` is already in use locally, set `DB_PORT` and `DATABASE_URL` to `5433`.

After services are up, from repository root initialize schema + mock data:

```bash
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

## Reset services

```bash
npm run db:reset
```

## Start backend dev server

```bash
npm run dev
```

Health checks:

```bash
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:8081
```

## Optional: legacy SQL auto-import mode

If you need to bootstrap from `initdb/judge_full_latest.sql` instead of Prisma seed:

```bash
cd database
docker compose --env-file ../.env -f docker-compose.yml -f docker-compose.sql-import.yml down -v
docker compose --env-file ../.env -f docker-compose.yml -f docker-compose.sql-import.yml up -d
```
