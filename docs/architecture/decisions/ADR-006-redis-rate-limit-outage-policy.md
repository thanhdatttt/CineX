# ADR-006: Redis Rate-Limit Outage Policy

- **Status:** Accepted
- **Date:** 2026-11-09

## Context

Rate limits should apply across backend instances. If Redis is unavailable, sensitive endpoints must not silently become unthrottled, while public browsing should remain available where practical.

## Decision

- Use Redis-backed atomic rate limits for authentication, reservation, payment, cancellation, ticket validation, and public catalogue routes.
- When Redis is unavailable, fail closed with a retryable service error on sensitive write/authentication routes. Allow public catalogue reads to continue and log/measure the Redis failure.
- Derive client IP only from explicitly trusted proxies. Ignore arbitrary `X-Forwarded-For` values.
- Return HTTP 429 with `RATE_LIMITED` and `Retry-After` when a limit is exceeded.

## Consequences

This policy has two outage behaviors: sensitive operations stop temporarily; public reads continue. A local emergency limiter, per-route fallback configuration, and probe/internal-traffic exceptions are deferred until deployment needs justify them. Rate limits do not replace authorization, idempotency, or database constraints.
