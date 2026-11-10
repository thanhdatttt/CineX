# Project Structure

## Proposed target layout

This document describes the intended project structure. It is a target for implementation; folders should be added as their tasks begin. Keep the application as one NestJS modular monolith and one React frontend in a single repository.

```text
.
├── apps/
│   ├── api/                         # NestJS modular monolith
│   └── web/                         # React + TypeScript + Tailwind
├── packages/
│   └── contracts/                   # Shared API types only when genuinely useful
├── prisma/
│   ├── schema.prisma                # Prisma schema for Neon PostgreSQL
│   ├── migrations/                  # Versioned schema migrations
│   └── seed.ts                      # Explicit development seed command
├── docs/
│   ├── architecture/
│   └── planning/
├── infrastructure/
│   ├── docker/                      # App Dockerfiles/configuration
│   └── compose.yaml                 # Backend, frontend, optional Redis; no PostgreSQL
├── scripts/                         # Setup, migration and verification helpers
├── tests/
│   ├── integration/                 # Isolated Neon PostgreSQL integration tests
│   └── load/                        # k6 scenarios
├── .env.example                     # Safe placeholders only
├── .gitignore                       # Ignore real env files and local artifacts
└── README.md
```

Use the package manager/workspace selected during bootstrap. Avoid adding a shared package until both apps need a stable shared contract or utility; do not use it to bypass API boundaries.

## Backend layout

```text
apps/api/src/
├── main.ts
├── app.module.ts
├── common/                           # Error mapping, request IDs, validation helpers
├── config/                           # Validated environment configuration
├── database/                         # PrismaService and database lifecycle
├── modules/
│   ├── auth/
│   ├── users/
│   ├── movies/
│   ├── cinemas/
│   ├── rooms/
│   ├── seats/
│   ├── showtimes/
│   ├── inventory/
│   ├── reservations/
│   ├── bookings/
│   ├── vouchers/
│   ├── payments/
│   ├── webhooks/
│   ├── tickets/
│   ├── idempotency/
│   ├── jobs/
│   ├── outbox/
│   └── health/
└── integrations/                    # Optional adapters; no domain authority
    ├── tmdb/                         # Optional staff-assisted metadata lookup/import
    └── vietqr/                       # Optional payment QR rendering
```

Each business module owns its controller, DTOs, application service, and domain rules. Keep persistence details behind module/application-service boundaries where practical. Modules call other modules through exported application services or narrow interfaces; they do not import another module's controllers or reach into its private implementation.

The `integrations/` adapters are optional. TMDB data is imported into CineX-owned movie records; external outages do not block manual catalogue management. VietQR can render payment instructions/QR only; it cannot confirm payment. Verified provider events are handled by `payments`/`webhooks` according to the payment design.

## Frontend layout

```text
apps/web/src/
├── app/                              # Router, providers, application shell
├── api/                              # Typed API client and error mapping
├── components/                       # Reusable presentation components
├── features/
│   ├── auth/
│   ├── movies/
│   ├── showtimes/
│   ├── reservations/
│   ├── bookings/
│   ├── payments/
│   ├── tickets/
│   ├── admin/
│   └── staff/
├── hooks/
├── styles/
└── types/                            # UI-only types; API contracts stay authoritative
```

The frontend displays snapshots and mutation results. It never calculates authoritative prices, owns seat availability, authorizes access, or marks a booking paid from a redirect. Use server-provided expiry timestamps and recover from conflicts by refreshing authoritative API state.

## Data, configuration, and local services

- Neon-hosted PostgreSQL is the database. Prisma schema and migrations live under `prisma/`; use separate Neon targets for development, test, and production.
- Supply the Neon connection string, for example `DATABASE_URL`, through environment/secret configuration. Never commit a real connection string or `.env` file. `.env.example` contains placeholders, and `.gitignore` excludes real env files.
- Docker Compose runs backend/frontend and may run Redis. It must not define a PostgreSQL service.
- Seed and destructive test commands must require an explicitly selected non-production Neon target. CI integration tests use isolated Neon test data and must not receive production credentials.
- Redis is optional for local startup unless the feature under development requires it. PostgreSQL remains the authority when Redis is absent or unavailable.

## Testing layout and commands

- Unit tests live beside modules (`*.spec.ts` / `*.test.ts`) and cover domain rules and transitions.
- Integration tests live under `tests/integration/` and use isolated Neon PostgreSQL data for locking and transaction assertions. Do not substitute in-memory persistence for concurrency evidence.
- k6 scripts live under `tests/load/`; reports record only runs actually performed.
- Keep scripts for install, dev, lint, typecheck, unit tests, integration tests, migrations, safe seeding, and builds in the root workspace manifest and document them in the README.

## Related documents

- [System design](system-design.md)
- [Database design](database-design.md)
- [API design](api-design.md)
- [Security design](security-design.md)
- [Requirements](../requirements.md)
- [Planning roadmap](../planning/roadmap.md)
