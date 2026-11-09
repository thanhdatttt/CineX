# M3-T05 — Persist and verify payment webhooks

**Objective.** Durably receive provider events and reject invalid or duplicate callbacks safely.

**Requirements references.** `requirements.md` §6.8–6.9, §9.3, §10; API/security design; ADR-004.

**Dependencies.** M3-T03, M3-T04, M1-T01.

**Files/modules affected.** `webhooks`, `payments`; receipt schema, endpoint, signature/schema validators and tests.

**Implementation steps.** Limit payload size; verify signature and fields; insert unique provider event ID and receipt before acknowledgement; quarantine invalid/mismatched events; acknowledge duplicate durable IDs without repeating application.

**Acceptance criteria.** Invalid signature or amount/currency/reference cannot mutate payment/booking; duplicate event is acknowledged and stored/applied once; receipt survives process restart.
