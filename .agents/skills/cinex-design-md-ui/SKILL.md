---
name: cinex-design-md-ui
description: Build or change CineX web interfaces. Read the repository's DESIGN.md first and use it as the visual source of truth while following the existing app structure.
---

# CineX interface work

Use this skill for any task that creates or changes a user-facing interface in CineX, including pages, components, styles, responsive behavior, and interaction states.

## Before editing

1. Find and read the project `DESIGN.md` at the repository root. Treat its documented visual language, tokens, typography, component patterns, and interaction guidance as the starting point.
2. If `DESIGN.md` is missing, inspect the existing application and nearby design documentation, then ask the user to provide or approve design direction if the task requires choices that cannot be inferred. Do not invent a project-specific design system and present it as documented fact.
3. Inspect the relevant files under `apps/web/src/`, package scripts, and existing dependencies before choosing an implementation. The web app may still contain starter UI; verify its current state for each task.

## Implementing the interface

- Follow `DESIGN.md` and existing patterns. Extend established tokens and components instead of introducing competing colors, type scales, spacing systems, or control styles.
- Keep the requested scope focused. Add only the interactions, states, and responsive behavior needed by the requested flow.
- Use the dependencies already installed in `apps/web` when they fit. Avoid adding a UI library or design dependency without a concrete need.
- Keep accessible semantics, labels, keyboard interaction, visible focus, and useful loading, empty, and error states appropriate to the interface.
- Keep styling with the app's existing conventions and avoid unrelated redesigns or source changes.

## Finish

- Check the result against `DESIGN.md` and the surrounding UI for consistency at relevant viewport sizes.
- Report the interface changes and any verification performed. Do not claim visual verification if no rendered UI was inspected.
