# M0-T01 — Bootstrap the application workspace

**Status:** Complete (2026-11-11). Root scripts, API/web builds, lint, typecheck, and unit tests passed; both Docker app health checks passed.

**Objective.** Establish the smallest runnable React/TypeScript + Tailwind client and NestJS modular-monolith API, preserving repository conventions where they exist.

**Requirements references.** `requirements.md` §1, §3, §14, §15 Phase 0; ADR-001.

**Dependencies.** None.

**Files/modules affected.** Root workspace manifests; `apps/api`; `apps/web`; shared tooling/configuration as justified.

**Implementation steps.** Inspect available runtime/tooling; choose a minimal workspace layout; scaffold API and client; add root scripts for install, dev, lint, typecheck, test, and build; document the layout.

**Acceptance criteria.** Both app shells start and build from a clean checkout; scripts are discoverable; NestJS remains a modular monolith; no unnecessary services or framework are introduced.
