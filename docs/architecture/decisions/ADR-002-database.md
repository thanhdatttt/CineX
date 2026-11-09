# ADR-002: PostgreSQL Inventory and Transaction Strategy

- **Status:** Accepted
- **Date:** 2026-11-09

## Context

The core invariant is one active owner at most for each `(showtime, seat)`, including simultaneous requests, retries, multiple backend instances, stale expiry work, payment callbacks, and Redis outages. Multi-seat requests must be all-or-nothing. Redis locks/TTLs and queue delivery cannot be the final authority.

## Decision

Use PostgreSQL as the source of truth and Prisma for schema/migrations. Store one `ShowtimeSeat` inventory row per screening and physical seat, with unique `(showtime_id, seat_id)`. Do not put availability on the reusable physical `Seat`.

For a reservation, begin a short transaction, select the requested inventory rows `FOR UPDATE` in deterministic seat-ID order, verify all rows exist for the selected showtime and are available (or safely reclaimable), then update ownership/state and insert reservation/items/idempotency result. If any row fails validation, roll back the entire transaction. Use parameterized raw SQL for locking if the Prisma API in use does not provide it. Retain conditional state-and-owner updates and unique constraints as defenses on every path.

Use the same database transaction discipline for payment protection/application, voucher quota redemption, expiry/release, ticket admission, and outbox insertion. Commit the payment attempt/protected reservation before calling the gateway. A release must match the reservation currently owning a seat. A confirmed booking cannot be overwritten. Payment-pending ownership is protected through its configured reconciliation deadline; expiry alone cannot free it.

## Alternatives considered

- **Optimistic conditional updates/version column:** also valid, with affected-row count as the decision and whole-request rollback on any miss. Can reduce lock waiting but increases retry/conflict handling complexity. Benchmark and compare against the selected approach; no performance claim without measured runs.
- **Redis distributed lock:** rejected as authority because leases may expire during pauses/partitions and it does not protect database writes from every path. It may be evaluated as an optimization only while PostgreSQL still enforces correctness.
- **Availability check followed by later update:** rejected because another request can claim the seat between steps.

## Consequences and verification

Use consistent lock ordering to reduce deadlocks and keep lock transactions small. Handle database serialization/deadlock conflicts as retryable only under bounded policy and idempotency. Add PostgreSQL integration tests for multi-seat rollback, concurrent single-seat contention, expiry/new-owner race, payment-start/expiry race, duplicate webhooks, voucher final-use contention, and ticket double-scan. Provide k6 contention scripts and record environment, VUs, duration, request rate, latency, errors, and invariant results only after execution.

Room layout and price changes must not alter historical sales: prevent destructive layout edits after inventory exists or version/snapshot layouts, and persist charged price snapshots on reservation/booking items.
