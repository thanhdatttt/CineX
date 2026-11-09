# M3-T04 — Start payment and protect reservation ownership

**Objective.** Atomically transition a valid hold to payment-pending before contacting the gateway.

**Requirements references.** `requirements.md` §5.5, §6.8–6.9, §7.4; ADR-003, ADR-004.

**Dependencies.** M2-T01, M2-T02, M3-T01, M3-T03.

**Files/modules affected.** `payments`, `bookings`, `reservations`; payment API, schema and integration tests.

**Implementation steps.** In short transaction verify owner, active status, database expiry and total; set bounded reconciliation deadline and payment-pending state; persist attempt/idempotency; commit then call gateway; map timeout to unknown.

**Acceptance criteria.** Payment cannot start on expired/foreign booking; expiry worker cannot release protected seats; no gateway network call occurs while inventory rows are locked; duplicate start replays one attempt.
