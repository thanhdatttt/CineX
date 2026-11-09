# Security Design

Apply security in NestJS guards/interceptors and domain services. Every protected endpoint checks both role and resource scope; UI hiding is not authorization.

## Identity, roles, and ownership

- Hash passwords with a modern password hashing function and never return or log hashes. Normalize email before uniqueness checks. Login errors/throttles must not reveal whether an account exists.
- Issue bounded-expiry JWTs; validate signature, expiry, issuer/audience when configured, and reject malformed tokens. Return 401 for invalid/missing identity and 403 for an authenticated identity without permission.
- Customer can access only their own reservations, bookings, and tickets. Admin alone manages catalogue/layout/showtime/pricing/vouchers. Staff ticket validation is restricted to assigned cinema scope. Check ownership in the service query/update, not only by trusting a client ID or controller guard.
- Ticket QR contains an opaque, unguessable unique token, not a sequential ID or personal data. Validate booking status, ticket status, showtime/admission window, and staff scope; atomically consume it once and record actor/time. Cancelled/unpaid bookings cannot produce valid admissions.

## Rate limiting

Use a shared NestJS guard/interceptor backed by atomic Redis scripts/operations, with configuration rather than scattered literals. Combine relevant dimensions (trusted client IP, authenticated user, normalized account, route, resource); hash sensitive identity values in keys. Suggested starting policies from requirements:

| Operation | Initial limit | Key dimensions |
|---|---:|---|
| Login | 5/minute | IP + normalized account; progressive cooldown |
| Registration | 3/hour | IP |
| Reservation | 5/minute and 20/hour | user + IP |
| Payment initiation / cancellation | 5/minute | user + booking |
| Ticket validation | 30/minute | staff + device/IP |
| Public catalogue | 60/minute | IP, optionally user |
| Webhook | Provider-configured burst | provider + source IP; signature remains authentication |

Return HTTP 429, machine code `RATE_LIMITED`, and meaningful `Retry-After`; include standard rate-limit headers when supported. Resolve client IP only through explicitly configured trusted proxies; do not trust arbitrary `X-Forwarded-For`. Exclude probes/internal traffic only through explicit rules. Rate limits remain separate from idempotency and business invariants.

Redis-outage behavior is route-specific: fail sensitive writes/authentication closed or apply a conservative local emergency limiter; public reads may fail open with monitoring and infrastructure protection. Never silently disable all limits. Emit allowed/blocked/Redis-error metrics without raw identifiers. Verify shared limits and spoof-resistant proxy behavior in integration tests.

## Input, secrets, and payment events

- Validate and normalize request data, apply request/body size limits, use parameterized database access, and avoid unsafe SQL interpolation.
- Store secrets only in environment/secret configuration; `.env.example` has placeholders, including a placeholder Neon `DATABASE_URL`. Do not commit actual `.env` files or JWT, Neon database connection string, Redis, or mock-gateway secrets; ensure `.env` is Git-ignored. Fail startup clearly when required values are missing.
- Verify webhook signatures with constant-time comparison, validate event schema and amount/currency/references, persist and deduplicate receipt before processing, and safely quarantine invalid/mismatched events. Frontend redirects are never payment proof.
- Return generic safe errors. Never expose stack traces, SQL, secrets, provider credentials, password/token values, or sensitive payment payload fields in logs or responses.

## Audit and monitoring

Attach request/correlation IDs to logs. Record auditable state transitions with actor, timestamp, and outcome where relevant (reservation release, payment application, cancellation/refund, ticket admission). Monitor auth denials, webhook signature failures, rate-limit decisions/Redis errors, and abnormal contention; aggregate or redact personal identifiers.
