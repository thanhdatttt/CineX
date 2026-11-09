# M5-T07 — Complete required architecture and operations documentation

**Objective.** Align implementation documentation with actual behavior and add required sequence diagrams.

**Requirements references.** `requirements.md` §16, §18.

**Dependencies.** M2-T05, M3-T06, M4-T03, M5-T03.

**Files/modules affected.** README; architecture/database/reservation-concurrency/payment-idempotency/operations docs; OpenAPI and diagrams.

**Implementation steps.** Document modules, schema, constraints, locking, transaction boundaries, consistency, payment/reconciliation, job recovery, cache/rate policy and run commands; add required reservation/expiry/payment/duplicate-webhook sequence diagrams.

**Acceptance criteria.** All §16 artifacts exist or point to equivalent existing paths; diagrams match code; no unmeasured benchmark claim is made; operational recovery steps are actionable.
