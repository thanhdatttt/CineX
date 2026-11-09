# ADR-004: Idempotency and Webhook Processing

- **Status:** Accepted
- **Date:** 2026-11-09

## Context

Clients and payment callbacks may be retried after a timeout or lost response. A retry must not reserve seats twice or apply a payment more than once.

## Decision

- Persist idempotency keys in PostgreSQL for reservation creation, booking/payment initiation, and cancellation/refund mutations when enabled. Scope each key to the authenticated user and operation, and store a request fingerprint and resulting resource.
- A retry with the same key and request returns the original result. Reusing the key with a different request returns HTTP 409. Enforce uniqueness in the database.
- Deduplicate payment webhooks by the provider event ID. Verify the signature and required payment fields, persist the receipt before acknowledging it, and apply each valid event at most once.
- Keep payment state changes and their directly required database effects in one transaction. Add a transactional outbox only when an actual asynchronous side effect, such as notification delivery, is introduced.

## Consequences

PostgreSQL is the durable source for idempotency and webhook deduplication; Redis is not used for correctness. Tests should cover same-key retries, key reuse with a different request, and duplicate webhook delivery. Generalized outbox consumers and retry/replay tooling are deferred until background side effects need them.
