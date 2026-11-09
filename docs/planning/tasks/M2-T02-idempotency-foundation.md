# M2-T02 — Add durable idempotency records

**Objective.** Provide shared persistence and contract for retry-safe mutation requests.

**Requirements references.** `requirements.md` §6.9; API/database design; ADR-004.

**Dependencies.** M1-T01, M1-T02.

**Files/modules affected.** `idempotency` persistence/service; shared request/response helpers; integration tests.

**Implementation steps.** Scope keys by principal and operation; store fingerprint, in-progress/completed result reference and retention; serialize concurrent same-key requests; reject changed payload with 409.

**Acceptance criteria.** Same-key/same-payload retries return one logical result; concurrent duplicates converge; changed payload returns `IDEMPOTENCY_KEY_REUSED`; retention exceeds retry/reconciliation horizon.
