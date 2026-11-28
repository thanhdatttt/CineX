# M1-T04 — Implement room and physical seat layouts

**Objective.** Manage rooms and seat definitions without corrupting historical inventory.

**Requirements references.** `requirements.md` §6.3; database design; ADR-007.

**Dependencies.** M1-T01, M1-T02, M1-T03.

**Files/modules affected.** `rooms`, `seats`; Prisma constraints, admin DTOs/services, tests.

**Implementation steps.** Implement room/seat CRUD before inventory exists; validate seat type and unique row/number; reject destructive layout edits after showtime inventory; prohibit cascading deletion of historical records.

**Acceptance criteria.** A seat belongs to one room; layout edits after inventory return conflict; old booking seat labels remain resolvable; admin authorization is required.

**Status.** Complete on an isolated PostgreSQL 16 test database (2026-11-28). The [admin room and seat contract](../../architecture/api-design.md#implemented-room-and-seat-operations-m1-t04) exposes room and physical seat CRUD. Migration `20261128040000_lock_room_layout` records the permanent room lock and protects room/seat identities.

**Acceptance evidence.** All eight scenarios in `apps/api/test/rooms-postgres.e2e-spec.ts` passed against PostgreSQL after applying all four migrations. They cover admin authorization, CRUD and room membership, validation and unique labels, conflict after inventory, stable booking references and labels, concurrent inventory generation, and concurrent layout edits. A separate migration check confirmed the backfill locks rooms with pre-existing inventory and leaves unused rooms editable. The full API run passed 38 unit tests and 78 HTTP tests. The migration has been verified locally; no Neon target was used.
