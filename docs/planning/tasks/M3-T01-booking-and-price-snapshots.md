# M3-T01 — Create bookings with authoritative pricing

**Objective.** Convert a valid owned reservation into a booking using server-side totals and immutable price snapshots.

**Requirements references.** `requirements.md` §4, §6.7; API/database design.

**Dependencies.** M2-T03, M2-T02.

**Files/modules affected.** `bookings`; reservation/item schema, price calculator, owner-scoped APIs and tests.

**Implementation steps.** Validate active reservation ownership/state; calculate subtotal and total from persisted item prices; store currency and snapshots; make creation retry-safe; add customer history/detail reads.

**Acceptance criteria.** Client prices are ignored; expired/released/other-user reservations cannot create bookings; history is owner-scoped; later pricing changes do not alter existing totals.
