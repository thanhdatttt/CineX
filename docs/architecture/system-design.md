# System Design

## Deployment and boundaries

CineX is one deployable NestJS modular monolith and a React + TypeScript client styled with Tailwind CSS. Do not split it into services. Keep each module's persistence and rules behind its application services; other modules call those services rather than importing controllers or reaching into internals.

| Module | Owns |
|---|---|
| `auth`, `users` | Credentials, JWT identity, roles, user status |
| `movies`, `cinemas`, `rooms`, `seats` | Published catalogue and physical cinema layout |
| `showtimes`, `inventory` | Schedule, pricing, per-showtime seat inventory |
| `reservations` | Multi-seat holds, ownership, expiry and release |
| `bookings`, `vouchers` | Price calculation/snapshots, redemption, cancellation policy |
| `payments`, `webhooks` | Attempts, mock gateway adapter, event receipt and application |
| `tickets` | Ticket issuance and one-time admission validation |
| `jobs`, `outbox`, `health` | Durable asynchronous work and operational endpoints |

Controllers handle HTTP mapping, DTO validation, authentication/authorization guards, and response formatting. Application services implement use cases and state transitions. Prisma is the persistence adapter; a gateway interface isolates payment simulation. Frontend logic is for presentation and recovery only, never authoritative pricing, availability, authorization, or payment confirmation.

## State and consistency

PostgreSQL owns inventory, active reservation ownership, booking/payment state, idempotency records, durable webhook receipts, voucher redemptions, tickets, and outbox events. Redis is limited to catalogue/seat-map caching, shared rate limits, and optional coordination. BullMQ delivery is at least once; workers must reread PostgreSQL before every state change and be idempotent.

| State | Allowed next states | Rule |
|---|---|---|
| Reservation `ACTIVE` | `PAYMENT_PENDING`, `EXPIRED`, `RELEASED`, `CANCELLED` | Expire/release only while still owner; payment starts only before expiry |
| `PAYMENT_PENDING` | `CONFIRMED`, `EXPIRED`, `RELEASED` | Never release only because original hold TTL elapsed; await definitive result or bounded deadline/reconciliation |
| `CONFIRMED` | terminal for reservation | Cancellation is a booking policy operation |
| Booking `PENDING_PAYMENT` | `CONFIRMED`, `PAYMENT_FAILED`, `CANCELLED` | Confirm only after verified payment and valid seat ownership |
| Payment `INITIATED`/`PENDING`/`TIMED_OUT` | `SUCCEEDED`, `FAILED`, `CANCELLED` | Timeout is unknown, not failure; accepted success cannot be overwritten by late failure |

Reservation, booking, payment, voucher, cancellation, and ticket-admission decisions are strongly consistent. Catalogue and seat-map caches, notifications, and email are eventually consistent. A stale seat map is a display issue; commands always revalidate against PostgreSQL. Successful writes return enough committed state for read-your-writes.

## Critical request flows

1. **Browse:** read published catalogue/showtimes; cache only public display data. Cache keys include resource/query dimensions. Invalidate or version relevant entries after catalogue, schedule, pricing, or inventory commits. Cache failure falls back to PostgreSQL.
2. **Reserve seats:** validate authenticated owner, showtime state, unique seat IDs, and idempotency fingerprint. In one short database transaction lock inventory in deterministic order, revalidate availability/room membership, claim all seats, save reservation/items with server-calculated price snapshots, and persist the replay result. Any conflict rolls back all seats.
3. **Create booking / start payment:** calculate totals and voucher eligibility server-side; redeem limited voucher usage transactionally. In a separate short transaction verify reservation ownership/expiry, create or reuse the booking, mark reservation payment-pending, and persist the payment attempt. Call the mock gateway only after commit and outside seat locks.
4. **Receive payment:** verify signature and schema, persist/deduplicate webhook by provider event ID, then acknowledge durable receipt. Application validates booking/provider reference, amount, currency, and state. In one transaction confirm payment/booking/reservation and seats, create one ticket per item or durable ticket work, and insert outbox events.
5. **Expire/release:** scheduled worker polls due reservations in bounded batches. A conditional transaction confirms `ACTIVE`, due, and still-owner before releasing seats. Payment-pending reservations get reconciliation, not blind TTL release. Repeated or stale jobs do nothing to a newer owner.
6. **Late success:** if the reservation remains protected and owns seats, confirm. If ownership is gone or fulfillment is impossible, record compensation/refund-required or manual-review state; never seize a new owner's seats or silently confirm.
7. **Validate ticket:** in an atomic update verify opaque code, confirmed/non-cancelled booking, showtime/admission window, and staff cinema scope; record staff and time. At most one concurrent scan succeeds.

## Reliability and operations

Write each outbox event in the same transaction as its domain change. A dispatcher publishes pending events; consumers deduplicate by event ID. Configure bounded exponential retries with jitter, distinguish permanent errors, retain failed jobs, and document replay/dead-letter recovery. Expiry and reconciliation are recoverable from database state after restart; do not rely on in-memory timers.

Use UTC for persisted timestamps and ISO-8601 at the API; convert to cinema timezone for display. Use integer minor units or exact decimal for money. Provide liveness and dependency readiness checks, clear missing-config startup errors, request/correlation IDs, and metrics/logs for seat conflicts, payment outcomes, duplicate keys/webhooks, rate-limit decisions, queue retries/depth, and oldest unpublished outbox event. Never log secrets or sensitive payment payloads.
