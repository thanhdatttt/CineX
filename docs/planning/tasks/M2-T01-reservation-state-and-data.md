# M2-T01 — Define reservation state and persistence

**Objective.** Implement reservation records and explicit legal state transitions before exposing seat claims.

**Requirements references.** `requirements.md` §5.1–5.5, §7.4; system/database design; ADR-002, ADR-003.

**Dependencies.** M1-T05.

**Files/modules affected.** `reservations`; schema/migration; domain transition service and unit tests.

**Implementation steps.** Add reservation/items, owner, expiry, price snapshot, and inventory owner references; implement allowed transitions; make payment-pending protected until reconciliation deadline; use database time for due checks.

**Acceptance criteria.** Illegal transitions are rejected; confirmed ownership cannot be overwritten; expired ownership can only be released conditionally by its current reservation; state rules have unit coverage.
