# Database Design

Neon-hosted PostgreSQL is the database for all environments and the authority for inventory and transaction state. Prisma connects using a connection string supplied through environment variables and manages schema/migrations; use migrations for constraints/indexes Prisma cannot express. Use isolated Neon targets for development and integration tests; never run destructive tests or development seeds against production. Docker does not run PostgreSQL. Persist UTC timestamps and exact money (integer minor units for VND or exact decimal), never floating point.

## Entities and ownership

The initial PostgreSQL schema and migration are in `apps/api/prisma/`. All IDs are UUIDs, all instants use `TIMESTAMPTZ` (UTC), and money uses integer minor units with an explicit three-character currency. `users.normalized_email` stores `lower(trim(email))`; its unique constraint and migration check make email normalization an enforced invariant. Physical `seats` contain only reusable layout data. Availability and ownership live on `showtime_seats`, uniquely keyed by `(showtime_id, seat_id)`.

Historical rows use `ON DELETE RESTRICT`: movies and rooms referenced by showtimes, seats referenced by inventory, inventory referenced by reservation/booking lines, and booking/payment/ticket records cannot be removed through cascading deletes. Price is captured on showtime inventory and copied to reservation and booking line snapshots. Change a room layout by creating a new room when showtime inventory already exists (ADR-007).

| Group | Records and key relationships |
|---|---|
| Identity | `User(id, normalized_email, password_hash, role, status)`; role is customer/staff/admin. |
| Catalogue | `Movie`; `Cinema(timezone)`; `CinemaRoom -> Cinema`; `Seat -> CinemaRoom` with row/number/type. A physical seat has no availability state. |
| Schedule | `Showtime -> Movie, CinemaRoom` with start/end/status; `ShowtimeSeat -> Showtime, Seat` with current state, owner reference, version and price. Generate one inventory row per eligible seat. |
| Hold/sale | `Reservation -> User, Showtime`; `ReservationItem -> Reservation, ShowtimeSeat` with price snapshot; `Booking -> User, Reservation`; `BookingItem -> Booking, ShowtimeSeat` with charged price snapshot. |
| Money | `Voucher` and redemption/usage; `Payment -> Booking` with provider reference, amount, currency, status, idempotency reference; `PaymentWebhook` with provider event ID, signature/processing state and safely retained payload. |
| Admission/reliability | `Ticket -> BookingItem` with opaque unique code, status and validation fields; `IdempotencyKey` with scope/key/fingerprint/status/resource response; `OutboxEvent` with aggregate, event type, payload, publish status and timestamps. |

Room-layout changes must not corrupt historical inventory. Prevent destructive seat edits after showtime inventory exists or version/snapshot the layout. A showtime references a room within the cinema context; enforce non-overlapping room schedules (including configured turnover buffer) in the application transaction and, where practical, a PostgreSQL exclusion constraint.

## Invariants and indexes

- Unique `ShowtimeSeat(showtime_id, seat_id)`, normalized user email, voucher code, ticket code, provider event ID, and `(principal, operation, idempotency_key)`.
- Required foreign keys; nonnegative money/quantity; valid start/end and state values. Avoid deleting records needed to interpret bookings, payments, webhooks, or audit history.
- At most one active reservation or confirmed booking owns an inventory row. Encode ownership explicitly (reservation/booking reference plus state) and use conditional transitions/row locks; stale release must match the current owner. A booked seat cannot become available through a new hold.
- Useful indexes: `Showtime(room_id, starts_at, ends_at)` and cinema/date lookup; `ShowtimeSeat(showtime_id, status)`; `Reservation(status, expires_at)`; `Booking(user_id, created_at)`; `Payment(booking_id)` and provider reference; `PaymentWebhook(provider_event_id)` unique; `OutboxEvent(published_at, created_at)`; idempotency scope/key unique and expiry lookup.

## Transaction boundaries

1. **Reservation:** lock all requested `ShowtimeSeat` rows in ascending ID order; after locking, verify showtime open, exact seat membership, current state/owner and hold expiry. Claim all rows and insert reservation/items/price snapshots/idempotency result in one transaction. Roll back all if any seat fails. Reject duplicate seat IDs before persistence.
2. **Booking/voucher:** verify reservation belongs to caller and is active. Compute price/discount/fees on the server; atomically reserve voucher usage under its limits, snapshot applied rules and totals, and create/replay the booking.
3. **Payment start:** atomically verify unexpired hold, transition reservation/booking to payment-pending, and insert payment attempt/idempotency result. Commit before gateway network calls; never hold seat locks while calling the gateway.
4. **Webhook application:** durably insert webhook receipt with unique provider event ID. In an application transaction, lock payment/booking/inventory as needed, verify signature result, references, amount, currency, and legal state; apply the payment once, update all sale states, create ticket rows or ticket outbox work, and insert outbox events.
5. **Expiry/release/cancel:** conditionally change state and free only inventory still referencing that reservation. Expiry requires `ACTIVE` and due according to database time. `PAYMENT_PENDING` is protected until definitive result or configured reconciliation deadline. Cancellation applies cutoff/refund policy atomically and cannot make a seat available before policy permits.
6. **Ticket admission:** single conditional update from valid/unused to admitted, checking showtime and booking; persist validating staff and timestamp in the same transaction.

Every asynchronous effect's outbox row is committed with its domain transition. Redis is never evidence of ownership or payment. See [ADR-002](decisions/ADR-002-database.md) for the selected locking approach and trade-off.
