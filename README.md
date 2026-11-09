# CineX
A movie ticket booking system

## Project layout

- `frontend/` — React + TypeScript + Tailwind CSS (Vite).
- `backend/` — NestJS API.
- `infrastructure/` — Docker Compose for the application and optional Redis.
- `docs/` — requirements, architecture, and implementation planning.

## Local development

Requirements: Docker with the Compose plugin. Copy `.env.example` to `.env` and set `DATABASE_URL` to an isolated Neon development database connection string. PostgreSQL is hosted on Neon and is not started by Compose.

Start the app containers:

```sh
docker compose -f infrastructure/compose.yaml up --build
```

The frontend is at <http://localhost:5173> and the API at <http://localhost:3000>. To include optional Redis:

```sh
docker compose -f infrastructure/compose.yaml --profile redis up --build
```

Stop containers with `docker compose -f infrastructure/compose.yaml down`. The frontend scaffold intentionally contains only a startup placeholder; product flows are not implemented yet.

For development outside Docker, install dependencies with `npm install` in `frontend/` and `npm ci` in `backend/`; run each with `npm run dev` and `npm run start:dev` respectively.

## Database and local services

CineX stores PostgreSQL data in Neon. Prisma connects using a Neon connection string supplied through environment configuration (for example, `DATABASE_URL`) and manages the schema and migrations. Do not commit real connection strings or `.env` files; keep `.env.example` limited to safe placeholders.

Docker Compose is for running the backend, frontend, and optionally Redis. It does not run PostgreSQL. Development, test, and production must use separate Neon targets; never run development seeds or destructive tests against production data.
