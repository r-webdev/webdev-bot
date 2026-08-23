# Agent Instructions

This file provides repository-wide guidance for any automated or AI-assisted contributor. Follow these conventions unless a human maintainer explicitly overrides them.

## Project Overview

**webdev-bot** is a Discord bot for the Web Dev & Design server. It is a TypeScript Node.js application built with `pnpm`, bundled via `tsup`, and tested with the Node.js built-in test runner.

## Branch Naming

Branches use [Conventional Commits](https://www.conventionalcommits.org/) type prefixes:

```
<type>/<short-description>
<type>/<issue-number>/<short-description>
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, and other conventional commit types as appropriate.

**Examples:**

```
feat/add-baseline-command
feat/86/agent-file
fix/42/handle-timeout-error
docs/update-contributing-guide
```

Use lowercase, hyphen-separated descriptions. When work relates to an existing GitHub issue, include the issue number in the branch name.

## Pull Requests

When a change addresses an existing issue:

1. **Branch** — include the issue number (see above).
2. **Title** — include the issue number, e.g. `feat(#86): add baseline command`.
3. **Body** — include a closing keyword so GitHub links and auto-closes the issue:

   ```
   Closes #86
   ```

Use `Closes`, `Fixes`, or `Resolves` as appropriate. One issue per PR when possible.

For changes with no related issue, omit the issue number from the branch and title.

## Keep the Codebase Small

- **Do not add new npm packages** unless a maintainer explicitly approves. Prefer built-in Node.js APIs and existing dependencies.
- **Minimize scope** — change only what is needed for the task. Avoid drive-by refactors or unrelated cleanup.
- **Reuse existing patterns** — read surrounding code and match its style, abstractions, and conventions before writing something new.

## Coding Style

### Comments

Code should be self-descriptive. Do not add comments that restate what the code already says.

Add a comment only when the **business logic** is not obvious from the code itself — for example, a non-standard algorithm, a Discord API quirk, or a constraint that would surprise a reader.

```typescript
// ❌ BAD — narrates the obvious
// Get the user from the interaction
const user = interaction.user;

// ✅ GOOD — explains non-obvious business logic
// Discord allows bots to timeout members only if the bot's highest role
// is above the target member's highest role.
if (botRole.position <= targetMember.roles.highest.position) {
  return;
}
```

### Naming

Always use full words for variables, parameters, and functions. Do not abbreviate.

```typescript
// ❌ BAD
const msg = interaction.options.getString('query');
const cfg = getConfig();

// ✅ GOOD
const query = interaction.options.getString('query');
const configuration = getConfiguration();
```

### TypeScript Types

- **Do not use `interface`.** Use `type` aliases instead.

  ```typescript
  // ❌ BAD
  interface CommandOptions {
    name: string;
    description: string;
  }

  // ✅ GOOD
  type CommandOptions = {
    name: string;
    description: string;
  };
  ```

- **Do not use `enum`.** Use string literal unions or `as const` objects instead.

  ```typescript
  // ❌ BAD
  enum CommandStatus {
    Pending = 'pending',
    Ready = 'ready',
  }

  // ✅ GOOD
  type CommandStatus = 'pending' | 'ready';

  // ✅ GOOD — when you need a runtime value map
  const CommandStatus = {
    Pending: 'pending',
    Ready: 'ready',
  } as const;
  ```

## Configuration Is the Source of Truth

Root-level config files define how this project is built, linted, formatted, and run. **Do not invent parallel config** (no new ESLint/Prettier/Biome/Jest/Vitest configs, no duplicate tsconfig variants, no ad-hoc tooling files).

Treat these as authoritative:

| File | Purpose |
|------|---------|
| `package.json` | Scripts, dependencies, lint-staged hooks |
| `pnpm-lock.yaml` | Locked dependency versions |
| `tsconfig.json` | TypeScript compiler options |
| `tsup.config.ts` | Build/bundle configuration |
| `oxlint.config.ts` | Linter rules |
| `oxfmt.config.ts` | Formatter rules |
| `docker-compose.yml` | Local Docker services |
| `Dockerfile` | Container image |
| `.nvmrc` | Node.js version |
| `.gitignore` | Ignored paths |
| `.dockerignore` | Docker build exclusions |
| `src/env.ts` | Environment variable schema and access (do not read `.env*` files directly) |

If something seems missing from config, ask a maintainer rather than adding a new config file.

### Environment Variables

- Do **not** open, read, or reference any files matching:
  - `.env`
  - `.env.*`
  - `.env*`
- Treat `src/env.ts` as the only allowed source of environment configuration. Use it whenever environment info is required.
- If a needed value appears only in a `.env*` file, stop and ask to add it to `src/env.ts` instead of reading the `.env*` file.

## Code Quality

### Linting and Formatting

Before considering work complete, run lint and format checks on changed code:

```bash
pnpm lint          # check for lint errors
pnpm lint:fix      # auto-fix lint issues where possible
pnpm fmt:check     # verify formatting
pnpm fmt           # apply formatting
pnpm typecheck     # TypeScript type checking
```

CI runs lint, format check, build, and tests on every pull request. Fix any failures before submitting.

### Unit Tests

**Everything that can be tested should be tested.** When adding or changing code, write unit tests for the new or modified behavior.

- Test files live alongside source code as `*.test.ts`.
- Use the Node.js built-in test runner (`node:test` / `node:assert`).
- Run tests locally:

  ```bash
  pnpm test        # run tests via tsx (development)
  pnpm test:ci     # run compiled tests (matches CI)
  pnpm build       # required before test:ci
  ```

Match the style of existing tests (see `src/**/*.test.ts`).

## Development Commands

```bash
pnpm install       # install dependencies
pnpm dev           # start with hot reload
pnpm build         # compile for production
pnpm start         # run compiled output
pnpm deploy        # deploy Discord slash commands
```

Package manager is **pnpm** (see `packageManager` field in `package.json`). Do not use npm or yarn.

## Skills

Project skills live in `.agents/skills/`. Each skill is a `SKILL.md` file with step-by-step workflow instructions. These are tool-agnostic — any agent should read and follow them when relevant.

Some agents only discover skills from their own directory. After cloning, link skills for your agent:

```bash
pnpm link-agent-skills claude   # .claude/skills -> .agents/skills
pnpm link-agent-skills cursor   # .cursor/skills -> .agents/skills
pnpm link-agent-skills copilot  # .github/skills -> .agents/skills
pnpm link-agent-skills codex    # .codex/skills -> .agents/skills
```

Agent-specific skill directories are gitignored; `.agents/skills/` is the canonical source committed to the repository. Cursor and Codex also read `.agents/skills/` directly — linking for those agents is optional and the script will ask for confirmation.

| Skill | Use when |
|-------|----------|
| [plan-github-issue](.agents/skills/plan-github-issue/SKILL.md) | Planning work from a GitHub issue (provide issue number or URL) |

## General Guidelines

- Read existing code in the area you are changing before writing new code.
- Prefer small, focused diffs over large rewrites.
- Do not commit secrets, credentials, or `.env` files.
- Do not create git commits or open pull requests unless explicitly asked by the human working with you.
- When unsure about a convention, check existing branches, pull requests, and config files before guessing.
