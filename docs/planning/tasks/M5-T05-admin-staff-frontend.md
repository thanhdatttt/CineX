# M5-T05 — Build admin and staff operational screens

**Objective.** Provide UI for supported catalogue/schedule management and staff ticket validation.

**Requirements references.** `requirements.md` §2.1, §13.

**Dependencies.** M1-T03, M1-T04, M1-T05, M4-T02.

**Files/modules affected.** React client admin/staff routes and API client.

**Implementation steps.** Add admin movie/cinema/room/showtime/pricing workflows; communicate immutable-layout conflicts; add staff scan/validation result flow; show clear authorization and validation errors.

**Acceptance criteria.** UI exposes only supported operations; backend remains the authority; layout conflict is actionable; validation clearly distinguishes admitted, already used, invalid and out-of-scope tickets.
