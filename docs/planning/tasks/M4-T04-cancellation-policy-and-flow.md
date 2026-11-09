# M4-T04 — Resolve and implement cancellation/refund policy

**Objective.** Enable cancellation only under an explicit product-approved rule.

**Requirements references.** `requirements.md` §6.7, §6.11, §12.2 scenario 18; ADR-005.

**Dependencies.** M3-T06, M4-T01. Product decision must be recorded in ADR-005 before implementation.

**Files/modules affected.** ADR-005; `bookings`, `payments`, `tickets`, `inventory`; API and integration tests.

**Implementation steps.** Record cutoff, refund amount, fee/voucher treatment and seat-release timing; implement atomic owner/state/cutoff check; simulate refund outcome; invalidate ticket eligibility; persist actor/reason/outcome and idempotency result.

**Acceptance criteria.** No policy is invented in code; cutoff and refund behavior match accepted ADR; repeated cancellation creates no duplicate refund; cancelled tickets fail admission; seats release only when policy allows.
