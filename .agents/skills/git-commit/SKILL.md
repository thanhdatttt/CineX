---
name: git-commit
description: Safely create and optionally push a Git commit for the current task. Review repository changes, stage only relevant files, verify the commit, and require human approval before pushing.
---

# Safe Git Commit

Create a Git commit containing only the current task's changes while preserving all unrelated user work.

## Workflow

### 1. Inspect Changes

- Run `git status` to inspect the working tree.
- Review `git diff` and `git diff --cached`.
- Identify changes belonging to the current task.
- Check untracked files and distinguish task files from unrelated files.
- Preserve all pre-existing user changes.

**Stop if:** Task changes cannot be safely separated from unrelated or partially staged changes. Ask the user how to proceed.

### 2. Review and Stage

- Review changes to ensure they are correct and relevant to the task.
- Check for secrets, credentials, personal data, debugging code, and unwanted generated files. Never expose secret values.
- Stage only relevant files using explicit paths (`git add -- path/to/file`).
- Never use `git add .` or `git add -A`.
- Do not reset, unstage, or overwrite existing user changes.
- Review `git diff --cached` and `git status` to confirm the exact commit contents.

**Stop if:** Staged changes contain unrelated files, secrets, or unexplained changes.

### 3. Create Commit Message

Use the format:

`<type>(<scope>): <description>`

Allowed types:

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring without behavior changes
- `docs`: Documentation
- `style`: Formatting changes
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Maintenance

Rules:
- Scope is optional.
- Use a concise, meaningful description.
- Start the description with lowercase.
- Use imperative mood.
- Do not end with a period.

Examples:
- `feat(auth): add JWT authentication`
- `fix(booking): prevent double booking`
- `docs: explain local setup`

### 4. Commit and Verify

- Create the commit only after reviewing the staged diff.
- Never use `--no-verify`.
- Do not amend existing commits unless explicitly requested.
- Do not push yet.
- Run `git log -1 --format=fuller` and `git status`.
- Verify the commit and report any remaining changes without modifying them.

### 5. Push with Human Verification

Pushing is optional and requires explicit human approval.

Before pushing:

1. Identify the current branch using `git branch --show-current`.
2. Identify the target remote and branch.
3. Never push to `main` or `refs/heads/main`, even if explicitly requested.
4. Inspect the commits that would be pushed, including their complete diffs.
5. Check all commits being pushed for secrets, credentials, personal data, and other sensitive information.
6. Verify that the target branch and remote are correct.

Before executing `git push`, ask the user for explicit confirmation.

The confirmation request MUST include:

- **Commit message:** Full commit message.
- **Commit hash:** Commit hash to be pushed.
- **Source branch:** Current local branch.
- **Remote:** Target remote name.
- **Target branch:** Remote branch that will receive the push.
- **Commits to push:** Number of commits and their messages.
- **Sensitive data check:** Confirmation that no sensitive information was detected.

Example:

"Commit created successfully. Do you want to push it?

- Commit: `abc1234`
- Message: `feat(auth): add JWT authentication`
- Source branch: `feature/auth`
- Remote: `origin`
- Target branch: `origin/feature/auth`
- Commits to push: 1
- Sensitive data check: Passed

Do you approve pushing these commits?"

**Push rules:**

- Push only after explicit user approval.
- If the user declines, skip this step and do not push.
- If the user does not respond or approval is ambiguous, do not push.
- Never push to `main`.
- Never push commits containing secrets, credentials, personal data, or other sensitive information.
- Never use `--force` or `--force-with-lease`.
- Never bypass Git hooks.
- Do not change branches or rewrite commit history to make pushing possible.
- If the remote branch or push contents differ from what was approved, ask for confirmation again.
- After a successful push, verify the result and report the remote branch.

## Final Report

Provide a concise summary:

- **Status:** Success / Blocked
- **Commit:** Commit hash
- **Message:** Full commit message
- **Push:** Pushed / Skipped / Not requested / Blocked
- **Branch:** Source and target branch, if applicable
- **Remaining changes:** List staged, unstaged, or untracked changes.

## Important Rules

- Never discard or overwrite user changes.
- Never commit unrelated files or secrets.
- Never commit without reviewing the staged diff.
- Never push without explicit human approval.
- Never push to `main`.
- If asked only to create or edit this skill, modify or validate the skill files only. Do not create a Git commit or push.