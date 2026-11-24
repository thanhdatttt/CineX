---
name: git-commit
description: Prepare and create a safe Git commit for the current task. Use when asked to commit changes or create a commit; inspect project tooling, run applicable checks, stage only task files, and verify the result.
---

# Safe Git commit workflow

Create a commit only after the current task's changes pass the applicable project checks and the exact commit contents have been reviewed. This workflow is language- and framework-agnostic: discover commands from the repository instead of assuming a toolchain.

## 1. Inspect repository state

- Run `git status` and inspect both `git diff` and `git diff --cached` before changing the index or files.
- Identify the current task's changes and distinguish them from pre-existing user changes. Preserve unrelated edits and staged content.
- Inspect repository guidance (`AGENTS.md`, contributor docs), manifests, task scripts, and CI configuration to identify the actual build, test, lint, type-check, and formatting commands and which apply to the changed areas.
- Check for untracked files and ignored/secrets files that may be relevant. Never expose secret values while reviewing them.
- If the current task cannot be separated safely from unrelated or partially staged changes, stop before committing and explain what needs the user's decision.

## 2. Validate before staging

- Run every applicable build, test, lint, type-check, and formatting check identified from project tooling. Report unavailable categories as not configured; do not invent commands.
- Prefer formatter check mode. If the project only provides a write-mode formatter, run it only on files in the current task, then review the resulting diff.
- If a required check fails, diagnose and fix task-related issues, then rerun the failed check. Review any additional files changed by fixes or tools. Never proceed to commit while a required check is failing or has not been completed.
- Do not point checks, migrations, or fixtures at production data. If a check needs a database or external service, verify its configured target is isolated and safe first. If safe execution cannot be established, stop and report the blocker.

## 3. Review and stage exact files

- Review the final unstaged and staged diffs. Confirm the proposed commit contains only current-task changes and no unrelated work, debugging leftovers, credentials, tokens, personal data, generated artifacts that should not be committed, or sensitive files.
- Check suspicious files and diffs for secrets without printing secret values. If a secret is found, do not stage or commit it; explain the issue and handle the secret safely.
- Stage files by explicit path, for example `git add -- path/to/file`. Never use `git add .` or `git add -A`.
- Preserve unrelated staged changes. If the index contains unrelated or partially staged work that would make the commit ambiguous, do not reset, unstage, or overwrite it; stop and ask the user how to proceed.
- After staging, inspect `git diff --cached` and `git status` again. The staged diff is the authoritative commit content. If it contains anything outside the task, stop and resolve this without discarding user work.

## 4. Write the commit message

Use this format:

```text
<type>(<scope>): <description>
```

The scope is optional. Choose one allowed type:

- `feat` — new feature
- `fix` — bug fix
- `refactor` — behavior-preserving code restructuring
- `docs` — documentation
- `style` — formatting-only changes
- `perf` — performance improvement
- `chore` — maintenance or configuration
- `test` — tests

Write a concise, meaningful description in imperative mood. Start the description with a lowercase letter and omit the final period. Match the type and optional scope to the staged changes. Examples: `feat(auth): add JWT authentication`, `fix(booking): prevent double booking`, `docs: explain local setup`.

## 5. Commit and verify

- Commit only after all applicable checks pass and the staged diff has been reviewed. Never use `--no-verify`.
- Do not amend an existing commit unless the user explicitly requests it. Do not force-push; this skill does not authorize pushing.
- After committing, run `git log -1 --oneline` and `git status`. Confirm the new commit is the expected one and report any remaining staged, unstaged, or untracked changes without modifying them.
- Report the commit hash, full commit message, validation commands and results (including checks not configured or blocked), and remaining working-tree changes.

## Stop conditions

Do not create a commit if a required check fails, the target environment for a check is unsafe or unknown, staged contents cannot be separated from unrelated user work, or review finds secrets or unexplained files. State the concrete blocker and leave the user's changes intact.

When asked only to create or edit this skill, create/validate the skill files only. Never run a Git commit as part of skill creation.
