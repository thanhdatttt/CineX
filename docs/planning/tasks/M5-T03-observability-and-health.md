# M5-T03 — Add operational health and signals

**Objective.** Make application/dependency readiness and critical business reliability visible without exposing secrets.

**Requirements references.** `requirements.md` §11, §14; system/security design.

**Dependencies.** M0-T03, M2-T04, M3-T06, M4-T03.

**Files/modules affected.** `health`; logging/metrics middleware; reservation, payment, queue and rate-limit instrumentation.

**Implementation steps.** Add liveness/readiness; attach request IDs; instrument conflicts, payment outcomes, duplicate keys/events, queue retries, outbox age, API latency/errors and Redis failures; redact sensitive values.

**Acceptance criteria.** Health reveals dependency status but no credentials; request IDs correlate logs; required metrics exist; tests or inspection confirm secrets/tokens/raw payment data are not logged.
