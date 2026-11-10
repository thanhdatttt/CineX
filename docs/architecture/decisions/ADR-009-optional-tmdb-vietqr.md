# ADR-009: TMDB and VietQR Are Optional Support Integrations

- **Status:** Accepted
- **Date:** 2026-11-10

## Context

CineX may use external movie data and bank-transfer QR tooling, but the product requirements and payment invariants must remain independent of those providers.

## Decision

- TMDB is optional tooling for staff-assisted movie metadata/artwork lookup or import. CineX persists and owns its movie records, schedules, prices, and publication state.
- VietQR is optional QR generation/display support for a payment attempt. QR generation, QR scanning, client redirects, and client success messages are not evidence that payment completed.
- Only a verified server-side payment/bank provider result may transition payment or booking state. The baseline mock gateway and its signature, idempotency, webhook, and reconciliation behavior remain required.
- Neither integration is an MVP feature or delivery gate. Core customer, reservation, booking, and payment behavior must work when either integration is absent.
- Respect the applicable TMDB attribution and licensing terms if TMDB is enabled.

## Consequences

Keep integrations behind replaceable adapters and isolate their credentials/configuration. External outages must not corrupt CineX state or block core flows. A future production payment provider requires its own reviewed integration decision and verified callback/status flow.
