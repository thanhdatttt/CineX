# ADR-010: Validate Requests at Client and API Boundaries

- **Status:** Accepted
- **Date:** 2026-11-24

## Context

Frontend validation improves usability, but requests can be altered or sent without using the CineX UI. Backend business logic must not receive malformed or structurally invalid request data.

## Decision

- Validate and normalize user-entered/selected values in the frontend before sending a request. Block invalid submission and show actionable field-level errors.
- Independently validate and normalize every API request at the transport boundary before invoking an application service or starting a business workflow. Validate body, path, query, and relevant headers; reject unknown fields and return the documented validation error.
- Keep transport/schema checks distinct from domain checks. After boundary validation, application/domain services enforce authorization, business rules, ownership, current state, and transactional invariants.
- Frontend validation is never a security or correctness boundary and does not authorize an operation.
- Test frontend validation feedback and verify invalid API input is rejected before the corresponding business service is called.

## Consequences

Frontend and API may use separate validation schemas suited to their runtime and responsibilities. Do not assume a shared schema removes the need for server validation. API DTO/schema constraints and error behavior should be represented in OpenAPI documentation.
