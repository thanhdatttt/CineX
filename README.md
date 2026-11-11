# CineX

A movie ticket booking system. The repository currently contains a React/Vite web scaffold, a NestJS API scaffold, architecture decisions, and implementation plans.

## Project layout

- `apps/web/` — React + TypeScript + Tailwind CSS (Vite).
- `apps/api/` — NestJS API and Prisma CLI/client dependencies.
- `apps/api/prisma/` — PostgreSQL schema and migrations.
- `docs/` — requirements, architecture, and implementation planning.

## Configure Prisma and Neon

Requirements: Node.js and npm. PostgreSQL is hosted on Neon; this repository does not run a PostgreSQL container.

1. Create or select a **development** Neon PostgreSQL database. Copy its connection string from the Neon dashboard.
2. From the repository root, create the API's local environment file:

   ```sh
   test -f apps/api/.env || cp apps/api/.env.example apps/api/.env
   ```

3. Replace the placeholder `DATABASE_URL` in `apps/api/.env` with the Neon development connection string. Keep `.env` private and do not commit it. `apps/api/.env.example` is only a template.
4. Install API dependencies and generate the Prisma Client:

   ```sh
   cd apps/api
   npm ci
   npm run db:generate
   npm run db:validate
   ```

`db:generate` generates the client and does not contact Neon. `db:validate` checks the schema and configuration locally. The initial schema intentionally has no CineX business models yet.

After domain models have been added to `apps/api/prisma/schema.prisma`, create a development migration with:

```sh
npm run db:migrate:dev -- --name init
```

This command connects to the database in `DATABASE_URL` and changes its schema. Use only your isolated development database. For a deployed environment, apply committed migrations with `npm run db:migrate:deploy`; never use `migrate dev` against production. Prisma Studio is available with `npm run db:studio`.

Use separate isolated Neon targets for development, tests, and production. Never run development seeds or destructive tests against production data.

## Run locally with Docker Compose

Requirements: Docker Engine/Desktop with the Compose plugin. First create `apps/api/.env` as described above. From the repository root, start the API and web app:

```sh
docker compose -f infrastructure/docker/compose.yml up --build
```

The web app is at <http://localhost:5173> and the API at <http://localhost:3000>. To also start optional Redis:

```sh
docker compose -f infrastructure/docker/compose.yml --profile redis up --build
```

Stop the services with `docker compose -f infrastructure/docker/compose.yml down`. The Compose stack does not run PostgreSQL; the API receives `DATABASE_URL` from `apps/api/.env` for Neon. After changing app dependencies, recreate the dependency volumes with `docker compose -f infrastructure/docker/compose.yml down -v` before starting again.

The web app is still a Vite starter page and the API currently exposes only its NestJS starter endpoint. Docker Compose provides a local development environment; product flows remain to be implemented.

For development without Docker, install dependencies with `npm ci` in `apps/web/` and `apps/api/`. Start the web app with `npm run dev` from `apps/web/`; start the API with `npm run start:dev` from `apps/api/`.
