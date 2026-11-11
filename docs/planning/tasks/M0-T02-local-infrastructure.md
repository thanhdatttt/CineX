# M0-T02 — Configure Neon and local Docker services

**Status:** Complete (2026-11-11). Compose config validated; API/web images built and reached healthy status, and optional Redis reached healthy status. Compose defines no PostgreSQL service.

**Objective.** Run backend/frontend and optional Redis through Docker Compose, with Prisma connecting to Neon PostgreSQL.

**Requirements references.** `requirements.md` §14; ADR-001, ADR-002, ADR-006.

**Dependencies.** M0-T01.

**Files/modules affected.** `compose.yaml` (or equivalent), `.env.example`, developer setup docs, database connection configuration.

**Implementation steps.** Define backend/frontend services and optional Redis with health checks; do not define a PostgreSQL container; configure Prisma to read the Neon connection string from environment; document isolated Neon target selection and safe start/stop/reset commands.

**Acceptance criteria.** Docker Compose runs backend/frontend and optionally Redis, with no PostgreSQL service; Prisma reads Neon connection configuration from environment; test/dev targets are isolated from production; `.env.example` contains placeholders only and real `.env` files are Git-ignored.
