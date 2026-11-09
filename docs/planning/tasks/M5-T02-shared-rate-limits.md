# M5-T02 — Enforce shared Redis-backed rate limits

**Objective.** Apply configurable atomic abuse limits across API instances with documented outage behavior.

**Requirements references.** `requirements.md` §8.1, §10.1; security design; ADR-006.

**Dependencies.** M0-T02, M1-T02, M2-T03, M3-T04, M4-T02.

**Files/modules affected.** Shared rate-limit guard/config; auth, reservation, payment, ticket, catalogue and webhook routes; integration tests.

**Implementation steps.** Implement atomic Redis limiter and hashed identity keys; resolve client IP only through configured trusted proxies; set configurable route policies; return 429/Retry-After; fail closed for sensitive routes and fail open for public reads per ADR.

**Acceptance criteria.** Concurrent requests and multiple instances share limits; spoofed forwarding headers do not bypass policy; Redis outage matches ADR-006; decisions are measured without raw identifiers.
