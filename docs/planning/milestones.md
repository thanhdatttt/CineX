# CineX Milestones

Each milestone is complete only when its exit criteria are evidenced. Task IDs link to focused implementation briefs.

## M0 — Runnable foundation

Tasks: [M0-T01](tasks/M0-T01-bootstrap-repository.md), [M0-T02](tasks/M0-T02-local-infrastructure.md), [M0-T03](tasks/M0-T03-configuration-and-quality-baseline.md).

**Exit:** chosen baseline stack builds from a clean checkout; Neon connection configuration, isolated Neon targets for dev/test, Redis setup, environment template, migration/seed/test commands, and CI quality commands are documented and reproducible. Docker Compose runs backend/frontend and may run Redis; it does not run PostgreSQL.

## M1 — Identity and catalogue

Tasks: [M1-T01](tasks/M1-T01-domain-schema.md), [M1-T02](tasks/M1-T02-auth-and-authorization.md), [M1-T03](tasks/M1-T03-catalogue-management.md), [M1-T04](tasks/M1-T04-rooms-and-layout-policy.md), [M1-T05](tasks/M1-T05-showtime-and-inventory.md), [M1-T06](tasks/M1-T06-public-catalogue-and-seat-map.md).

**Exit:** admin manages supported catalogue/schedules; public users browse movies, cinemas, showtimes and seat maps; inventory is unique per showtime/seat and layout history is safe.

## M2 — Safe reservations

Tasks: [M2-T01](tasks/M2-T01-reservation-state-and-data.md), [M2-T02](tasks/M2-T02-idempotency-foundation.md), [M2-T03](tasks/M2-T03-atomic-seat-reservation.md), [M2-T04](tasks/M2-T04-release-and-expiry.md), [M2-T05](tasks/M2-T05-reservation-correctness-evidence.md).

**Exit:** reservation is all-or-nothing, owner-scoped, retry-safe, recoverable after restart, and proven against PostgreSQL contention (including 100 contenders for one seat).

## M3 — Booking and payment

Tasks: [M3-T01](tasks/M3-T01-booking-and-price-snapshots.md), [M3-T02](tasks/M3-T02-voucher-redemption.md), [M3-T03](tasks/M3-T03-mock-payment-adapter.md), [M3-T04](tasks/M3-T04-payment-start-and-protection.md), [M3-T05](tasks/M3-T05-webhook-receipt-and-verification.md), [M3-T06](tasks/M3-T06-payment-application-and-reconciliation.md).

**Exit:** booking totals are server-calculated; payment attempts, signed events, duplicates and unknown outcomes follow documented transactional and reconciliation rules without overselling or duplicate effects.

## M4 — Tickets and operations

Tasks: [M4-T01](tasks/M4-T01-ticket-issuance.md), [M4-T02](tasks/M4-T02-ticket-admission.md), [M4-T03](tasks/M4-T03-outbox-and-workers.md), [M4-T04](tasks/M4-T04-cancellation-policy-and-flow.md).

**Exit:** confirmed booking yields one opaque ticket per item; admission is single-use and scoped; async work survives retries/restarts. Cancellation ships only after its policy is approved and recorded.

## M5 — Complete product and hardening

Tasks: [M5-T01](tasks/M5-T01-redis-cache.md), [M5-T02](tasks/M5-T02-shared-rate-limits.md), [M5-T03](tasks/M5-T03-observability-and-health.md), [M5-T04](tasks/M5-T04-customer-frontend.md), [M5-T05](tasks/M5-T05-admin-staff-frontend.md), [M5-T06](tasks/M5-T06-security-and-api-contract.md), [M5-T07](tasks/M5-T07-required-architecture-docs.md).

**Exit:** customer/admin/staff critical flows work end-to-end; Redis degradation follows ADR-006; authorization, operational signals, API contract, and required docs are in place.

## M6 — Verified delivery

Tasks: [M6-T01](tasks/M6-T01-ci-and-clean-setup.md), [M6-T02](tasks/M6-T02-k6-contention-and-load.md), [M6-T03](tasks/M6-T03-final-requirements-audit.md).

**Exit:** documented CI and clean Docker setup work; PostgreSQL integration tests run against isolated Neon test data and k6 evidence is recorded from actual runs; requirements checklist reports DONE/PARTIAL/NOT DONE with evidence.
