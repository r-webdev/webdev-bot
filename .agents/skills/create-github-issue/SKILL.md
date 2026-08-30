---
name: create-github-issue
description: >-
  Create GitHub issues and tickets for this repository using the project issue
  body template, duplicate search, and GitHub CLI. Use when the user wants to
  file, open, or create a GitHub issue or ticket, or to write a bug report for
  this repo.
---

# Create GitHub Issue

File a GitHub issue for this repository using the project ticket body structure.

Do not create commits or pull requests unless the developer asks.

## Required Input

The developer must provide a **short problem or goal** (what should change and why).

Optional:

- Extra notes, constraints, or links
- Whether this is a **bug**, **feature**, or **chore**
- A preferred title

If the problem or goal is missing, ask for it before continuing.

## Workflow

Copy this checklist and track progress:

```
Issue Progress:
- [ ] Step 1: Confirm input
- [ ] Step 2: Draft the issue
- [ ] Step 3: Search for duplicates and confirm they relate
- [ ] Step 4: Duplicate comment path, or show the draft and wait for approval
- [ ] Step 5: Create the issue or post the comment
- [ ] Step 6: Return the issue URL and number
```

### Step 1: Confirm Input

Confirm you have enough to write a useful ticket:

- Problem or goal (required)
- Type: bug, feature, or chore (ask if unclear)
- Any extra notes the developer already gave

Do not invent product requirements. If something is unknown, it belongs under **Open Questions**, not as fake acceptance criteria.

### Step 2: Draft the Issue

Write a short, specific **title** (no conventional-commit prefix unless the developer asks).

Write the **body** using this structure. Keep the headings and order exactly:

```
Short description why.

## Acceptance Criteria

- at least one criteria
- more are better

## Open Questions

- any questions that need to be answered before work can start

## Out of Scope

Explain what is out of scope for this issue.

## Bug details (if this is a bug)

Fill this subsection only when reporting a bug. Skip it for features and chores.

### Current behavior

### Expected behavior

### Steps to reproduce

1.
2.
3.

### Environment

- OS:
- Node:
- pnpm:
```

Rules for filling the template:

- Open with a short paragraph explaining **why** the work matters.
- **Acceptance Criteria** — concrete, testable bullets. If you cannot name real criteria, put the unknowns under **Open Questions** instead of inventing them.
- **Open Questions** — anything that must be answered before work can start. Use `_None_` if there are none.
- **Out of Scope** — what this issue will not do. Prefer a small, focused ticket (see [AGENTS.md](../../../AGENTS.md)).
- **Bug details** — include this subsection **only** for bugs. Omit the entire `## Bug details` section (and its `###` headings) for features and chores.
- Do not include secrets, tokens, or `.env` values. Never read `.env*` files.
- Do not attach labels unless the developer asks for specific ones.

### Step 3: Search for Duplicates

Search existing issues **before** creating. Run from the repository root:

```bash
.agents/skills/create-github-issue/scripts/search-github-issues.sh <search-terms>
```

Examples:

```bash
.agents/skills/create-github-issue/scripts/search-github-issues.sh issue template
.agents/skills/create-github-issue/scripts/search-github-issues.sh timeout member role
```

Use a few distinctive words from the title and problem statement. If the first query is too broad or too narrow, search again with a tighter query.

**Show the search results first** (including “none found”). Do not show the new-issue draft yet. Ask the developer to confirm whether any result is the same work they wanted to file.

If they confirm a related existing issue:

- **Do not create a new issue.**
- **Do not edit** that issue (title, body, labels, or other fields). Contributors cannot update the duplicate this way.
- They **may leave a comment** with more information.
- Use **AskQuestion** (when available; otherwise ask conversationally) with a prompt like: “Add a comment with more information to #<number>?” Options: **Yes — add a comment**, **No — stop**.
- If several results might match, confirm **which issue number** first, then AskQuestion about commenting on that issue.

If no result relates, or none were found, continue to Step 4 (new-issue draft).

If the script fails:

- **`gh` not installed** — tell the developer to install the [GitHub CLI](https://cli.github.com/).
- **Not authenticated** — tell the developer to run `gh auth login`.
- **Wrong repository** — run from the `webdev-bot` clone (`r-webdev/webdev-bot`).

### Step 4: Duplicate Comment Path, or Show the Draft and Wait for Approval

**If Step 3 confirmed a duplicate and they chose to comment:**

Draft a comment from the extra information they wanted on the new ticket. Show the comment text and wait for approval. If they request edits, update it and show it again.

**If there is no duplicate (or results were unrelated):**

Show the developer:

- Proposed **title**
- Proposed **body** (full markdown)

**Do not create the issue** until they approve the draft, unless they already said to create it (for example “file this issue” or “create it”).

If they request edits, update the draft and show it again.

### Step 5: Create the Issue or Post the Comment

**Comment on a duplicate** — write the approved comment to a temp file, then run from the repository root:

```bash
.agents/skills/create-github-issue/scripts/comment-github-issue.sh \
  --number <issue-number> \
  --body-file "<path-to-comment-file>"
```

Delete the temp file afterward.

**Create a new issue** — write the approved body to a temp file, then run from the repository root:

```bash
.agents/skills/create-github-issue/scripts/create-github-issue.sh \
  --title "<approved title>" \
  --body-file "<path-to-body-file>"
```

Delete the temp file afterward.

If the script fails, report the error and do not retry blindly. The same `gh` / auth / repo failures as Step 3 apply.

Do not pass `--label` unless the developer asked for labels.

### Step 6: Return the Issue URL and Number

Reply with:

- Issue number (e.g. `#101`)
- Issue URL
- Whether this was a **new issue** or a **comment** on an existing issue

After a **new** issue, tell the developer that it needs to be triaged by the code owners.

Stop there unless the developer asks to plan or implement the issue (see [plan-github-issue](../plan-github-issue/SKILL.md)).

## Rules

- Follow [AGENTS.md](../../../AGENTS.md) for repository conventions, scope, and secrets.
- Always create one issue per concern. Create multiple issues for multiple concerns.
- Prefer small scope: do not bundle unrelated chores into the ticket.
- Do not create `.github/ISSUE_TEMPLATE` files as part of filing an issue.
- Never create commits or pull requests for the described issue.
- Never edit an existing issue to “update” a duplicate. Only comment when the developer agrees via AskQuestion.
- After creating a **new** issue, tell the developer that it needs to be triaged by the code owners.
