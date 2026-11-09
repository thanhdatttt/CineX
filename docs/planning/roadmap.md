# CineX Implementation Roadmap

## Current baseline

Repository discovery (2026-11-09) found requirements, architecture/API/database/security designs, and ADR-001 through ADR-008. The selected persistence target is Neon-hosted PostgreSQL accessed through Prisma. Docker Compose is for backend/frontend and optional Redis; it does not run PostgreSQL. There is no application source, package manifest, database schema, migration, test, or CI configuration yet. Therefore implementation starts with stack/bootstrap decisions and cannot claim any product requirement is implemented.

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

See [milestones.md](milestones.md) and [tasks/](tasks/) for executable slices. Tasks are intentionally scoped to one agent-sized outcome; implementation agents should follow source-of-truth requirements and ADRs linked in each task. Do not mark a task complete without its acceptance evidence.

## Open product decision

Cancellation/refund cutoff, refund amount, fee/voucher handling, and when seats may be released are not specified. Keep cancellation disabled until the product decision in [ADR-005](../architecture/decisions/ADR-005-cancellation-and-refunds.md) is resolved; do not invent those rules in code.

## Source documents

- [Product and engineering requirements](../requirements.md)
- [System design](../architecture/system-design.md)
- [API design](../architecture/api-design.md)
- [Database design](../architecture/database-design.md)
- [Security design](../architecture/security-design.md)
- [Architecture decisions](../architecture/decisions/)
- [Neon PostgreSQL hosting decision](../architecture/decisions/ADR-008-neon-postgres-hosting.md)
