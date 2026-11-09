# M3-T06 — Apply payment once and reconcile delayed outcomes

**Objective.** Confirm valid payments exactly once or record a safe compensation/reconciliation outcome.

**Requirements references.** `requirements.md` §5.3–5.5, §6.8–6.9, §7.4, §12.2 scenarios 9–14; system/database design; ADR-003, ADR-004.

**Dependencies.** M3-T04, M3-T05, M4-T01 (ticket contract may be coordinated; ticket work can be emitted before implementation).

**Files/modules affected.** `payments`, `bookings`, `reservations`, `inventory`, webhook worker/tests.

**Implementation steps.** Validate provider reference, amount, currency and legal transition; atomically apply success once while reservation still owns seats; do not let late failure overwrite success; mark lost-ownership success compensation/manual review; expose status reconciliation.

**Acceptance criteria.** Duplicate success has one effect; invalid/mismatched callbacks do not confirm; payment-pending survives hold TTL; delayed success follows ADR-003; late success never takes another owner's seats; integration tests cover race outcomes.
