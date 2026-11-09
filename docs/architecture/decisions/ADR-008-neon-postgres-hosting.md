# ADR-008: Neon PostgreSQL Hosting

- **Status:** Accepted
- **Date:** 2026-11-09

## Context

CineX needs PostgreSQL as the transactional authority for showtime inventory, reservations, bookings, payments, and idempotency. The project has selected Neon as the managed PostgreSQL hosting provider and Prisma as the ORM/schema/migration tool.

## Decision

- Store application data in Neon-hosted PostgreSQL.
- Use Prisma for data access, schema definition, and migrations.
- Use separate isolated Neon databases/branches (or equivalent isolated Neon targets) for development, testing, and production.
- Docker Compose runs backend/frontend and may run Redis; it does not run PostgreSQL.
- Supply the Neon connection string through an environment variable (for example, `DATABASE_URL`). Keep test, development, and production connection settings separate. Tests, seed commands, and migrations must never target production accidentally.
- Store connection strings and credentials only in environment/secret configuration, never in committed files. Commit only a safe `.env.example` placeholder; ensure actual `.env` files are ignored by Git.

## Consequences

Neon connection details must be supplied through deployment configuration and documented without publishing credentials. CI and concurrency tests require a dedicated isolated Neon PostgreSQL target. All transactional correctness claims continue to rely on PostgreSQL constraints and transactions, independent of hosting provider.

## Revisit when

Operational requirements or measured database behavior require a different hosting arrangement. Record the evidence before changing the production database provider.
