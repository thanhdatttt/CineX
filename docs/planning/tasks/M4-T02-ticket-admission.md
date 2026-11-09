# M4-T02 — Implement scoped one-time ticket validation

**Objective.** Allow authorized staff to admit a valid ticket exactly once.

**Requirements references.** `requirements.md` §2.1, §6.10, §12.2 scenario 16; security/API design.

**Dependencies.** M1-T02, M1-T03, M4-T01.

**Files/modules affected.** `tickets`; staff cinema-scope assignment/authorization, validation API and PostgreSQL tests.

**Implementation steps.** Check opaque token, confirmed booking, ticket state, showtime/admission window and staff cinema scope; atomically consume ticket and record actor/time.

**Acceptance criteria.** At most one simultaneous scan succeeds; out-of-scope staff is forbidden; failed/cancelled booking ticket is rejected; validation audit is persisted.
