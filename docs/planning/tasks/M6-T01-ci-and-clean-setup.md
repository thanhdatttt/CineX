# M6-T01 — Gate changes with CI and verify clean setup

**Objective.** Automate repository quality checks and prove documented setup from a clean checkout.

**Requirements references.** `requirements.md` §1.1, §12.4, §14, §17.

**Dependencies.** M0-T01, M0-T02, M0-T03, M5-T06.

**Files/modules affected.** GitHub Actions; README/setup scripts; test/build configuration.

**Implementation steps.** Add CI for lint, typecheck, unit tests, PostgreSQL integration tests and builds; configure an isolated Neon test target without production Neon credentials; validate migrations/seeds and Docker startup with documented commands; do not add a PostgreSQL Docker service.

**Acceptance criteria.** CI runs documented quality gates; clean setup needs no manual database edits; environment template contains placeholders only; failed required checks block success status.
