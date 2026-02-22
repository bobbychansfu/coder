# Local Database + Swagger (Prisma-first)

This repository uses a Prisma-first local setup:
- PostgreSQL runs in Docker
- Schema/migrations are managed by Prisma
- Mock data is loaded by Prisma seed
- OpenAPI is served in Swagger UI container

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

After services are up, from repository root initialize schema + mock data:

```bash
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

## Reset services and database volume

```bash
npm run db:reset
```

## Optional: legacy SQL auto-import mode

If you need to bootstrap from `initdb/judge_full_latest.sql` instead of Prisma seed:

```bash
cd database
docker compose --env-file ../.env -f docker-compose.yml -f docker-compose.sql-import.yml down -v
docker compose --env-file ../.env -f docker-compose.yml -f docker-compose.sql-import.yml up -d
```
