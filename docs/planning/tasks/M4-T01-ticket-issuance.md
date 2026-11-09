# M4-T01 — Issue one opaque ticket per confirmed booking item

**Objective.** Create durable admission credentials only for confirmed sales.

**Requirements references.** `requirements.md` §6.10, §7.4, §12.2 scenario 10; security design; ADR-004.

**Dependencies.** M3-T01, M3-T06.

**Files/modules affected.** `tickets`, payment application transaction or durable event consumer; schema and tests.

**Implementation steps.** Generate unguessable opaque unique code/QR payload; bind one ticket to each booking item; create tickets atomically with confirmation or via idempotent durable work; omit PII from QR.

**Acceptance criteria.** Unpaid/failed bookings have no valid tickets; duplicate payment handling creates exactly one ticket per item; ticket lookup is owner-scoped and codes are not sequential.
