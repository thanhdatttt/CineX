# ADR-001: Technology Stack and Application Shape

- **Status:** Accepted
- **Date:** 2026-11-09

## Context

CineX must demonstrate transactional seat ownership, payment idempotency, recoverable asynchronous effects, and end-to-end customer/staff/admin flows. The requirements set a baseline but also require preserving any stack already established in the repository. At this point the repository contains documentation only, so the baseline below guides implementation; it does not prescribe versions or package details.

## Decision

| Concern | Choice |
|---|---|
| Web client | React + TypeScript; Tailwind CSS |
| API | NestJS modular monolith |
| Persistence | Neon-hosted PostgreSQL + Prisma |
| Cache and shared rate limiting | Redis |
| Background processing | BullMQ, with PostgreSQL transactional outbox |
| Authentication | JWT plus server-side role and ownership checks |
| Payment | Internal mock gateway behind an adapter/interface |
| Verification | Jest + Supertest; k6 for load/contention |
| Local/CI | Docker Compose for app services and optional Redis; Neon PostgreSQL; GitHub Actions |

Deploy one backend application with modules organized around domain boundaries. Keep modules communicating through application services/interfaces. Neon-hosted PostgreSQL is authoritative for sale and ownership; Prisma manages schema and migrations. Redis and queue delivery are not correctness mechanisms. Gateway calls occur outside long-running database transactions.

## Consequences

- React presents snapshots and mutation outcomes; backend calculates prices, authorizes access, and confirms payments.
- PostgreSQL transactions/constraints provide the final inventory invariant. Redis cache and rate-limit failures need explicit route policies.
- BullMQ may redeliver jobs, so workers and consumers must be idempotent and recover work from persisted state/outbox after restart.
- Mock payment scenarios must cover success, definitive failure, timeout/unknown, delayed result, duplicate event, invalid signature/event, and amount/currency mismatch.
- Tests need real PostgreSQL for concurrency claims; use an isolated Neon test database/branch and never run destructive tests against production. k6 reports only observed results. Docker Compose runs backend/frontend and may run Redis; it does not run PostgreSQL.
- Use existing repository versions/scripts where implementation begins; add no alternate framework or infrastructure without a concrete requirement and documented decision.

## Revisit when

Repository discovery reveals an established conflicting stack, or measured operational needs require a change. Record the evidence and update this ADR before changing the baseline.
