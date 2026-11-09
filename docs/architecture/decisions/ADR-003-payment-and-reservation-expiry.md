# ADR-003: Payment and Reservation Expiry

- **Status:** Accepted
- **Date:** 2026-11-09

## Context

A gateway timeout is an unknown outcome, and a successful callback may arrive after the original five-minute seat hold. Blindly expiring a payment in progress can release seats for which money was collected; keeping the hold forever can strand inventory.

## Decision

The configured five-minute reservation TTL applies only while a reservation is `ACTIVE`. Starting payment must atomically check that the hold is still valid and transition the reservation/booking to `PAYMENT_PENDING` while recording the attempt and its bounded reconciliation deadline. The original TTL does not release a payment-pending hold.

Call the mock gateway outside the transaction that locks inventory. Treat timeout as `TIMED_OUT`/unknown, not definitive failure. Reconcile against the gateway's authoritative outcome and accept only verified, deduplicated events with matching booking/provider references, amount, and currency. A definitive failure permits safe release. A valid success confirms only if the protected reservation still owns all seats and the showtime remains fulfillable.

At the configured reconciliation deadline, unresolved outcomes transition to a documented manual-reconciliation state; do not assume failure and free seats while a charge may still succeed. If success arrives after ownership is lost or fulfillment is impossible, mark refund/compensation-required and never confirm by taking another customer's seats. Make every transition auditable and idempotent.

## Configuration and consequences

The hold duration defaults to five minutes. Payment/reconciliation timeout is configurable as required by the product requirements and must be documented in environment configuration. The requirements do not specify a numeric default; choose and record that value before implementation rather than silently hard-coding one. Tests must cover payment just before expiry, definitive failure, timeout followed by success, duplicate success, and success after ownership is lost.
