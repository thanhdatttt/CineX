# ADR-005: Cancellation and Refund Policy

- **Status:** Proposed — product cutoff and refund terms are not yet defined
- **Date:** 2026-11-09

## Context

The requirements call for cancellation and refund behavior, but do not specify the cutoff, refund amount, or voucher/fee treatment. These are product rules and must not be guessed in code.

## Decision

Keep cancellation disabled until a simple policy is chosen and documented. Once defined, enforce it in the booking service: reject cancellations outside the allowed window, prevent cancelled tickets from admission, and make repeated cancellation requests return the existing result. With the mock gateway, represent refund outcome as a simulated state; do not build a separate refund orchestration system.

## Consequences

Before enabling cancellation, record the cutoff, refund amount, and when seats may become available again. Store the outcome with the booking so later policy changes do not alter past decisions. Policy versioning, multiple refund types, and manual-review workflows are deferred unless the product requires them.
