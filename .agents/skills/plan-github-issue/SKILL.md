---
name: plan-github-issue
description: >-
  Plan implementation work from a GitHub issue. Fetches issue details via gh
  CLI, explores the codebase, produces an implementation plan, and asks the
  developer follow-up questions. Use when the user wants to plan, scope, or
  start work on a GitHub issue, or provides an issue link or issue number.
---

# Plan GitHub Issue

Turn a GitHub issue into an implementation plan before writing code.

## Required Input

The developer must provide **at least one** of:

- Issue number (e.g. `86`)
- Issue URL (e.g. `https://github.com/r-webdev/webdev-bot/issues/86`)

Both may be provided. When both are given, verify they refer to the same issue.

If neither is provided, ask for one before continuing.

## Workflow

Copy this checklist and track progress:

```
Planning Progress:
- [ ] Step 1: Fetch issue details
- [ ] Step 2: Read and summarize the issue
- [ ] Step 3: Explore the codebase
- [ ] Step 4: Draft implementation plan
- [ ] Step 5: Ask follow-up questions
- [ ] Step 6: Wait for developer answers before implementing
```

### Step 1: Fetch Issue Details

Run the fetch script from the repository root:

```bash
.agents/skills/plan-github-issue/scripts/fetch-github-issue.sh <issue-number-or-url> [issue-url-or-number]
```

Examples:

```bash
.agents/skills/plan-github-issue/scripts/fetch-github-issue.sh 86
.agents/skills/plan-github-issue/scripts/fetch-github-issue.sh https://github.com/r-webdev/webdev-bot/issues/86
.agents/skills/plan-github-issue/scripts/fetch-github-issue.sh 86 https://github.com/r-webdev/webdev-bot/issues/86
```

Read the full script output. Do not guess issue content.

If the script fails:

- **`gh` not installed** — tell the developer to install the [GitHub CLI](https://cli.github.com/).
- **Not authenticated** — tell the developer to run `gh auth login`.
- **Issue not found** — confirm the number or URL with the developer.

### Step 2: Read and Summarize the Issue

Extract from the fetched issue:

- **Goal** — what problem is being solved?
- **Acceptance criteria** — explicit requirements, checklists, or "done when" statements
- **Constraints** — labels, comments, assignees, or notes that limit scope
- **Open ambiguities** — anything unclear or underspecified

### Step 3: Explore the Codebase

Before planning, inspect relevant areas of the repository:

- Search for related commands, features, tests, and config
- Read [AGENTS.md](../../../AGENTS.md) for repository conventions
- Identify existing patterns to reuse (do not invent parallel approaches)

Keep exploration focused on what the issue touches.

### Step 4: Draft Implementation Plan

Present the plan using this template:

```markdown
# Plan: Issue #<number> — <title>

## Issue Summary
<One short paragraph>

## Acceptance Criteria
- [ ] <criterion from issue>
- [ ] <criterion from issue>

## Proposed Approach
<High-level strategy>

## Files to Change
| File | Change |
|------|--------|
| `path/to/file` | <what and why> |

## Testing Plan
- <what to test>
- Commands: `pnpm test`, `pnpm lint`, `pnpm fmt:check`, etc.

## Branch and PR
- Branch: `<type>/<issue-number>/<short-description>` (see AGENTS.md)
- PR title includes `(#<issue-number>)`
- PR body includes `Closes #<issue-number>`

## Risks and Unknowns
- <anything that could block or expand scope>
```

Adjust sections if the issue is docs-only, infra-only, or otherwise atypical.

### Step 5: Ask Follow-Up Questions

Always ask the developer clarifying questions before implementing. Aim for **3–8 targeted questions** based on gaps in the issue.

Ask about:

- **Ambiguous requirements** — multiple valid interpretations
- **Scope boundaries** — what is explicitly out of scope
- **Design choices** — UX, naming, error handling, backwards compatibility
- **Dependencies** — blocked on other PRs, secrets, external setup, or maintainer decisions
- **Verification** — how the developer wants to validate the change

Format questions as a numbered list. Make each question specific and actionable.

Example:

```markdown
## Follow-Up Questions

1. The issue mentions "standard expected from agents" — should the file be named `AGENTS.md` or `AGENT.md`?
2. Should tool-specific config stay separate from the shared agent file, or be merged?
3. Is full test coverage required for any helper scripts added as part of this issue?
```

### Step 6: Wait Before Implementing

**Do not start coding** until the developer answers the follow-up questions, unless they explicitly say to proceed with stated assumptions.

When they answer, update the plan if needed and confirm the final approach before making changes.

## Rules

- Follow [AGENTS.md](../../../AGENTS.md) for all repository conventions.
- Fetch the issue with the script — do not rely on memory or partial quotes.
- Prefer reusing existing code and config over adding packages or new tooling.
- Everything that can be tested should be tested.
- Do not create commits or pull requests unless the developer asks.
