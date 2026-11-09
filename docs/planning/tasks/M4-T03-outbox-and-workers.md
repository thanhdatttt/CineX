# M4-T03 — Add durable outbox processing and worker recovery

**Objective.** Deliver required asynchronous effects with at-least-once, idempotent handling.

**Requirements references.** `requirements.md` §8.2–8.4, §11, §12.2 scenario 20; system design; ADR-004.

**Dependencies.** M2-T04, M3-T05, M3-T06, M4-T01.

**Files/modules affected.** `outbox`, `jobs`; migrations, dispatcher/consumers, BullMQ config and operations docs.

**Implementation steps.** Write outbox with domain transition; dispatch pending events; dedupe consumers; configure bounded backoff/jitter and failed-job retention; implement restart recovery and replay/dead-letter guidance.

**Acceptance criteria.** Crash/retry cannot lose committed work or duplicate effects; workers reread PostgreSQL before transitions; pending work resumes after restart; backlog/retry state is observable.
