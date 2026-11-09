# M1-T01 — Create core relational schema

**Objective.** Add the first Prisma schema and migrations for identity, catalogue, rooms, schedules, inventory, bookings, payment, and reliability records.

**Requirements references.** `requirements.md` §4, §7.4, §14; database design; ADR-002, ADR-004, ADR-007.

**Dependencies.** M0-T02, M0-T03.

**Files/modules affected.** Prisma schema/migrations; database module; seed entry point.

**Implementation steps.** Model entities and relationships; add unique/FK/check constraints and indexes; use integer/exact money and UTC timestamps; keep seat availability on showtime inventory; add deterministic development seed structure.

**Acceptance criteria.** Prisma migrations apply to an isolated Neon PostgreSQL target; duplicate `(showtime, seat)` and normalized email are rejected; physical seats carry no showtime availability; schema documents ownership and historical references.
