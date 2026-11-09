# M3-T03 — Build mock payment gateway adapter

**Objective.** Simulate required gateway outcomes behind a provider-neutral interface.

**Requirements references.** `requirements.md` §6.8; system/API design; ADR-001, ADR-003.

**Dependencies.** M0-T03, M3-T01.

**Files/modules affected.** `payments`; gateway interface and mock adapter/configuration/unit tests.

**Implementation steps.** Model success, definitive failure, timeout/unknown, delayed result, duplicate event and invalid event/signature; generate provider references and signed events; keep external call outside database transaction.

**Acceptance criteria.** All six scenarios are controllable in development/test; timeout is represented as unknown; signature verification uses constant-time comparison; adapter can be replaced without changing booking rules.
