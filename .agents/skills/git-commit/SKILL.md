---
name: git-commit
description: Prepare and create a safe Git commit for the current task. Use when asked to commit changes or create a commit; inspect repository changes, stage only task files, and verify the result.
---

# Safe Git commit workflow

Create a commit only after the exact task changes and commit contents have been reviewed. This workflow is language- and framework-agnostic.

## 1. Inspect repository state

- Run `git status` and inspect both `git diff` and `git diff --cached` before changing the index or files.
- Identify the current task's changes and distinguish them from pre-existing user changes. Preserve unrelated edits and staged content.
- Check for untracked files and ignored/secrets files that may be relevant. Never expose secret values while reviewing them.
- If the current task cannot be separated safely from unrelated or partially staged changes, stop before committing and explain what needs the user's decision.

## 2. Review and stage exact files

- Review the final unstaged and staged diffs. Confirm the proposed commit contains only current-task changes and no unrelated work, debugging leftovers, credentials, tokens, personal data, generated artifacts that should not be committed, or sensitive files.
- Check suspicious files and diffs for secrets without printing secret values. If a secret is found, do not stage or commit it; explain the issue and handle the secret safely.
- Stage files by explicit path, for example `git add -- path/to/file`. Never use `git add .` or `git add -A`.
- Preserve unrelated staged changes. If the index contains unrelated or partially staged work that would make the commit ambiguous, do not reset, unstage, or overwrite it; stop and ask the user how to proceed.
- After staging, inspect `git diff --cached` and `git status` again. The staged diff is the authoritative commit content. If it contains anything outside the task, stop and resolve this without discarding user work.

## 3. Write the commit message

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

## 4. Commit and verify

- Commit only after the staged diff has been reviewed. Never use `--no-verify`.
- Do not amend an existing commit unless the user explicitly requests it. Do not force-push; this skill does not authorize pushing.
- After committing, run `git log -1 --oneline` and `git status`. Confirm the new commit is the expected one and report any remaining staged, unstaged, or untracked changes without modifying them.
- Report the commit hash, full commit message, and remaining working-tree changes.

## Stop conditions

Do not create a commit if staged contents cannot be separated from unrelated user work, or review finds secrets or unexplained files. State the concrete blocker and leave the user's changes intact.

When asked only to create or edit this skill, create/validate the skill files only. Never run a Git commit as part of skill creation.
