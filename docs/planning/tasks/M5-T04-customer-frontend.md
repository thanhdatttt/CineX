# M5-T04 — Build customer booking flows

**Objective.** Deliver customer screens for discovery, reservation, payment result, bookings and tickets.

**Requirements references.** `requirements.md` §13; API design.

**Dependencies.** M1-T06, M2-T03, M3-T01, M3-T04, M4-T01.

**Files/modules affected.** React client customer routes/components, API client and UI state.

**Implementation steps.** Implement login/register; movie/cinema/showtime discovery; seat selection and server-expiry countdown; booking/voucher summary; payment pending/unknown states; history/detail and QR ticket display; recover from conflict/expiry.

**Acceptance criteria.** Screens use server prices/state; unknown payment differs from failure; seat conflicts refresh recoverably; no secret or authoritative payment state is stored in client.
