# M1-T04 — Implement room and physical seat layouts

**Objective.** Manage rooms and seat definitions without corrupting historical inventory.

**Requirements references.** `requirements.md` §6.3; database design; ADR-007.

**Dependencies.** M1-T01, M1-T02, M1-T03.

**Files/modules affected.** `rooms`, `seats`; Prisma constraints, admin DTOs/services, tests.

**Implementation steps.** Implement room/seat CRUD before inventory exists; validate seat type and unique row/number; reject destructive layout edits after showtime inventory; prohibit cascading deletion of historical records.

**Acceptance criteria.** A seat belongs to one room; layout edits after inventory return conflict; old booking seat labels remain resolvable; admin authorization is required.
