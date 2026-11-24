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
| Optional TMDB support | `GET /admin/tmdb/movies?query=...`, `GET /admin/tmdb/movies/:tmdbId`, `POST /admin/movies/import-tmdb` | Admin-only; backend calls TMDB; import persists a CineX-owned movie |
| Payment webhook | `POST /webhooks/mock-payment` | Provider signature; payload and rate limits |

### Implemented catalogue operations (M1-T03)

- `GET /movies?page=1&limit=20&filter=nowShowing|comingSoon` lists CineX-persisted published movies. `nowShowing` requires a scheduled showtime whose end is in the future; `comingSoon` selects movies with a date-only `releaseDate` after the current UTC date. Without a filter, movies with or without a release date are included. Results sort by `releaseDate`, title, then ID. `GET /movies/:id` returns only published records.
- `GET /cinemas?page=1&limit=20` and `GET /cinemas/:id` return active CineX cinemas only; listings sort by name then ID.
- `POST /admin/movies`, `PATCH /admin/movies/:id`, and `POST /admin/movies/:id/{publish,unpublish,archive}` manage locally owned movie records. New movies start as drafts.
- `POST /admin/cinemas`, `PATCH /admin/cinemas/:id`, and `POST /admin/cinemas/:id/{activate,deactivate,archive}` manage cinemas. Public responses omit inactive and archived cinemas.
- Catalogue lists return `{ data, meta: { page, limit, total, totalPages } }`; detail and write responses return `{ data }`. DTO validation rejects unknown fields. Invalid UUIDs return 400, missing or non-public records return 404, and authenticated non-admin writes return 403.
- TMDB support is optional and is not required for M1-T03. When `TMDB_API_READ_ACCESS_TOKEN` is configured on the API server, admins can use `GET /admin/tmdb/movies?query=...`, `GET /admin/tmdb/movies/:tmdbId`, and `POST /admin/movies/import-tmdb` with `{ "tmdbId": 123 }` to import or refresh a linked record. Include `movieId` to explicitly link/update a particular CineX movie; its publication status and local showtime/pricing data are preserved. Search/detail routes return candidates only and never persist changes. TMDB credentials are sent only as a server-side bearer token, and TMDB outages or an unset token do not disable manual catalogue management or public CineX reads.
- Imported records retain their TMDB ID and poster/backdrop URLs. Movie metadata remains editable in CineX. Before displaying TMDB-powered data, the application must follow TMDB attribution rules, including the approved TMDB logo and this notice in an About/Credits section: “This product uses the TMDB API but is not endorsed or certified by TMDB.” Commercial use may require a separate TMDB license.

Admin/staff operational reads and writes must also enforce scope on the server. Never rely on frontend route visibility.

Keep TMDB credentials and outbound calls in the backend integration adapter. Search/detail results are candidate data only: importing requires an explicit admin action and creates/updates a persisted CineX movie record. Public `GET /movies` and `GET /movies/:id` read CineX persistence only and must not proxy to TMDB. If TMDB is absent or down, manual admin catalogue operations and public CineX reads remain available.

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
