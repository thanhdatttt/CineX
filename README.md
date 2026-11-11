# CineX

CineX is a movie ticket booking system designed to demonstrate transactional seat booking, idempotent payment handling, and recoverable background work. The repository is at the runnable foundation stage; customer and staff product flows are planned but not implemented yet.

## Project layout

- `apps/web/` — React, TypeScript, Tailwind CSS, and Vite client.
- `apps/api/` — NestJS modular-monolith API, Prisma schema, and migrations.
- `infrastructure/docker/` — Dockerfiles and Compose configuration for the apps and optional Redis.
- `docs/` — requirements, architecture decisions, and milestone/task plans.

## Requirements

- Node.js 24 and npm.
- Docker Engine/Desktop with the Compose plugin for containerized development.
- A Neon PostgreSQL database for API development. Docker Compose intentionally does not provide PostgreSQL.

## Install and run

From the repository root:

```sh
npm run install:all
npm run dev
```

`npm run dev` starts both apps. To run one process at a time, use:

```sh
npm run dev:api
npm run dev:web
```

The API listens on `http://localhost:3000` and the client on `http://localhost:5173`. The API requires a valid `DATABASE_URL` at startup, even before application models are added. Set the API variables as described below before starting it.

## Neon environment setup

Create separate, isolated Neon databases or branches for development, automated tests, and production. Do not share production credentials with local development, CI, seeds, or destructive tests. Use `apps/api/.env.example` as the single template. For a test command that needs PostgreSQL, supply the isolated test target's connection string as `DATABASE_URL` for that command; keep test credentials in a separate ignored local env file or CI secret, and keep production credentials in deployment secret storage.

Create the API environment file from the placeholder template and replace `DATABASE_URL` with the **direct (unpooled)** connection string for the development target:

```sh
cp apps/api/.env.example apps/api/.env
```

The example contains placeholders only. Copy it to `apps/api/.env` and replace the placeholder values. The API loads this file automatically when started from `apps/api` (including the repository scripts that use `--prefix apps/api`). Values already supplied by the process environment take precedence over `.env`. Real `.env` files are Git-ignored. Keep development, test, and production connection strings in separate secret/configuration sources and explicitly select the appropriate isolated target; never point tests or `migrate dev` at production.

In Neon Console, open the database branch and choose **Connect**. This repository currently uses one `DATABASE_URL` for both Prisma CLI migrations and API runtime, so copy the direct connection string (hostname does not contain `-pooler`) and keep `sslmode=require`. Do not use a pooled URL for migrations. The API runs in Docker but PostgreSQL is hosted by Neon; Compose does not create a local PostgreSQL server. Keep the URL private and out of commits, screenshots, and logs.

| Variable | Default | Purpose |
|---|---:|---|
| `DATABASE_URL` | required | Neon PostgreSQL connection URL (`postgres://` or `postgresql://`). |
| `PORT` | `3000` | API listen port. |
| `TZ` | `UTC` | Timestamp handling; persisted timestamps use UTC and are converted at API/UI boundaries. |
| `RESERVATION_HOLD_MINUTES` | `5` | Active seat-hold duration. |
| `PAYMENT_RECONCILIATION_TIMEOUT_MINUTES` | `30` | Deadline before an unresolved payment requires manual reconciliation, per ADR-003. |

The API validates required settings and positive integer values at startup, and reports configuration errors without printing the connection string. Money is stored as integer VND đồng; floating-point arithmetic is not used for prices.

Generate and validate Prisma locally (these commands do not apply a migration):

```sh
npm run db:generate --prefix apps/api
npm run db:validate --prefix apps/api
```

The API uses Prisma ORM 7. `apps/api/prisma.config.ts` supplies the migration connection URL, the generated client lives under `apps/api/src/generated/prisma`, and the API connects through Prisma's PostgreSQL driver adapter.

Apply the committed schema to the isolated development database and seed deterministic catalogue records:

```sh
npm run db:migrate:dev --prefix apps/api
npm run db:seed --prefix apps/api
```

For a new Neon branch, Prisma creates/updates the schema from the checked-in migrations. `migrate dev` is for development only and may create a migration when the schema changes. Commit the generated migration, then apply committed migrations to a test or production target with:

```sh
npm run db:migrate:deploy --prefix apps/api
```

Select the target explicitly by setting that environment's `DATABASE_URL` before running the command. Do not run seeds against production unless the seed data is intended for production. To inspect migration state, run `npm run db:status --prefix apps/api`. Prisma Studio is available with `npm run db:studio --prefix apps/api`.

### Copy an existing PostgreSQL database to Neon

Prisma Migrate transfers the schema, not existing rows. If you already have data in another PostgreSQL database, create the Neon database/branch, take a dump from the source, and restore it into the Neon target using PostgreSQL's `pg_dump` and `pg_restore` tools. Verify the target URL and backup before restoring; a restore can overwrite objects in the destination. For a schema-only setup with no existing data, use the Prisma migration commands above instead.

## Docker Compose

After creating `apps/api/.env` and setting its development Neon connection string as described above, build and run the API and web containers:

```sh
docker compose -f infrastructure/docker/compose.yml up --build
```

The containers are named `cinex-api` and `cinex-web`. The web app is available at <http://localhost:5173>, the API at <http://localhost:3000>, and its health check at <http://localhost:3000/health>. Inspect container and health-check status with:

```sh
docker compose -f infrastructure/docker/compose.yml ps
```

To include optional Redis:

```sh
docker compose -f infrastructure/docker/compose.yml --profile redis up --build
```

Stop services with:

```sh
docker compose -f infrastructure/docker/compose.yml down
```

To rebuild after changing application code or dependencies, run `docker compose -f infrastructure/docker/compose.yml up --build` again. To start in the background, add `-d`; use `docker compose -f infrastructure/docker/compose.yml logs -f api web` to follow app logs.

To recreate only the app dependency volumes after changing package dependencies, use `docker compose -f infrastructure/docker/compose.yml down -v` before starting again. This removes Docker volumes; it does not reset or alter Neon data. Never run database reset commands against production.

Compose has API and web health checks and no PostgreSQL service. Redis is optional and is not the authority for seat ownership or payment state.

## Quality commands

Run from the repository root:

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

`npm run test:e2e` currently exercises only the NestJS starter endpoint. Integration tests that need PostgreSQL must use the isolated Neon test target, never development or production data. Load/concurrency results should only be recorded after actual runs against PostgreSQL.
