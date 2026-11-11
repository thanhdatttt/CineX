# CineX Implementation Roadmap

## Current baseline

As of 2026-11-11, M0 is complete. The repository has a runnable React/TypeScript/Tailwind/Vite client and NestJS modular-monolith API scaffold, root quality/development commands, Prisma configured for environment-provided Neon PostgreSQL, and Docker Compose for the API/web plus optional Redis (never PostgreSQL). API startup validates required configuration; local/test/production targets are documented separately. Docker images built from clean lockfile installs; API and web health checks passed, optional Redis reached healthy, unit and e2e tests passed, and build/lint/typecheck/Prisma validation passed. These are foundation checks only: CineX product flows and domain persistence are not implemented yet.

## Delivery order

| Milestone | Outcome | Depends on |
|---|---|---|
| M0 — Runnable foundation | Repository stack bootstrapped; local dependencies and quality commands documented | — |
| M1 — Identity and catalogue | Auth, role boundaries, catalogue, room layouts, showtimes and inventory browseable | M0 |
| M2 — Safe reservations | Atomic holds, idempotency, release/expiry, PostgreSQL concurrency evidence | M1 |
| M3 — Booking and payment | Server pricing, voucher quotas, payment adapter, verified webhooks and race recovery | M2 |
| M4 — Tickets and operations | Ticket issuance/admission, recoverable async work, cancellation when policy is defined | M3 |
| M5 — Complete product and hardening | Redis cache/rate limits, frontend flows, observability, security and operational docs | M1–M4 |
| M6 — Verified delivery | CI, Docker clean setup, concurrency/load evidence and completion report | M0–M5 |

M0 acceptance evidence: root `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`, API e2e tests (run in the API container), `db:generate`, `db:validate`, `docker compose ... config --quiet`, and Docker Compose health checks for API, web, and optional Redis all passed on 2026-11-11. No PostgreSQL service is defined in Compose.

See [milestones.md](milestones.md) and [tasks/](tasks/) for executable slices. Tasks are intentionally scoped to one agent-sized outcome; implementation agents should follow source-of-truth requirements and ADRs linked in each task. Do not mark a task complete without its acceptance evidence.

## Open product decision

Cancellation/refund cutoff, refund amount, fee/voucher handling, and when seats may be released are not specified. Keep cancellation disabled until the product decision in [ADR-005](../architecture/decisions/ADR-005-cancellation-and-refunds.md) is resolved; do not invent those rules in code.

## Source documents

- [Product and engineering requirements](../requirements.md)
- [System design](../architecture/system-design.md)
- [Project structure](../architecture/project-structure.md)
- [API design](../architecture/api-design.md)
- [Database design](../architecture/database-design.md)
- [Security design](../architecture/security-design.md)
- [Architecture decisions](../architecture/decisions/)
- [Neon PostgreSQL hosting decision](../architecture/decisions/ADR-008-neon-postgres-hosting.md)
- [Optional TMDB and VietQR support integrations](../architecture/decisions/ADR-009-optional-tmdb-vietqr.md)
