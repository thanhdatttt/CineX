# ADR-007: Room Layout Changes After Showtime Creation

- **Status:** Accepted
- **Date:** 2026-11-09

## Context

Physical seats are reusable room definitions, while each showtime has its own inventory. Removing or changing a seat after inventory or bookings exist can make tickets and historical seat assignments uninterpretable.

## Decision

Treat the room layout as immutable once any showtime inventory has been generated for that layout. Admins may create a new room/layout version for future showtimes. Existing showtimes retain their original seat identities and inventory. Do not cascade-delete seats, inventory, bookings, or tickets. If the product later requires in-place layout editing, introduce explicit layout versioning/snapshots and a migration policy as a new decision.

Before inventory exists, admins may edit the layout subject to unique row/seat identifiers and seat-type validation. A showtime's inventory generation is transactional and idempotent, with one row per eligible physical seat enforced by a unique constraint. Marking a room or seat unavailable affects future schedules; it does not silently change past or active showtime inventory.

## Consequences

Admin APIs return a conflict when a destructive layout edit targets a room with generated inventory and explain that a new layout/room is required. Preserve room/seat labels and references for booking history and ticket inspection. Test concurrent inventory generation, attempted destructive edits after booking, and stable historical booking display.
