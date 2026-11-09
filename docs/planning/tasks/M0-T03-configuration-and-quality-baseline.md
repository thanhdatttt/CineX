# M0-T03 — Add configuration and quality baseline

**Objective.** Define safe startup configuration and repeatable quality commands for the new codebase.

**Requirements references.** `requirements.md` §1, §14, §12.4; ADR-001, ADR-003.

**Dependencies.** M0-T01, M0-T02.

**Files/modules affected.** API config/validation; `.env.example`; README; test and lint configuration.

**Implementation steps.** Validate required environment variables at startup, including Neon `DATABASE_URL`; separate production and test Neon connection settings; document UTC, money units, hold and reconciliation timeout settings; ensure actual `.env` files are Git-ignored; add minimal health/build/test commands and establish baseline results.

**Acceptance criteria.** Missing required settings fail with a clear safe error; `.env.example` has no real secrets; documented commands run successfully.
