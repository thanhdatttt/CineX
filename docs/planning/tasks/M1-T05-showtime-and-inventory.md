# M1-T05 — Implement showtimes and inventory generation

**Objective.** Schedule screenings and generate one durable inventory row per eligible seat.

**Requirements references.** `requirements.md` §4.2–4.3, §6.4; database design; ADR-002, ADR-007.

**Dependencies.** M1-T01, M1-T03, M1-T04.

**Files/modules affected.** `showtimes`, `inventory`; migrations/constraints, admin API, tests.

**Implementation steps.** Validate movie/room/cinema relation and start/end; prevent overlapping room schedules transactionally; create inventory idempotently in one transaction; snapshot seat-type pricing for future reservation capture; reject closed showtimes for sale.

**Acceptance criteria.** Duplicate inventory cannot be created; concurrent schedule writes cannot overlap; layout change policy is enforced; cancelled/started showtimes cannot accept reservations.
