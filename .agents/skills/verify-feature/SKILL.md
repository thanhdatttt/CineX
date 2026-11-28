---
name: verify-feature
description: Independently verify whether a feature, milestone, or task is complete against its specification, acceptance criteria, and required tests. Use for completion checks, acceptance verification, or requests to validate a completion claim.
---

# Verify a feature

Follow the six steps in order. Keep source, tests, specifications, and configuration read-only throughout verification. Run only verification and prerequisite setup within the project's rules and available permissions. Leave fixes for a separate task.

## 1. Understand scope

- Identify the target, revision or working-tree snapshot, and affected modules, components, and entry points. Record the starting state, including relevant local changes.
- Find the governing specification from the user's references, repository instructions, and project documentation or linked tracker items. Follow references to applicable task briefs, milestone dependencies, requirements, and decisions. Treat completion labels, developer descriptions, and previous reports as leads to check.
- Record missing, conflicting, or ambiguous specification text and the scope it affects. Resolve it from authoritative sources when possible. Continue verifying independent items while any unresolved mandatory scope remains unverified.

## 2. Extract requirements

- Create two checklists, one for every in-scope functional and non-functional requirement, and one for every acceptance criterion and Definition of Done item. Split compound statements into independently verifiable obligations. Keep separately applicable completion criteria even when they overlap with requirements.
- Give each item a stable ID and record its source location, obligation, and applicability. Record an explicit reason for any conditional item that does not apply. Compare both checklists with the source specifications before moving on.

## 3. Inspect implementation

- Trace every requirement from its normal entry point through the relevant implementation, configuration, persistence, and integrations as applicable. Verify wiring, applicable error and boundary behavior, and non-functional constraints. Record concrete source locations and what they establish.
- Inspect relevant tests for meaningful assertions and whether they exercise the intended behavior. Identify gaps, disabled paths, and discrepancies. Mark evidence still needed from runtime verification. A related file or a green suite alone leaves the requirement open.

## 4. Execute tests

- Discover applicable commands from repository instructions, CI definitions, project manifests, test runner configuration, and module docs. Identify all relevant unit, integration, and available end-to-end tests, applicable builds and type checks, and project-required lint or other gates. Check test discovery, filters, CI matrices, affected packages, and prerequisites so an aggregate command's success covers the intended work.
- Inspect commands and hooks for side effects. Use read-only check modes and authorized isolated test environments for disposable data and generated artifacts. Verify the actual service or database target before any state-changing test or setup. Avoid live or shared targets, commands that rewrite protected files, and disclosure of secrets. If no permitted equivalent is available, record the exact blocker and continue independent checks.
- Run every required command you can against the inspected snapshot. Capture the working directory or project, command, relevant environment or matrix, exit status, and runner totals for passed, failed, skipped, or unexecuted work as available. Check for zero-test runs, early exits, skipped suites, and filtered cases. Use externally executed results only when you can independently verify primary logs, the exact inspected snapshot, the command's coverage, and a compatible environment. Completion claims and status badges are insufficient.
- Investigate failures using the output, test code, and configuration. Use a safe targeted rerun when it can clarify the cause. Retain the initial and rerun results. Distinguish a failed required test or check from a prerequisite or environment problem that prevents a valid result. Record failed, skipped, and unexecuted checks explicitly, including their impact on required coverage.

## 5. Evaluate completion

- Resolve every requirement independently as verified, missing, partial, incorrect, or unverified. Resolve every completion criterion independently as satisfied, partially satisfied, not satisfied, or unable to verify. Cite evidence for each conclusion. Partial satisfaction requires evidence of a concrete shortfall. Use an unverified status when the available evidence cannot decide the item.
- Consolidate findings by root cause and cross-reference all affected checklist IDs and failed checks on the same issue. State what the evidence establishes and mark an undetermined root cause explicitly. Check that execution preserved the starting source, test, specification, and configuration state.
- Apply the verdict in this order:
  1. **FAIL** if any required test or check has a confirmed failure, any mandatory requirement is missing, partial, or incorrect, or any mandatory completion criterion has a confirmed shortfall. Report any blockers alongside the failures.
  2. **BLOCKED** if there is no confirmed mandatory failure but any mandatory item remains unverified. Examples include unresolved scope, missing authoritative specifications, unavailable prerequisites, and skipped or unexecuted required tests.
  3. **PASS** only when all required tests and checks completed successfully with zero failures, every mandatory requirement is verified, and every mandatory completion criterion is satisfied. Every required test must have execution evidence.

## 6. Generate the report

Use the format below. Give a concise execution record under **Checks** with commands, outcomes, counts where available, and reasons for skips or non-execution. Cite a verified project path and line for each issue when available. For evidence without a source line, give the exact spec section, tracker item, or check/log reference and explain the missing location. Redact secrets and include only relevant output.

Count unique findings in **Total issues**. Count confirmed failed test cases in **Test failures** and describe other failed gates under **Issues Found**. Count missing, partial, and incorrect requirements in **Missing requirements**. Count confirmed partial and unsatisfied completion criteria in **Unsatisfied completion criteria**. Count unverified requirements, criteria, and checks in **Unverified items**, including skipped or unexecuted required tests. These checklist and execution counts can overlap across one finding and need not sum to the issue total.

### Feature Verification Summary

**Target:** [Feature / Milestone / Task Name and inspected snapshot]

**Overall Status:** [PASS / FAIL / BLOCKED]

**Summary:**

- Total issues: X
- Test failures: X
- Missing requirements: X
- Unsatisfied completion criteria: X
- Unverified items: X

**Checks:** [Commands, outcomes, skipped or unexecuted work, and evidence references]

### Issues Found

**Issue #X: [Short Description]**

- **Category:** [Test Failure / Missing Requirement / Acceptance Criteria / Other]
- **Location:** `path/to/file:line`
- **Problem:** [Confirmed shortfall or specifically unverified item, with affected checklist IDs or checks]
- **Root Cause:** [Evidence-backed cause or undetermined]
- **Evidence:** [Relevant source, specification, or execution evidence]

Repeat the issue block for each distinct finding. If there are no findings, write “None.”

### Final Verdict

[One sentence stating whether the target can be considered complete and why.]
