# M1-T03 — Implement movie and cinema catalogue management

**Objective.** Enable admins to manage movies/cinemas and public users to browse published catalogue records. Optionally support admin-assisted TMDB lookup/import while keeping CineX's database as the only source used by customer catalogue reads.

**Requirements references.** `requirements.md` §6.2, §6.3, §9; API design.

**Dependencies.** M1-T01, M1-T02.

**Files/modules affected.** `movies`, `cinemas`; optional `integrations/tmdb` adapter; DTOs, services, controllers, integration tests.

**Implementation steps.** Add validated admin create/update/publish/archive operations; add public paginated stable listings and detail reads backed only by CineX persistence; hide unpublished records; define consistent not-found and validation errors. If TMDB is enabled, add backend-only, admin-authorized search and candidate-detail operations, plus an explicit import action that copies supported metadata/artwork into a CineX movie record. Keep the TMDB adapter/config optional, validate and map external responses into CineX DTOs, and allow manual create/edit when TMDB is absent or unavailable. Never call TMDB from customer-facing catalogue endpoints or the browser.

**Acceptance criteria.** Admin-only writes are enforced server-side; public listing exposes only published records; pagination ordering is stable; invalid references return documented errors. When TMDB support is enabled, only authorized admins can search/review/import through the CineX backend; credentials are not exposed to the browser; import persists a CineX-owned editable record; customer listing/detail responses continue to work from CineX's database without TMDB. Core manual catalogue management and public reads work with TMDB unconfigured or unavailable. Apply required TMDB attribution/licensing terms.
