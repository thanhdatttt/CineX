# M1-T06 — Expose public showtime and seat-map reads

**Objective.** Provide browse endpoints that show current showtime-specific inventory without leaking private ownership data.

**Requirements references.** `requirements.md` §6.4–6.5, §9; API design.

**Dependencies.** M1-T03, M1-T05.

**Files/modules affected.** `showtimes`, `inventory`; public read DTOs/controllers and tests.

**Implementation steps.** Add cinema/date showtime queries and showtime details; return layout joined to inventory state/price; exclude reservation/customer identifiers; document response ordering and stale snapshot behavior.

**Acceptance criteria.** Seat map distinguishes available/held/booked; no private customer data is returned; committed inventory appears on refresh; read data is never used to authorize a hold.
