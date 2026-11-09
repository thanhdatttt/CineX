# API Design

Use versioned REST conventions if the existing app has none, DTO validation at every write boundary, and application services for domain rules. Publish an OpenAPI/Swagger contract with auth, idempotency, errors, and examples. Exact route naming may follow repository conventions; the operations below are required.

## Endpoints and access

| Area | Operations | Access |
|---|---|---|
| Auth | `POST /auth/register`, `POST /auth/login` | Public; throttled |
| Catalogue | `GET /movies`, `GET /movies/:id`, `GET /cinemas`, `GET /cinemas/:id/showtimes`, `GET /showtimes/:id`, `GET /showtimes/:id/seats` | Public; only published/appropriate data |
| Reservation | `POST /reservations`, `GET /reservations/:id`, `POST /reservations/:id/release` | Customer; owner checked |
| Booking/payment | `POST /bookings`, `GET /bookings`, `GET /bookings/:id`, `POST /bookings/:id/payment`, `POST /bookings/:id/cancel` | Customer; owner checked |
| Tickets | `GET /tickets/:id`, `POST /tickets/validate` | Ticket owner or authorized staff scoped to cinema |
| Admin | CRUD/publish/archive movies; manage cinemas, rooms/layouts, showtimes/pricing, vouchers | Admin-only |
| Payment webhook | `POST /webhooks/mock-payment` | Provider signature; payload and rate limits |

Admin/staff operational reads and writes must also enforce scope on the server. Never rely on frontend route visibility.

## Request and response rules

- Mutating requests use validated DTOs, reject unknown/invalid values, and return a consistent envelope. Lists have explicit pagination, stable ordering, and documented filters.
- Reservation body identifies showtime and seat IDs only; reject duplicate IDs. Server returns reservation ID/status, held seat IDs and authoritative price summary, plus `expiresAt`. A conflict holds none of the requested seats.
- Booking/payment inputs carry reservation or booking reference, voucher code where applicable, and mock scenario selection only where the development simulator exposes it. Client-submitted price, discount, booking-paid status, and redirect results are never trusted.
- Payment initiation returns an attempt/reference and a distinct `PENDING`, `SUCCEEDED`, `FAILED`, or `OUTCOME_UNKNOWN` result. Unknown is recoverable by status/reconciliation and must not be shown as definitive failure.
- Webhook endpoint validates schema/signature, persists receipt and dedupe key before acknowledgement, then processes synchronously or queues it. Duplicate event ID returns successful acknowledgement without repeating effects. Invalid signature/amount/currency cannot mutate domain state.
- Timestamps are ISO-8601 UTC. Amounts are integer minor units or exact decimal with explicit currency. Responses omit secrets, password hashes, private customer data in seat maps, and internal stack/provider details.

## Idempotency and errors

Require `Idempotency-Key` on reservation creation, booking/payment initiation, and cancellation/refund mutations where retries can repeat effects. Scope to principal + operation; persist request fingerprint, in-progress/completed state, result/resource reference, and retention longer than retry/reconciliation windows. Concurrent same-key requests converge. Same key with different body returns 409 `IDEMPOTENCY_KEY_REUSED` and does not execute.

Use one error body, for example `{ "error": { "code": "SEAT_UNAVAILABLE", "message": "...", "requestId": "..." } }`. Map validation to 400, unauthenticated to 401, forbidden to 403, missing resource to 404, business/idempotency conflict to 409, and throttling to 429 with `Retry-After`. Include codes: `UNAUTHENTICATED`, `FORBIDDEN`, `RESOURCE_NOT_FOUND`, `VALIDATION_ERROR`, `SEAT_UNAVAILABLE`, `RESERVATION_EXPIRED`, `RESERVATION_NOT_OWNED`, `IDEMPOTENCY_KEY_REUSED`, `PAYMENT_OUTCOME_UNKNOWN`, `PAYMENT_FAILED`, `SHOWTIME_CLOSED`, `CANCELLATION_NOT_ALLOWED`, and `RATE_LIMITED`.

## Cache and limits

Seat-map responses are snapshots and may be stale. A reservation command always checks PostgreSQL. Cache catalogue/showtime data with documented TTLs and invalidate/version after admin changes; invalidate seat-map display data after committed inventory transitions. Use atomic Redis rate-limit operations across backend instances, not controller-local counters. Define Redis-outage fallback per route and emit metrics. Limits do not substitute for auth, idempotency, or database constraints.
