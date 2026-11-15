# Security Design

Apply security in NestJS guards/interceptors and domain services. Every protected endpoint checks both role and resource scope; UI hiding is not authorization.

## Identity, roles, and ownership

- Hash passwords with a modern password hashing function and never return or log hashes. Normalize email before uniqueness checks. Login errors/throttles must not reveal whether an account exists.
- M1-T02 uses Node `scrypt` with a fresh 16-byte salt and constant-time hash comparison. Registration always creates `CUSTOMER`; role changes are not accepted from request bodies. Access JWTs use HS256 with a required 32-byte secret, `cinex-api` issuer, `cinex-client` audience, a 10-minute default lifetime, and a configurable maximum of 24 hours. Refresh tokens are random 256-bit opaque values with a 7-day default lifetime; only SHA-256 hashes are stored in `refresh_tokens`.
- `POST /auth/refresh` atomically revokes the presented token and issues its replacement in the same token family. A replay of a revoked token revokes every still-active token in that family. `POST /auth/logout` revokes the family represented by its refresh token; already-issued access tokens remain valid only until their short expiry.
- `JwtAuthGuard` validates the bearer token on each protected request and loads the user's current status and role from PostgreSQL. Missing, malformed, expired, inactive, or unknown users receive 401. `RolesGuard` returns 403 for authenticated users without the route's required role. `UsersService` separately enforces owner-or-admin access before reading a profile.
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
