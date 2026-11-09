# M2-T03 — Implement atomic multi-seat holds

**Objective.** Claim all requested seats or none using PostgreSQL as final authority.

**Requirements references.** `requirements.md` §6.6, §7; database design; ADR-002, ADR-004.

**Dependencies.** M2-T01, M2-T02, M1-T05.

**Files/modules affected.** `reservations`; inventory persistence/service, API DTO/controller, PostgreSQL integration tests.

**Implementation steps.** Require authenticated owner and idempotency key; reject duplicate IDs; in a short transaction lock inventory in ascending ID order; revalidate showtime/membership/state and server price; claim and persist reservation/items/result atomically.

**Acceptance criteria.** Unavailable seat causes full rollback; same seat cannot have two active owners; cross-room/unknown seats fail; price and expiry come from server/database; concurrent identical retries replay one result.
