# CineX repository instructions

Read this file before working in the repository. Then inspect the relevant source, tests, and documentation before editing; do not assume this file or the plans describe the current implementation perfectly.

## Sources of truth and project status

- `README.md` is the primary source for setup, environment variables, database operations, Docker, and root scripts.
- `docs/requirements.md` defines product scope, invariants, functional requirements, acceptance criteria, and the final report format.
- `docs/architecture/` and accepted ADRs define system boundaries, API/data/security design, and settled decisions. Check applicable ADRs before changing architecture. ADR-005 is **proposed**: cancellation must stay disabled until product terms are decided and documented.
- `docs/planning/milestones.md`, `docs/planning/roadmap.md`, and `docs/planning/tasks/` define delivery sequence and task-specific acceptance criteria. Read the brief for the task being implemented and update its status/evidence only when justified.
- Source code, Prisma schema, migrations, and tests show what is implemented today. Plans and schema entities do not prove a feature is complete.
- The current repository contains a NestJS API foundation with configuration validation, authentication/authorization, and initial movie/cinema catalogue operations. The React app still contains the Vite starter screen. Many schema models and product flows are planned but do not yet have corresponding working APIs/UI. Verify before describing status.
- `apps/api/README.md` and `apps/web/README.md` are upstream framework starter documents and may not describe CineX accurately; prefer the root README and project docs.

## Product and architecture

- CineX is a transactional movie-ticket booking system. Its central goal is safe seat inventory, reservations, idempotent payment processing, and recoverable work, not only CRUD screens.
- Keep the backend a NestJS modular monolith. Respect existing module boundaries and patterns; do not introduce microservices or replace the stack without a documented technical reason and an architecture decision.
- Stack: React + TypeScript + Tailwind + Vite web app; NestJS + TypeScript API; Neon-hosted PostgreSQL with Prisma; Redis is optional locally and intended for cache/rate limits/coordination; BullMQ is planned for background work; Jest/Supertest for tests; k6 for load evidence; Docker Compose for apps and optional Redis; GitHub Actions for CI.
- Keep domain logic in appropriate API modules/services, request validation in DTOs, authorization on the server, and persistence changes in Prisma schema plus committed migrations. Avoid circular module dependencies and direct access to another module's internals.
- Implement vertical slices where applicable: persistence, business rules, API validation, authorization, tests, and documentation should agree.
- Optional TMDB is admin-assisted metadata lookup/import only. CineX owns persisted catalogue data; public browsing must use CineX data. Optional VietQR/QR display is not payment evidence. Neither integration may be required for core flows. See ADR-009.
- Deferred until mandatory requirements are complete: recommendations, advanced promotion engine, production payment-provider integration, microservices, multi-region deployment, advanced analytics, and WebSockets. Do not add them speculatively.

## Non-negotiable data and business invariants

- PostgreSQL is the source of truth for users, catalogue, inventory, reservations, bookings, payments, idempotency, and webhook receipts. Redis locks/cache and queue delivery must never be the sole protection against selling or holding the same seat twice.
- Enforce `UNIQUE(showtime_id, seat_id)` for showtime inventory and use database constraints, short transactions, and deterministic lock ordering for contested changes. A multi-seat reservation succeeds all-or-nothing. Revalidate showtime, room membership, ownership, and availability inside the transaction.
- Treat state transitions as explicit business rules. Reject invalid/stale transitions; do not silently repair them. Keep reservation, booking, payment, voucher, cancellation, and admission decisions transactionally consistent.
- Active reservations use the configured five-minute hold by default. Starting payment must atomically protect a still-valid reservation and establish a bounded reconciliation deadline. Do not release payment-pending inventory just because the original hold expired.
- A timeout is an unknown payment outcome, not proof of failure. Call gateways outside transactions holding inventory locks. Only accept verified server-side results with matching provider/reference, booking, amount, currency, and valid state. Persist/deduplicate webhook events before acknowledgment. Duplicate requests/events must not duplicate effects.
- If a late payment success cannot be fulfilled with the original protected seats, mark compensation/refund/manual reconciliation as required; never take seats from a new owner or confirm an impossible booking. See ADR-003 and ADR-004.
- Persist money as integer VND đồng (minor units) or exact decimal; never use floating-point arithmetic. Persist timestamps in UTC; convert to cinema-local time only at API/UI boundaries.
- Keep room/seat layout immutable after showtime inventory is generated. Preserve historical seat identities and ticket/booking references; use a new layout/room for future showtimes. Never cascade-delete historical inventory or booking records. See ADR-007.
- Cancellation/refund behavior is disabled until cutoff, refund amount, and seat-release rules are approved and recorded. Do not invent product policy.
- Idempotency belongs in PostgreSQL and is scoped by principal/user plus operation. A repeated key and same request returns the original result; a different request fingerprint with the same key conflicts (HTTP 409). Database uniqueness must back this guarantee.
- Queue delivery is at-least-once. Consumers must be idempotent. Use a transactional outbox when an actual asynchronous side effect is introduced; do not add generalized queue/outbox machinery without a real need.

## Security and privacy

- Enforce authentication, role, resource ownership, and staff cinema scope on the server. Hiding a control in the UI is not authorization. Check ownership in service queries/mutations, not by trusting caller-supplied IDs.
- Registration creates `CUSTOMER`; do not accept role changes from public request bodies. Normalize email and do not reveal account existence through auth errors.
- Follow `docs/architecture/security-design.md`: current auth uses Node `scrypt` password hashes, HS256 access JWTs (issuer `cinex-api`, audience `cinex-client`), opaque random refresh tokens stored as SHA-256 hashes, rotation, and token-family revocation on replay/logout. Preserve expiry and current-user status/role checks.
- Validate and normalize inputs (global Nest validation uses whitelist, rejects unknown properties, and transforms DTO values); use parameterized database operations. Avoid raw SQL unless required, and never interpolate untrusted values into SQL.
- Keep secrets only in ignored local `.env` files or deployment secret storage. Commit safe placeholders in `apps/api/.env.example` only. Never print credentials, tokens, password hashes, sensitive webhook payloads, or stack/SQL details in responses/logs.
- Webhook signature verification and matching payment fields are mandatory; a client redirect, QR scan, or client success message never proves payment.
- When rate limiting is implemented, use shared atomic Redis-backed limits and trusted-proxy configuration. Do not trust arbitrary `X-Forwarded-For`. Follow ADR-006 for Redis outage behavior; limits do not replace authorization, idempotency, or database constraints.
- Ticket codes/QR payloads must be opaque and unguessable and contain no personal data. Admission must validate ticket/booking/showtime and staff scope, then atomically consume once and record actor/time.

## Repository map and coding conventions

- `apps/api/src/`: NestJS modules. Existing modules include `auth`, `users`, `movies`, `cinemas`, `database`; keep related controller, DTO, service, module, and specs together.
- `apps/api/prisma/schema.prisma`: PostgreSQL domain schema. Generated Prisma client is in `apps/api/src/generated/prisma/`; it is generated output, not the source of schema changes. Change schema and add a migration; do not hand-edit generated output.
- `apps/api/prisma/migrations/`: committed schema history. Review generated SQL before committing it.
- `apps/api/prisma/seed.ts`: deterministic development catalogue fixtures. Seeds are data-changing; only use the isolated development target.
- `apps/web/src/`: React/TypeScript app. Follow existing component/style conventions; replace starter scaffolding only as part of an intentional feature slice.
- `infrastructure/docker/`: Dockerfiles and Compose setup. Compose runs API and web, with Redis behind the `redis` profile; PostgreSQL remains hosted by Neon.
- `docs/`: requirements, architecture, ADRs, milestone plan, and implementation briefs. Update the relevant docs when behavior, setup, schema, or decisions change.
- Preserve established TypeScript/ESM, NestJS, React, Prisma, and lint conventions. Keep changes focused and avoid unnecessary dependencies or speculative abstractions.

## Environment, database, and commands

- Requirements: Node.js 24, npm, Docker Engine/Desktop with Compose, and an isolated Neon PostgreSQL database for API development.
- API requires `DATABASE_URL` and `JWT_SECRET` at startup. Defaults include `PORT=3000`, `JWT_ACCESS_TOKEN_TTL_SECONDS=600` (max 86400), `JWT_REFRESH_TOKEN_TTL_DAYS=7` (max 90), `RESERVATION_HOLD_MINUTES=5`, `PAYMENT_RECONCILIATION_TIMEOUT_MINUTES=30`, and UTC timestamps. See README and `.env.example` for full details.
- Use a **direct/unpooled** Neon URL for Prisma migrations; keep `sslmode=require`. Keep development, test, and production targets separate. Tests, seeds, `migrate dev`, and destructive operations must never target production. Verify which target a command will use before running it.
- Root scripts: `npm run install:all`, `npm run dev`, `npm run dev:api`, `npm run dev:web`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, and `npm run build`.
- API Prisma scripts run with `--prefix apps/api`: `db:generate`, `db:validate`, `db:migrate:dev`, `db:migrate:deploy`, `db:seed`, `db:status`, and `db:studio`. `db:migrate:dev` may create a migration; review and commit intended SQL. Use `db:migrate:deploy` only for the explicitly selected non-production or deployment target. Never run database reset commands against production.
- The API `lint` script includes ESLint `--fix` and may modify files. Check the working tree first and review any changes it makes.
- Docker Compose: `docker compose -f infrastructure/docker/compose.yml up --build`; Redis is opt-in with `--profile redis`. `down -v` removes app dependency volumes; it does not reset Neon. Do not run destructive Docker/database commands without understanding their target/effect.

## Work and verification workflow

1. Inspect `git status` and relevant source/tests/docs before editing; preserve unrelated user changes.
2. Identify the applicable task brief and acceptance criteria. Check current code and migration state rather than implementing based only on a target design.
3. Make the smallest complete change that satisfies the task and existing architecture. For data/model changes, include migration, constraints/indexes, and compatible code updates.
4. Add or update tests for changed behavior and critical invariants. Do not claim completion without evidence for the relevant acceptance criteria; distinguish implemented behavior from planned work.
5. Update requirements/API/architecture/setup/task docs when the change alters them. Record a new ADR for material architectural decisions rather than silently contradicting an accepted ADR.
6. Run only relevant checks and report exactly what ran and whether it passed. For database-backed tests, explicitly use the isolated test database. Do not run tests or other checks unless the user asks for verification; if not run, state that clearly.
7. Finish with a concise report: changed behavior/files, checks run (or not run), and any incomplete acceptance criteria or operational caveats.

Useful references: `README.md`, `docs/requirements.md`, `docs/architecture/system-design.md`, `docs/architecture/database-design.md`, `docs/architecture/api-design.md`, `docs/architecture/security-design.md`, accepted ADRs in `docs/architecture/decisions/`, and the applicable task file in `docs/planning/tasks/`.
