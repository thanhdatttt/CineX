# M2-T04 — Implement safe release and expiry processing

**Objective.** Release active holds safely and recover due expiry work after restarts.

**Requirements references.** `requirements.md` §5.5, §6.6, §8.2, §8.4; system/database design; ADR-003.

**Dependencies.** M2-T01, M2-T03.

**Files/modules affected.** `reservations`, `jobs`; release endpoint, expiry worker, tests.

**Implementation steps.** Add owner-checked explicit release; poll due active reservations in bounded batches; use conditional transaction/state and owner checks; keep payment-pending seats protected; make retries harmless.

**Acceptance criteria.** User cannot release another user's hold; stale expiry work cannot release a newer owner's seats; payment-pending is not released by original TTL; restart recovers due work.
