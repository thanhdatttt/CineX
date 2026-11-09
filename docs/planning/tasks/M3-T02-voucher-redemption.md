# M3-T02 — Add transactional voucher redemption

**Objective.** Validate vouchers and enforce redemption limits under concurrency.

**Requirements references.** `requirements.md` §4, §6.7, §7.4, §12.2 scenario 15.

**Dependencies.** M3-T01, M1-T02.

**Files/modules affected.** `vouchers`, `bookings`; schema, admin API, calculator and PostgreSQL tests.

**Implementation steps.** Implement code/window/eligibility/minimum-spend checks; redeem quota atomically with booking; persist redemption and applied-rule snapshot; use integer/exact arithmetic.

**Acceptance criteria.** Client cannot choose discount amount; one final quota use cannot be concurrently redeemed twice; historical booking discount remains stable; invalid vouchers have documented errors.
