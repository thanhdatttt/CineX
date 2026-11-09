# M6-T02 — Measure contention and representative load

**Objective.** Add reproducible k6 scenarios and report only observed results.

**Requirements references.** `requirements.md` §7.2, §12.3, §17; ADR-002.

**Dependencies.** M2-T05, M3-T06, M5-T01, M5-T02, M6-T01.

**Files/modules affected.** `k6/` scripts and run/report documentation.

**Implementation steps.** Cover single-seat contention, many-seat/showtime reservations, read-heavy browsing, and duplicate payment/webhooks; assert outcome invariants; record environment, VUs, duration, rate, latency percentiles and errors.

**Acceptance criteria.** Single-seat run shows exactly one owner and no invariant violation; scripts are repeatable; report includes actual execution data only and documents limitations.
