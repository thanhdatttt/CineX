# M5-T01 — Add non-authoritative catalogue caching

**Objective.** Cache public catalogue/showtime reads while preserving PostgreSQL authority.

**Requirements references.** `requirements.md` §8.1; system/API design; ADR-002.

**Dependencies.** M1-T03, M1-T05, M1-T06, M0-T02.

**Files/modules affected.** `movies`, `cinemas`, `showtimes`, `inventory`; cache adapter/config and tests.

**Implementation steps.** Define namespaced keys and TTLs; invalidate/version after catalogue, schedule, price and committed inventory changes; fall back to database on cache failure; never use cached availability for claims.

**Acceptance criteria.** Cache improves only reads; reservation still revalidates in PostgreSQL; stale keys are invalidated/versioned; Redis outage does not compromise correctness.
