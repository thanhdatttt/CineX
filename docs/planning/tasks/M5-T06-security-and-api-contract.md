# M5-T06 — Harden API contract and security boundaries

**Objective.** Publish consistent API documentation and verify input, authorization, errors, and secret-handling rules.

**Requirements references.** `requirements.md` §9–10, §12.4; API/security design.

**Dependencies.** M1-T02, M1-T06, M2-T03, M3-T05, M4-T02.

**Files/modules affected.** Shared API validation/error handling; OpenAPI/Swagger setup; security integration tests.

**Implementation steps.** Reject invalid/unknown write fields; standardize error envelope/codes; document auth and idempotency; enforce body limits and safe SQL; audit ownership, role/scope, proxy trust, webhook signature and log redaction.

**Acceptance criteria.** OpenAPI describes supported endpoints and errors; unauthenticated/forbidden/invalid/conflict/throttled cases map correctly; security tests prove ownership and scope checks; no stack/secret leakage.
