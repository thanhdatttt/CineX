# M1-T02 — Implement identity and access control

**Objective.** Provide registration/login and server-enforced customer, staff, and admin identity boundaries.

**Requirements references.** `requirements.md` §2.1, §6.1, §10; security design; ADR-001.

**Dependencies.** M1-T01, M0-T03.

**Files/modules affected.** `auth`, `users`; guards, DTOs, auth integration tests.

**Implementation steps.** Normalize unique email; hash passwords; issue/validate bounded JWTs; implement role guards and service-level resource ownership primitives; use generic login errors and redact credentials.

**Acceptance criteria.** Registration/login work; malformed/expired tokens return 401; authenticated role violations return 403; password/hash/token never appears in response or logs; tests cover ownership enforcement primitives.
