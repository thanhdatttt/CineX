# CineX --- Product & Engineering Requirements

> **Document type:** Agent execution specification\
> **Project:** CineX --- High-Concurrency Movie Ticket Booking
> Platform\
> **Status:** Implementation baseline\
> **Primary objective:** Build a production-like transactional booking
> system that demonstrates sound system design, concurrency control,
> consistency, idempotency, and failure handling---not merely a movie
> CRUD website.

------------------------------------------------------------------------

## 1. Instructions for the Implementation Agent

Treat this document as the source of truth for project scope and
completion criteria.

1.  Inspect the existing repository before changing anything. Identify
    its framework, module boundaries, coding conventions, scripts,
    environment configuration, database schema, and current
    implementation status.
2.  Preserve working code and established conventions. Do not replace
    the stack or restructure the repository without a concrete technical
    reason.
3.  Implement in vertical slices. Each slice must include persistence,
    business rules, API, validation, authorization, tests, and
    documentation as applicable.
4.  Do not claim a requirement is complete unless its acceptance
    criteria are implemented and tested.
5.  Do not use Redis locks, cache state, or queue delivery as the sole
    correctness mechanism for seat ownership. The relational database
    must enforce the final invariant.
6.  Make state transitions explicit. Reject invalid transitions rather
    than silently repairing them.
7.  Use transactions for operations that must be atomic. Design external
    side effects so they can be retried safely.
8.  Add migrations, indexes, constraints, seed data, tests, and
    operational documentation alongside implementation.
9.  If an existing architectural decision conflicts with this document,
    document the conflict and choose the smallest safe change. Do not
    silently introduce microservices.
10. Keep the application runnable from a clean checkout using documented
    commands.

### 1.1 Definition of Done

The project is complete only when all of the following are true:

-   The core customer and staff/admin flows work end-to-end.
-   A seat cannot be sold or actively held by two customers for the same
    showtime.
-   Reservation expiry and payment-in-progress races are handled safely.
-   Retried requests and duplicate/concurrent payment callbacks do not
    create duplicate effects.
-   Booking, reservation, and payment states remain consistent under
    success and failure scenarios.
-   Asynchronous work is recoverable after process restarts and
    transient failures.
-   Automated tests cover critical business invariants and failure
    scenarios.
-   A reproducible concurrency/load test demonstrates the expected
    outcome.
-   Rate limiting is enforced consistently across backend instances,
    with tested `429` responses and documented Redis-outage behavior.
-   Docker-based local setup and environment configuration are
    documented.
-   Architecture, data model, API behavior, trade-offs, and test results
    are documented.

------------------------------------------------------------------------

## 2. Product Scope

CineX is an online movie ticket booking platform similar in domain to
CGV, Galaxy Cinema, or Lotte Cinema.

### 2.1 User roles

  -----------------------------------------------------------------------
  Role                                Responsibilities
  ----------------------------------- -----------------------------------
  Customer                            Browse movies and showtimes,
                                      inspect seats, reserve seats, pay,
                                      view tickets and booking history,
                                      cancel when policy permits

  Cinema Staff                        Manage or inspect showtime
                                      operations as authorized; validate
                                      tickets at entry

  Admin                               Manage movies, cinemas, rooms,
                                      seats, showtimes, and ticket
                                      pricing
  -----------------------------------------------------------------------

Authorization must be enforced on the server for every protected
operation. Hiding UI controls is not authorization.

### 2.2 In-scope functional modules

1.  Authentication and authorization.
2.  Movie catalogue and movie details.
3.  Cinema, room, and seat-layout management.
4.  Showtime management.
5.  Showtime-specific seat inventory.
6.  Seat reservation with a five-minute hold.
7.  Booking and booking items.
8.  Voucher application and price calculation.
9.  Mock payment gateway and payment webhook processing.
10. Electronic ticket with QR code payload.
11. Booking history and cancellation policy.
12. Background jobs, cache, rate limiting, and operational
    observability.

### 2.3 Explicitly deferred

Do not implement these before all mandatory requirements are complete:

-   Recommendation system.
-   Advanced promotion/rules engine.
-   Production payment-provider integration.
-   Microservices decomposition.
-   Multi-region deployment.
-   Advanced analytics dashboard.
-   WebSocket real-time updates (a later enhancement; polling or refresh
    may be used initially).

------------------------------------------------------------------------

## 3. Technology and Architecture Constraints

Use the repository's existing stack where already established. The
intended baseline is:

  Concern                            Technology
  ---------------------------------- -------------------------------
  Frontend                           React + TypeScript
  UI                                 Tailwind CSS
  Backend                            NestJS
  Database                           PostgreSQL hosted on Neon
  ORM / schema / migrations          Prisma
  Cache / distributed coordination   Redis
  Background jobs                    BullMQ
  Authentication                     JWT
  Payment                            Internal Mock Payment Gateway
  Unit/integration tests             Jest + Supertest
  Load testing                       k6
  Local infrastructure               Docker / Docker Compose for backend, frontend, and optional Redis; database remains Neon-hosted
  CI                                 GitHub Actions

### 3.1 Architecture style

Start with a **Modular Monolith**. Keep domain boundaries clear while
deploying one backend application.

Suggested backend modules:

-   `auth`
-   `users`
-   `movies`
-   `cinemas`
-   `rooms`
-   `seats`
-   `showtimes`
-   `inventory` or `showtime-seats`
-   `reservations`
-   `bookings`
-   `payments`
-   `vouchers`
-   `tickets`
-   `webhooks`
-   `jobs`
-   `outbox`
-   `health`

The exact folder structure may follow the repository's conventions.
Avoid circular module dependencies. Cross-module operations should use
application services and explicit interfaces rather than reaching into
another module's internals.

### 3.2 System design principles

-   Neon-hosted PostgreSQL is the production source of truth for inventory, reservation
    ownership, bookings, and payment records.
-   Redis is an optimization/coordination component, not the authority
    for whether a seat is sold.
-   Queue delivery is at-least-once in practice; consumers must be
    idempotent.
-   External gateway calls must not be performed while holding
    long-running database row locks.
-   Every important state transition must be auditable.
-   Prefer explicit, testable business rules over implicit ORM behavior.
-   Use UTC for persisted timestamps; convert to cinema-local time at
    the API/UI boundary.
-   Store money as integer minor units (for example, VND đồng as integer
    values) or an equivalent exact decimal representation. Never use
    floating-point arithmetic for money.

------------------------------------------------------------------------

## 4. Core Domain Model

The following is a logical model. Adapt names and relations to the
existing schema, but preserve the invariants.

### 4.1 Main entities

  -----------------------------------------------------------------------
  Entity                  Purpose                 Important fields /
                                                  relationships
  ----------------------- ----------------------- -----------------------
  User                    Customer, staff, or     id, email, password
                          admin identity          hash, role, status

  Movie                   Movie catalogue         title, synopsis,
                                                  duration, age rating,
                                                  genre, trailer,
                                                  release/status

  Cinema                  Cinema location         name, address,
                                                  timezone, status

  CinemaRoom              Auditorium within a     cinema_id, name, status
                          cinema                  

  Seat                    Physical seat           room_id, row, number,
                          definition in a room    seat_type

  Showtime                Scheduled movie         movie_id, room_id,
                          screening               starts_at, ends_at,
                                                  status

  ShowtimeSeat            Inventory record for    showtime_id, seat_id,
                          one seat in one         status, version, active
                          showtime                reservation reference
                                                  if modeled

  Reservation             Temporary ownership of  user_id, showtime_id,
                          selected seats          status, expires_at

  ReservationItem         Seat membership in a    reservation_id,
                          reservation             showtime_seat_id, price
                                                  snapshot

  Booking                 Customer purchase       user_id,
                          aggregate               reservation_id, status,
                                                  total, currency

  BookingItem             Purchased seat/ticket   booking_id,
                          line                    showtime_seat_id, price
                                                  snapshot

  Payment                 Payment                 booking_id, provider
                          attempt/transaction     reference, amount,
                                                  status, idempotency
                                                  reference

  PaymentWebhook          Persisted inbound       provider_event_id,
                          gateway event           signature status,
                                                  payload, processing
                                                  status

  Voucher                 Discount definition     code, validity window,
                                                  usage constraints,
                                                  discount rule

  Ticket                  Issued admission        booking_item_id, ticket
                          credential              code/QR payload, status

  IdempotencyKey          Request deduplication   scope, key, request
                          record                  hash, status, response
                                                  reference

  OutboxEvent             Durable event to        aggregate, event type,
                          publish asynchronously  payload, publish
                                                  status, timestamps
  -----------------------------------------------------------------------

### 4.2 Database invariants

At minimum, enforce these at the database level wherever possible:

-   `UNIQUE(showtime_id, seat_id)` on `showtime_seats`.
-   Unique normalized user email.
-   Unique voucher code.
-   Unique ticket code.
-   Unique provider event ID for webhook deduplication.
-   Unique idempotency key within its documented scope (for example,
    user + operation + key).
-   Foreign keys for all required relationships.
-   Non-negative amounts and valid quantity constraints.
-   Indexes for common lookups: showtime by cinema/date, showtime seats
    by showtime/status, reservations by status/expiry, bookings by
    user/created time, payments by booking/provider reference, outbox by
    publish status/created time.

Do not store `AVAILABLE`, `HELD`, or `BOOKED` on the physical `seats`
table. Availability is specific to a showtime. A physical seat may be
booked for one screening and available for another.

### 4.3 Seat inventory invariant

For each `(showtime_id, seat_id)` there must be exactly one inventory
row.

For a given showtime seat, at most one active reservation or confirmed
booking may own it at a time. The database transaction and
constraints/conditional updates must prevent conflicting ownership even
when requests arrive concurrently.

Document how the schema prevents: - duplicate inventory rows; - two
active reservations for one showtime seat; - a new reservation
overwriting a confirmed booking; - an expired reservation being released
after a newer reservation has acquired the seat.

------------------------------------------------------------------------

## 5. State Machines and Business Rules

State transitions are part of the API contract. Implement them centrally
in domain/application services, not scattered across controllers.

### 5.1 Showtime seat state

Required conceptual states:

``` text
AVAILABLE
   |
   v
 HELD ---------> EXPIRED
   |                 |
   |                 v
   +------------> AVAILABLE
   |
   +------------> RELEASED
   |
   v
 BOOKED
```

Interpretation:

-   `AVAILABLE`: can be reserved.
-   `HELD`: owned by an active reservation until its expiry, subject to
    payment-processing rules.
-   `BOOKED`: sold; cannot be reserved again.
-   `EXPIRED`: previous hold expired and is no longer the owner. The
    inventory may transition back to `AVAILABLE`.
-   `RELEASED`: hold was explicitly released/cancelled and the seat is
    available again.

The implementation may represent expiry/release through reservation
state while keeping inventory state simpler, but it must preserve the
same behavior and observability.

### 5.2 Reservation state

Recommended states:

-   `ACTIVE`
-   `PAYMENT_PENDING`
-   `CONFIRMED`
-   `EXPIRED`
-   `RELEASED`
-   `CANCELLED`

Allowed transitions:

  -----------------------------------------------------------------------
  From                    To                      Condition
  ----------------------- ----------------------- -----------------------
  ACTIVE                  PAYMENT_PENDING         Payment attempt starts
                                                  while reservation is
                                                  still valid

  ACTIVE                  EXPIRED                 Expiry is reached and
                                                  no protected payment
                                                  attempt is in progress

  ACTIVE                  RELEASED                Customer explicitly
                                                  releases/cancels the
                                                  hold

  PAYMENT_PENDING         CONFIRMED               A valid successful
                                                  payment is accepted and
                                                  booking is committed

  PAYMENT_PENDING         EXPIRED                 Payment definitively
                                                  failed/expired and
                                                  policy permits release

  PAYMENT_PENDING         RELEASED                Only after payment is
                                                  definitively not
                                                  capable of succeeding

  CONFIRMED               ---                     Terminal for
                                                  reservation ownership;
                                                  cancellation is handled
                                                  through booking policy

  EXPIRED / RELEASED /    ---                     Terminal
  CANCELLED                                       
  -----------------------------------------------------------------------

Do not transition `PAYMENT_PENDING` to `EXPIRED` merely because a Redis
TTL elapsed. A payment may still be in flight or a success callback may
be delayed.

### 5.3 Booking state

Recommended states:

-   `PENDING_PAYMENT`
-   `CONFIRMED`
-   `PAYMENT_FAILED`
-   `CANCELLED`
-   `REFUND_PENDING`
-   `REFUNDED`

A booking becomes `CONFIRMED` only after a verified successful payment
has been applied exactly once and the reservation still legitimately
owns the seats (or the system has entered a documented
payment-reconciliation path).

### 5.4 Payment state

Recommended states:

-   `INITIATED`
-   `PENDING`
-   `SUCCEEDED`
-   `FAILED`
-   `TIMED_OUT`
-   `CANCELLED`
-   `REFUND_PENDING`
-   `REFUNDED`

A payment state transition must be monotonic where appropriate. A late
failure callback must not overwrite a previously accepted success. A
duplicate success callback must not issue another ticket or repeat
downstream effects.

### 5.5 Reservation expiry and payment race

This is a critical requirement.

Scenario: 1. Customer holds seats for five minutes. 2. Customer starts
payment shortly before expiry. 3. Gateway response is delayed or times
out. 4. Reservation expiry worker runs. 5. Gateway later reports
success.

The system must not blindly free the seats at step 4. Implement a
defined protection/reconciliation policy:

-   Starting payment atomically changes reservation/booking to a
    payment-pending state while checking that the reservation is still
    valid.
-   Expiry processing must atomically inspect reservation state and
    expiry time.
-   A payment-pending reservation is not released solely due to the
    original hold TTL.
-   Payment attempts have a bounded processing/reconciliation deadline.
-   If payment is definitively failed, release the seats safely.
-   If payment succeeds while the reservation is still protected and
    owns the seats, confirm the booking.
-   If payment succeeds after ownership has been lost or the screening
    is no longer fulfillable, do not silently confirm an invalid
    booking. Mark it for compensation/reconciliation (for example,
    refund-required/manual-review) and document the behavior.
-   Every race outcome must be covered by integration tests.

The exact timeout durations may be configurable. Defaults must be
documented.

------------------------------------------------------------------------

## 6. Functional Requirements

### 6.1 Authentication and authorization

-   Customer registration and login.
-   Passwords stored using a suitable password hashing algorithm; never
    store plaintext.
-   JWT-based authentication.
-   Role-based authorization for customer, staff, and admin operations.
-   Validate ownership: customers can only view or modify their own
    reservations, bookings, and tickets.
-   Staff can validate tickets only within authorized cinema scope.
-   Admin-only management endpoints.
-   Consistent `401` for unauthenticated requests and `403` for
    authenticated but unauthorized requests.

**Acceptance criteria** - A customer cannot access another customer's
booking by changing an ID. - A customer cannot invoke admin/staff
endpoints. - Invalid, expired, or malformed tokens are rejected. -
Passwords never appear in API responses or logs.

### 6.2 Movie catalogue

-   List currently showing and coming-soon movies.
-   Movie detail includes synopsis, duration, age rating, genres,
    trailer, and release information.
-   Admin can create, update, publish/unpublish, and archive movies.
-   Validate required fields and valid duration/status.
-   Public catalogue endpoints expose only published/appropriate
    records.

**Acceptance criteria** - Filtering/pagination is deterministic. -
Invalid movie references return a documented not-found response. -
Unpublished movies are not exposed in public listings.

### 6.3 Cinema, room, and seat management

-   Admin can manage cinemas and rooms.
-   A room has a stable physical seat layout.
-   Seat types include `STANDARD`, `VIP`, and `COUPLE`.
-   A seat belongs to exactly one room.
-   Do not mutate a room layout in a way that corrupts existing showtime
    inventory. Define behavior for layout changes after showtimes have
    been created (prefer preventing destructive changes or
    versioning/snapshotting the layout).

**Acceptance criteria** - A showtime cannot reference a room from a
different cinema context. - A seat cannot be assigned to multiple
rooms. - Existing bookings remain interpretable if a room layout is
later changed.

### 6.4 Showtime management

-   One movie can have showtimes across multiple cinemas, rooms, and
    times.
-   Admin can create, update, cancel, and list showtimes.
-   Validate `ends_at > starts_at`.
-   Prevent overlapping showtimes in the same room, including
    configurable cleanup/turnover buffer if implemented.
-   On showtime creation, generate one `showtime_seats` inventory row
    for each eligible physical seat.
-   Price may vary by seat type/showtime; snapshot the charged price at
    reservation/booking time.
-   Do not allow new reservations for cancelled, started, or otherwise
    closed showtimes.

**Acceptance criteria** - Duplicate inventory generation is impossible
or safely idempotent. - Concurrent showtime creation/update cannot
create overlapping schedules in the same room. - Existing booking price
does not change when an admin updates future pricing.

### 6.5 Seat map and availability

-   Return room seat layout enriched with showtime-specific state and
    price.
-   Support selecting multiple seats in one reservation request.
-   Clearly distinguish `AVAILABLE`, `HELD`, and `BOOKED`.
-   Do not expose another customer's private details in seat
    availability responses.
-   Availability reads may be cached, but must not be used to authorize
    a reservation.

**Acceptance criteria** - Seat map reflects committed inventory state
after refresh. - Stale cache cannot cause a double booking. - A
reservation attempt always revalidates ownership/availability against
the database.

### 6.6 Seat reservation

-   Customer can reserve one or more seats for one showtime.
-   Default hold duration: five minutes, configurable.
-   Reservation request must be atomic: either all requested seats are
    held or none are.
-   Reject duplicate seat IDs in one request.
-   Reject seats that do not belong to the selected showtime/room.
-   Reject seats that are held by another active reservation or already
    booked.
-   Return reservation ID, held seats, expiry timestamp, and
    authoritative price summary.
-   Customer can release an active reservation.
-   Expired reservations are automatically processed by a background
    worker and can also be lazily checked during reservation attempts.
-   Releasing/expiring a reservation must only release seats still owned
    by that reservation.

**Acceptance criteria** - If one seat in a multi-seat request is
unavailable, no seat from that request remains held. - A user cannot
release another user's reservation. - A stale expiry job cannot release
seats acquired by a newer reservation. - Reservation creation is safe
under concurrent requests. - The five-minute expiry is based on
server/database time, not client clock.

### 6.7 Booking and voucher

-   Create a booking from a valid reservation.
-   Calculate subtotal, discount, fees (if any), and total on the
    server.
-   Never trust client-submitted prices or discount amounts.
-   Voucher validation includes active window, usage limits,
    eligibility, and minimum spend if applicable.
-   Snapshot price and applied discount details so historical bookings
    remain stable.
-   Enforce voucher usage limits transactionally to prevent concurrent
    over-redemption.
-   Expose customer booking history and booking detail.
-   Cancellation follows an explicit policy; do not assume all confirmed
    bookings are refundable.

**Acceptance criteria** - Client price manipulation does not change the
charged amount. - A voucher cannot exceed its configured usage limit
under concurrent requests. - A booking cannot be created from an
expired, released, or another user's reservation. - Repeated booking
submission with the same idempotency key returns the original logical
result.

### 6.8 Payment and Mock Payment Gateway

Create an internal mock gateway/service capable of simulating:

  Scenario    Required behavior
  ----------- ---------------------------------------------
  SUCCESS     Successful payment result
  FAILED      Definitive failure
  TIMEOUT     Caller times out; outcome may be unknown
  DELAYED     Result/callback arrives after a delay
  DUPLICATE   Same webhook/event delivered multiple times
  INVALID     Invalid signature or malformed event

-   Keep gateway simulation behind an interface so a real provider can
    be integrated later.
-   Persist payment attempts and provider references.
-   Verify webhook signatures before applying events.
-   Persist webhook receipt before asynchronous processing.
-   Acknowledge duplicate webhook events without repeating effects.
-   Validate amount, currency, booking reference, and provider
    transaction reference.
-   Do not trust a client redirect or frontend success message as proof
    of payment.
-   Distinguish a timeout/unknown outcome from a definitive payment
    failure.

**Acceptance criteria** - Invalid signature causes no payment/booking
state change. - Duplicate webhook does not duplicate tickets, outbox
events, or payment ledger effects. - A webhook for a different
amount/currency is rejected or quarantined. - A delayed successful
webhook follows the reservation/payment race policy. - Payment result
can be reconciled by querying the mock gateway or processing its
authoritative event.

### 6.9 Idempotency

Implement idempotency for at least: - Reservation creation. -
Booking/payment initiation. - Payment confirmation/application. -
Webhook processing. - Ticket issuance or equivalent event consumer.

Contract:

1.  Client supplies an `Idempotency-Key` for supported mutating
    operations.
2.  Key scope must be documented (recommended: authenticated principal +
    operation).
3.  Persist a request fingerprint/hash with the key.
4.  Same key + same payload returns the original logical result.
5.  Same key + different payload returns a conflict (`409`) and does not
    execute.
6.  Concurrent requests with the same key must converge to one
    operation/result.
7.  Define retention/expiry policy for idempotency records; it must
    exceed the maximum retry/reconciliation window.
8.  Handle in-progress operations explicitly; do not create a second
    operation because the first request is still running.
9.  Store enough response/resource reference information to replay the
    result safely.

**Acceptance criteria** - Replaying the same request many times creates
one reservation/booking/payment effect. - Concurrent requests with the
same key create one logical operation. - Reusing a key with a changed
body returns `409`. - A client timeout followed by retry does not
duplicate the charge.

### 6.10 Electronic tickets and validation

-   Issue one ticket per confirmed booking item.
-   Ticket has an opaque, unguessable unique identifier/QR payload.
-   QR payload must not contain sensitive customer data.
-   Staff validation endpoint checks ticket authenticity, status,
    showtime, and admission window.
-   Prevent the same ticket from being admitted twice through an atomic
    state transition.
-   Record validation time and staff identity.
-   Ticket issuance is idempotent.

**Acceptance criteria** - Failed/unpaid bookings do not receive valid
tickets. - Duplicate ticket issuance creates no duplicate valid
ticket. - Two staff devices scanning the same ticket concurrently result
in at most one successful admission.

### 6.11 Cancellation

-   Enforce the documented cancellation cutoff and refund rules.
-   Cancellation must atomically update booking/ticket eligibility and
    initiate refund workflow when applicable.
-   Do not free a confirmed seat before the cancellation/refund policy
    allows it.
-   Record cancellation actor, reason, timestamp, and outcome.
-   A repeated cancellation request is idempotent.

**Acceptance criteria** - A ticket from a cancelled booking cannot be
validated. - Cancellation after the cutoff is rejected according to
policy. - Duplicate cancellation does not trigger duplicate refunds.

------------------------------------------------------------------------

## 7. Concurrency Control and Consistency Requirements

This is the highest-priority engineering area.

### 7.1 Required invariant

For any showtime seat, no more than one customer can own an active hold
or confirmed purchase at a time. This must remain true under concurrent
requests, retries, worker execution, and multiple backend instances.

### 7.2 Required implementation approaches

Implement one correct primary strategy and provide a
benchmark/comparison for the alternatives:

**Approach A --- Pessimistic locking** - Use a PostgreSQL transaction. -
Lock relevant inventory rows with `SELECT ... FOR UPDATE` (or the ORM's
supported equivalent/raw SQL). - Lock rows in deterministic order to
reduce deadlock risk. - Revalidate state and reservation ownership after
acquiring locks. - Update all requested seats atomically. - Keep
transaction scope short.

**Approach B --- Optimistic/conditional update** - Use a version column
or conditional update with expected current state. - Treat affected-row
count as the concurrency decision. - Roll back the entire multi-seat
reservation if any seat cannot be claimed. - Ensure the database
constraints still protect the invariant.

Do not implement a misleading "check availability, then update later"
flow without atomicity.

### 7.3 Distributed lock guidance

Redis distributed locks may be evaluated as an optimization, but: - A
lock lease can expire while a process is paused. - Network partitions
and process pauses complicate lock ownership. - A lock must have
ownership tokens and safe release semantics if used. - Database
constraints/transactions must remain the final protection. - Explain why
the chosen solution is correct when Redis is unavailable.

### 7.4 Transaction boundaries

At minimum, define and document transaction boundaries for:

-   Claiming all seats in a reservation.
-   Starting payment and protecting the reservation.
-   Applying a successful payment and confirming booking/seat ownership.
-   Releasing/expiring a reservation.
-   Applying voucher usage.
-   Issuing tickets (or creating durable ticket-issuance work).
-   Consuming a webhook event.
-   Recording outbox events for state changes.

Do not make a network call to the payment gateway inside a transaction
that holds seat rows locked.

### 7.5 Consistency model

Document which reads are: - Strongly consistent
(reservation/booking/payment ownership decisions). - Eventually
consistent (cache, notifications, analytics, email). - Read-your-writes
(customer's booking/reservation responses).

A stale seat-map response is acceptable only as a display issue; the
reservation command must always validate against authoritative database
state.

------------------------------------------------------------------------

## 8. Redis, Queue, Outbox, and Background Jobs

### 8.1 Redis

Use Redis for appropriate non-authoritative concerns:
- Cache movie/cinema/showtime catalogue data.
- Distributed rate limiting for API abuse protection.
- Optional short-lived coordination.
- Optional seat-map read optimization.

Requirements:
- Define cache keys, TTLs, and invalidation triggers.
- Invalidate/update relevant cache after committed inventory changes.
- Cache failure must not make booking correctness fail open.
- Never trust cached availability for a seat claim.
- Rate-limit state must use atomic Redis operations (for example, a Lua
  script) so concurrent application instances cannot independently
  exceed the same limit.
- Rate limiting is an abuse-control mechanism, not a substitute for
  database constraints, authorization, or idempotency.
- Define and document behavior when Redis is unavailable. Apply a
  configurable policy per route: sensitive write/authentication routes
  should fail closed or use a conservative local emergency limiter;
  public read routes may fail open with monitoring and infrastructure
  protection. Never silently disable all protection.

### 8.2 BullMQ jobs

Use background jobs for: - Reservation expiry/reconciliation. - Payment
status reconciliation where needed. - Outbox publication. -
Email/notification simulation. - Ticket generation if asynchronous.

Requirements: - Jobs are idempotent. - Configure retry with bounded
exponential backoff and jitter where supported. - Distinguish retryable
from permanent errors. - Configure failed-job retention and a documented
recovery/dead-letter procedure. - Workers must re-read authoritative
state before changing it. - A job may execute more than once without
corrupting state.

### 8.3 Transactional Outbox

When a database state change must cause an asynchronous side effect:

1.  Update domain records and insert an outbox event in the same
    database transaction.
2.  A worker reads unpublished events.
3.  Publish/execute the side effect.
4.  Mark the event as published/processed only after successful
    handling.
5.  Consumers must be idempotent because a crash can occur after side
    effect execution but before acknowledgement.

At minimum, use the outbox for booking-confirmed/ticket-issued or
notification workflows. Document event schema and retry behavior.

### 8.4 Reservation expiry worker

-   Poll or schedule due reservations.
-   Process in bounded batches.
-   Use atomic conditional transitions.
-   Confirm that the reservation is still `ACTIVE`, due, and owns the
    seats before releasing.
-   Do not release `PAYMENT_PENDING` reservations solely based on hold
    expiry.
-   Make repeated execution harmless.
-   Support restart recovery; expiry must not depend on an in-memory
    timer.

------------------------------------------------------------------------

## 9. API Requirements

Use consistent REST conventions and a shared response/error format.
Exact paths can follow existing repository conventions; the following is
a logical API inventory.

### 9.1 Public/customer APIs

  Method   Endpoint (suggested)          Purpose
  -------- ----------------------------- ---------------------------------
  POST     `/auth/register`              Register
  POST     `/auth/login`                 Login
  GET      `/movies`                     Browse movies
  GET      `/movies/:id`                 Movie detail
  GET      `/cinemas`                    Browse cinemas
  GET      `/cinemas/:id/showtimes`      Showtimes for cinema
  GET      `/showtimes/:id`              Showtime detail
  GET      `/showtimes/:id/seats`        Seat map and availability
  POST     `/reservations`               Hold selected seats
  GET      `/reservations/:id`           Reservation detail
  POST     `/reservations/:id/release`   Release hold
  POST     `/bookings`                   Create booking from reservation
  GET      `/bookings`                   Current user's booking history
  GET      `/bookings/:id`               Booking detail
  POST     `/bookings/:id/payment`       Initiate payment
  POST     `/bookings/:id/cancel`        Request cancellation
  GET      `/tickets/:id`                Ticket detail
  POST     `/tickets/validate`           Staff ticket validation

### 9.2 Admin/staff APIs

Provide role-protected CRUD/management endpoints for: - Movies. -
Cinemas. - Rooms and seat layouts. - Showtimes and pricing. - Voucher
definitions. - Ticket validation and operational views.

### 9.3 Webhook API

-   `POST /webhooks/mock-payment` receives mock gateway events.
-   Verify signature and basic schema.
-   Persist event and deduplicate by provider event ID.
-   Return an acknowledgement after durable receipt; process
    asynchronously if appropriate.
-   Expose no unauthenticated administrative data.

### 9.4 API contract requirements

-   DTO validation at the boundary.
-   Explicit pagination and stable ordering for list endpoints.
-   Consistent ISO-8601 timestamps.
-   Explicit currency and integer/decimal money representation.
-   Consistent error shape, including machine-readable error code.
-   Never leak stack traces, SQL, secrets, or internal provider
    credentials.
-   Document authentication and idempotency headers.
-   Add OpenAPI/Swagger documentation if compatible with the repository.

Suggested error codes include: - `UNAUTHENTICATED` - `FORBIDDEN` -
`RESOURCE_NOT_FOUND` - `VALIDATION_ERROR` - `SEAT_UNAVAILABLE` -
`RESERVATION_EXPIRED` - `RESERVATION_NOT_OWNED` -
`IDEMPOTENCY_KEY_REUSED` - `PAYMENT_OUTCOME_UNKNOWN` -
`PAYMENT_FAILED` - `SHOWTIME_CLOSED` - `CANCELLATION_NOT_ALLOWED` -
`RATE_LIMITED`

------------------------------------------------------------------------

## 10. Security and Abuse Prevention

-   Hash passwords using a modern password hashing function.
-   Validate and normalize user input.
-   Apply rate limits to login, reservation creation, payment
    initiation, and webhook endpoints (with suitable provider-specific
    handling).
-   Enforce authorization and resource ownership.
-   Verify webhook signatures using constant-time comparison where
    applicable.
-   Keep secrets in environment variables; never commit `.env` secrets.
-   Redact tokens, passwords, payment secrets, and sensitive payload
    fields from logs.
-   Apply request size limits and safe error handling.
-   Use parameterized database access; avoid unsafe SQL interpolation.
-   Do not expose sequential internal IDs as the only security mechanism
    for tickets or public credentials.

------------------------------------------------------------------------

### 10.1 Rate Limiting Requirements

Implement rate limiting as a first-class backend capability. Use a
NestJS guard/interceptor or equivalent shared middleware; do not
duplicate ad hoc counters in individual controllers.

#### Policy matrix

The following are initial configurable defaults, not hard-coded
business constants. Tune them using load tests and observed traffic.

| Route / operation | Suggested limit | Key dimensions | Notes |
|---|---:|---|---|
| `POST /auth/login` | 5 attempts / minute | IP + normalized account identifier | Apply progressive cooldown after repeated failures; avoid account-enumeration leaks. |
| `POST /auth/register` | 3 requests / hour | IP | Add email verification controls if implemented. |
| `POST /reservations` | 5 requests / minute and 20 / hour | authenticated user + IP | Prevent reservation spam; business rules still enforce active-hold limits. |
| `POST /bookings/:id/payment` | 5 requests / minute | user + booking | Idempotency remains mandatory; rate limiting must not create duplicate charges. |
| `POST /bookings/:id/cancel` | 5 requests / minute | user + booking | Validate booking ownership and state independently. |
| `POST /tickets/validate` | 30 requests / minute | staff user + device/IP | Allow configurable higher limits for legitimate gate throughput. |
| Public catalogue/read APIs | 60 requests / minute | IP, optionally user | Use a separate policy from sensitive write operations. |
| `POST /webhooks/mock-payment` | Provider-specific burst limit | provider identity + source IP | Verify signature and deduplicate event ID; do not rely on IP rate limiting as authentication. |

#### Functional requirements

- Support multiple dimensions: IP address, authenticated user ID,
  normalized account identifier, route, and resource ID where relevant.
- Prefer a token-bucket or sliding-window algorithm. Fixed-window
  counters are acceptable only if boundary bursts are understood and
  documented.
- Use atomic Redis scripts/operations and namespaced keys, for example
  `ratelimit:{policy}:{identity}:{window}`. Hash or otherwise protect
  sensitive identifiers in keys; never store raw credentials.
- Configure limits, windows, burst capacity, and cooldowns through
  environment/configuration, not scattered literals.
- Return HTTP `429 Too Many Requests` with the standard error envelope
  and machine-readable code `RATE_LIMITED`.
- Include `Retry-After`; optionally include standard
  `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset`
  headers when supported by the chosen implementation.
- Do not reveal whether an account exists when throttling login or
  registration requests.
- Exclude health/readiness probes and trusted internal traffic only
  through explicit, documented rules; never trust arbitrary
  client-supplied forwarding headers.
- Apply limits after correctly resolving the client IP behind the
  configured trusted proxy chain.
- Keep rate limiting independent from idempotency: a retried request
  may be throttled, but accepted duplicate requests must still converge
  to the same idempotent result.
- Webhook processing must also have payload-size limits, signature
  verification, durable receipt, and provider-event deduplication.
- Emit metrics for allowed, blocked, and Redis-error decisions by
  policy/route, without logging raw tokens, passwords, or personal
  identifiers.

#### Acceptance tests

- Requests below the configured threshold are allowed.
- Requests over the threshold receive `429`, `RATE_LIMITED`, and a
  meaningful `Retry-After`.
- Two or more backend instances share the same effective limit.
- Concurrent requests cannot bypass the limit due to race conditions.
- IP and user-based policies behave as configured, including
  unauthenticated requests.
- Trusted proxy handling cannot be spoofed by arbitrary
  `X-Forwarded-For` values.
- Redis outage follows the documented per-policy fallback behavior.
- A rate-limited payment retry does not bypass idempotency or cause a
  second payment.
- Webhook duplicates remain deduplicated even when retries occur.

---

## 11. Observability and Operational Behavior

Implement structured logs and useful metrics. At minimum, log/measure:

-   Request ID/correlation ID.
-   Reservation attempts, successes, conflicts, and expiry counts.
-   Seat contention/conflict rate.
-   Payment attempts by outcome.
-   Duplicate idempotency requests and webhook events.
-   Queue depth, retries, and failed jobs.
-   Outbox backlog and oldest unpublished event.
-   API latency and error rate for critical endpoints.

Never log secrets or raw sensitive payment data.

Provide: - Health endpoint for application liveness. - Readiness check
for required dependencies. - Database and Redis connectivity visibility
without exposing credentials. - Clear startup errors for missing
configuration.

------------------------------------------------------------------------

## 12. Testing Strategy and Required Scenarios

Tests must validate business invariants, not only controller status
codes.

### 12.1 Unit tests

Cover: - Reservation and booking state transitions. - Expiry
eligibility. - Payment transition rules. - Voucher calculation and
limits. - Cancellation policy. - Idempotency fingerprint comparison. -
Ticket validation rules. - Price calculation and rounding.

### 12.2 Integration tests

Use a real, isolated Neon PostgreSQL test database where transaction/
locking semantics matter. Mock external gateway behavior, but do not
mock away the database concurrency mechanism. Never run destructive
tests, seed data, or test migrations against production Neon data.

Required scenarios:

1.  One available seat, two concurrent reservation requests: exactly one
    succeeds.
2.  One available seat, 100 concurrent requests: exactly one active
    owner succeeds.
3.  Multi-seat reservation where one seat is unavailable: no partial
    hold remains.
4.  Two concurrent requests with the same idempotency key and same
    payload: one logical reservation/result.
5.  Same idempotency key with different payload: conflict; no second
    effect.
6.  Reservation expires: seats become available through safe conditional
    processing.
7.  Old expiry job runs after a new reservation acquires the seat: new
    reservation remains intact.
8.  Payment begins just before expiry: expiry worker does not
    prematurely release the seat.
9.  Payment definitively fails: reservation/booking transitions and seat
    release follow policy.
10. Duplicate successful webhook: one payment application and one ticket
    per booking item.
11. Invalid webhook signature: no domain state changes.
12. Webhook amount/currency mismatch: no confirmation.
13. Payment timeout followed by retry: no duplicate charge/effect.
14. Delayed success after ownership is lost: compensation/reconciliation
    path is triggered; no invalid double booking.
15. Two concurrent voucher redemptions at the final remaining use: at
    most one succeeds.
16. Two staff validate the same ticket concurrently: at most one
    admission succeeds.
17. Customer attempts to access another user's reservation/booking:
    denied.
18. Cancellation retried: no duplicate refund or release.
19. Redis unavailable: authoritative reservation correctness is
    preserved.
20. Worker restarts with pending expiry/outbox work: work is eventually
    recovered.

### 12.3 Load and concurrency tests

Provide k6 scripts for: - Seat contention on a single seat. -
Reservations across many seats/showtimes. - Read-heavy movie/showtime
browsing. - Payment/webhook duplicate delivery.

The single-seat contention test must assert: - Successful active
ownership count is exactly one. - No duplicate confirmed booking
exists. - No inventory invariant is violated. - Conflicts are returned
with a documented status/error code.

Record test environment, virtual users, duration, request rate, latency
percentiles, error rate, and correctness outcome. Do not report
benchmark numbers without actually running the test.

### 12.4 Test quality gates

-   Critical domain logic has unit tests.
-   Critical transaction flows have integration tests.
-   Concurrency tests run against PostgreSQL, not an in-memory
    substitute.
-   Tests are deterministic where possible and clean up their data.
-   CI runs lint, type-check, unit tests, integration tests (where
    infrastructure is available), and build.

------------------------------------------------------------------------

## 13. Frontend Requirements

The frontend is part of the end-to-end product but must not contain
authoritative business logic.

Required screens: - Login/register. - Movie listing and movie detail. -
Cinema/showtime selection. - Seat map with legend for
available/held/booked. - Reservation countdown based on server-provided
expiry. - Booking summary and voucher entry. - Payment
simulation/result. - Booking history/detail. - QR ticket display. -
Admin management screens for the supported catalogue/showtime
operations. - Staff ticket validation screen.

Frontend rules: - Treat seat-map state as a snapshot; refresh/reconcile
after reservation conflicts. - Disable repeated submit interactions for
usability, but rely on backend idempotency for correctness. - Display
payment `PENDING`/unknown distinctly from `FAILED`. - Never mark a
booking paid based only on a frontend redirect. - Handle expired
reservation and unavailable-seat responses with a recoverable user
flow. - Do not store secrets in browser storage. - Display currency and
time zone consistently.

------------------------------------------------------------------------

## 14. Configuration and Local Development

Provide `.env.example` with descriptions and safe placeholders for: -
Application port and environment. - Neon PostgreSQL connection string
(for example, `DATABASE_URL`, placeholder only). - Redis
connection. - JWT secret and expiry. - Reservation hold duration
(default five minutes). - Payment processing/reconciliation timeout. -
Mock gateway signing secret. - Queue configuration. - Frontend API base
URL.

Use Neon PostgreSQL for all application data. Prisma connects to Neon
using a connection string supplied through environment configuration
and manages schema/migrations. Docker Compose runs the backend and
frontend and may run Redis; it must not run PostgreSQL. Development,
test, and production must use separate Neon databases/branches or other
isolated Neon targets. Document Neon connection configuration and keep
connection strings/secrets out of version control. Include app services
in Docker Compose.

Document commands for: - Install dependencies. - Start infrastructure. -
Run migrations. - Seed development data. - Start backend/frontend. - Run
unit/integration tests. - Run k6 scenarios. - Build production
artifacts.

A clean developer setup must not require undocumented manual database
edits.

------------------------------------------------------------------------

## 15. Implementation Roadmap

Work in dependency order. Do not skip ahead to UI polish while
transactional correctness is incomplete.

### Phase 0 --- Repository discovery and baseline

-   Inspect repository and summarize existing implementation.
-   Identify gaps against this specification.
-   Confirm how to run, test, migrate, and build the project.
-   Record architectural decisions and risks.
-   Establish lint/type-check/test/build baseline.

**Exit criteria:** A concise implementation plan maps existing
files/modules to requirements, and the project baseline is reproducible.

### Phase 1 --- Domain foundation

-   Authentication and role authorization.
-   Movie, cinema, room, seat, and showtime models/APIs.
-   Database migrations, constraints, indexes, seed data.
-   Showtime inventory generation.

**Exit criteria:** Admin can manage catalogue and showtimes; customer
can browse showtimes and inspect seat maps.

### Phase 2 --- Reservation and concurrency

-   Reservation domain/state machine.
-   Atomic multi-seat hold.
-   Pessimistic or optimistic concurrency control.
-   Five-minute expiry and worker recovery.
-   Reservation ownership and release.

**Exit criteria:** All reservation invariants and concurrency
integration tests pass, including 100 concurrent attempts for one seat.

### Phase 3 --- Booking, voucher, and payment

-   Booking creation and price snapshots.
-   Voucher validation/redemption.
-   Mock gateway scenarios.
-   Payment attempts and webhook verification.
-   Idempotency and payment/reservation race handling.

**Exit criteria:** Success, failure, timeout, delayed, duplicate, and
invalid webhook scenarios pass without duplicate charges/effects or
overselling.

### Phase 4 --- Tickets and asynchronous processing

-   Ticket issuance and validation.
-   Transactional outbox.
-   BullMQ consumers and retry policy.
-   Notifications/email simulation.
-   Cancellation/refund workflow according to documented policy.

**Exit criteria:** Ticket issuance and asynchronous effects are
idempotent and recover after worker restart.

### Phase 5 --- Cache, rate limits, observability, and UI completion

-   Redis catalogue caching and invalidation.
-   Rate limiting.
-   Structured logs and health/readiness endpoints.
-   Complete customer/staff/admin flows.
-   Error and loading states.

**Exit criteria:** Redis degradation does not break correctness; user
flows work end-to-end.

### Phase 6 --- Verification and delivery

-   Run full test suite.
-   Run k6 contention/load scenarios.
-   Fix correctness/performance issues found.
-   Document architecture, data model, state machines, transaction
    boundaries, failure recovery, and benchmark results.
-   Verify clean Docker setup and CI.

**Exit criteria:** All mandatory completion criteria in Section 1.1 are
satisfied and evidenced.

------------------------------------------------------------------------

## 16. Required Engineering Documentation

The repository must include or update:

1.  `README.md` --- overview, features, prerequisites, setup, commands,
    demo accounts, and troubleshooting.
2.  `docs/architecture.md` --- component diagram, module boundaries,
    request flows, consistency model, and trade-offs.
3.  `docs/database-design.md` --- ERD or relationship description,
    constraints, indexes, and inventory model.
4.  `docs/reservation-and-concurrency.md` --- state machine, locking
    strategy, transaction boundaries, race scenarios, and benchmark
    comparison.
5.  `docs/payment-and-idempotency.md` --- payment lifecycle, webhook
    verification, idempotency scope, duplicate handling, and
    reconciliation.
6.  `docs/operations.md` --- jobs, retries, outbox, cache invalidation,
    observability, and recovery procedures.
7.  OpenAPI/Swagger contract or equivalent API documentation.
8.  k6 scripts and a report containing only measurements actually
    observed.

Include sequence diagrams for at least: - Concurrent reservation of the
same seat. - Reservation expiry. - Payment success with webhook. -
Payment timeout followed by delayed success. - Duplicate webhook
delivery.

------------------------------------------------------------------------

## 17. Completion Checklist

The agent must report each item as `DONE`, `PARTIAL`, or `NOT DONE`,
with links/paths to implementation and test evidence.

### Product

-   [ ] Customer can browse movies, cinemas, showtimes, and seat maps.
-   [ ] Customer can reserve multiple seats atomically.
-   [ ] Customer can pay through mock gateway scenarios.
-   [ ] Customer can view booking history and QR tickets.
-   [ ] Staff can validate tickets exactly once.
-   [ ] Admin can manage catalogue, rooms, showtimes, and pricing.
-   [ ] Cancellation behavior follows a documented policy.

### Data integrity and system design

-   [ ] Showtime inventory is separate from physical seat definitions.
-   [ ] Unique `(showtime_id, seat_id)` constraint exists.
-   [ ] No double hold or double booking under concurrent access.
-   [ ] Multi-seat reservation is all-or-nothing.
-   [ ] Expiry worker cannot release a newer owner's seats.
-   [ ] Payment-pending reservations are protected from naive TTL
    expiry.
-   [ ] Booking/payment/seat state transitions are transactional and
    validated.
-   [ ] Voucher limits are concurrency-safe.
-   [ ] Money is represented without floating-point errors.

### Reliability

-   [ ] Idempotency covers reservation and payment initiation.
-   [ ] Webhook signature and duplicate event handling are implemented.
-   [ ] Delayed/unknown payment outcome is reconciled safely.
-   [ ] Ticket issuance and validation are idempotent/atomic.
-   [ ] Outbox and queue consumers tolerate duplicate delivery.
-   [ ] Worker restart does not lose required work.
-   [ ] Redis outage cannot cause overselling.

### Quality and delivery

-   [ ] Unit and integration tests pass.
-   [ ] PostgreSQL concurrency tests pass against an isolated Neon test target.
-   [ ] k6 contention test demonstrates exactly one owner for one seat.
-   [ ] Lint, type-check, and build pass.
-   [ ] Docker/local setup works from a clean checkout.
-   [ ] Environment example contains no real secrets.
-   [ ] Required design and operational docs are present.
-   [ ] CI executes the documented quality gates.

------------------------------------------------------------------------

## 18. Final Agent Report Format

At completion, provide a concise but evidence-based report:

1.  **Implemented:** modules and user-visible flows completed.
2.  **System design:** chosen locking strategy, transaction boundaries,
    consistency model, idempotency scope, outbox/queue design.
3.  **Correctness evidence:** test names/results for concurrency,
    expiry/payment race, duplicate webhook, and ticket validation.
4.  **Performance evidence:** k6 configuration and measured results,
    including environment.
5.  **Run instructions:** exact commands for local setup and tests.
6.  **Known limitations:** incomplete requirements, trade-offs, and
    follow-up work.
7.  **Checklist:** mark every item in Section 17 as `DONE`, `PARTIAL`,
    or `NOT DONE`.

A requirement is not complete merely because an endpoint or database
table exists. Completion requires correct behavior, failure handling,
automated tests, and documentation.
