# M1-T03 — Implement movie and cinema catalogue management

**Objective.** Enable admins to manage movies/cinemas and public users to browse published catalogue records.

**Requirements references.** `requirements.md` §6.2, §6.3, §9; API design.

**Dependencies.** M1-T01, M1-T02.

**Files/modules affected.** `movies`, `cinemas`; DTOs, services, controllers, integration tests.

**Implementation steps.** Add validated admin create/update/publish/archive operations; add public paginated stable listings and detail reads; hide unpublished records; define consistent not-found and validation errors.

**Acceptance criteria.** Admin-only writes are enforced server-side; public listing exposes only published records; pagination ordering is stable; invalid references return documented errors.
