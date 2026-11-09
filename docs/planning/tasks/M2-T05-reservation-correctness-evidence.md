# M2-T05 — Prove reservation invariants on PostgreSQL

**Objective.** Demonstrate reservation behavior under contention, retries, partial conflicts, and expiry races.

**Requirements references.** `requirements.md` §7, §12.2 scenarios 1–8 and 19; ADR-002.

**Dependencies.** M2-T03, M2-T04.

**Files/modules affected.** Reservation PostgreSQL integration test suite and test database setup.

**Implementation steps.** Add concurrent single-seat and same-key cases; test 100 contenders; test multi-seat rollback and stale expiry/new owner; assert database ownership rows, not just HTTP responses.

**Acceptance criteria.** Exactly one active owner wins contention; partial holds never persist; retries converge; stale expiry preserves newer owner; test run uses real PostgreSQL and records command/result.
