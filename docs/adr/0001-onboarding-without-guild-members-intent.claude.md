# Scratchpad: ADR 0001 (onboarding without GuildMembers intent)

Main doc: `0001-onboarding-without-guild-members-intent.md`. Status in main doc is `accepted`; review says it should be `proposed`.

## Session 1 state

Harsh review done (in chat). Nothing in the main doc edited yet. All findings below are OPEN until the human decides.

## Open findings (need human decisions)

### Blockers
- B1 Intent rationale self-contradicts: bot already depends on MessageContent (privileged, `src/index.ts:17`); the 400-char mechanic needs it. "Approval could be refused/revoked" applies equally. Also no evidence anyone applied for GuildMembers and was refused. 10,000-user claim unverified. Q: has GuildMembers been applied for? What is the guild/bot size? What is the real reason to avoid the intent?
- B2 Goal 1 (protect regulars) is defeated: start role (granted at join by Discord onboarding) opens help forum + showcase, the exact channels that caused the problem. Q: move those behind finished role, or reword goal 1?
- B3 Status `accepted` but section 5 has open decision + unverified assumptions. Should be `proposed`.
- B4 Contradictions: line 22/34 say dormant can read; journey table line 45 says dormant loses access to everything except message mods + dormant channel. Table says "start role stays"; Option A removes start role. Rectification text and eval-order step 5 silent on start role.

### Logic bugs
- L5 Messages posted while dormant (dormant channel, Option B) are after the old anchor so get counted; rectification does not delete rows, contradicting "count is already empty".
- L6 Dormancy rule (3 months after anchor w/o finished) does not match goal 5 (never-taken-part accounts). Hits slow active members and active lounge chatters who skipped Discord onboarding (cannot finish without start role). Never touches finished members (real hijack targets). Legacy non-posters invisible at launch.
- L7 Leave grace loophole: kick + rejoin within 7 days keeps progress; time away counts toward the 7 days.
- L8 Launch date listed as both constant (line 145) and env var (line 146).

### Technical gaps
- T9 No `Partials` in `src/index.ts`; discord.js will not emit messageDelete/messageUpdate for uncached messages, and messageDeleteBulk drops uncached ones. ADR relies on "ID-only delete event".
- T10 Deletes/edits while bot offline are lost; counts drift forever; startup catch-up only replays join messages.
- T11 No estimate of tracked-member count N; daily job does N fetches; dormant rows never expire.
- T12 Read-only needs more than Send Messages deny (threads, forum posts, reactions, voice, attachments); new channels do not inherit.
- T13 Concurrency argument against JSON column applied selectively; evaluate() is also read-modify-write and step 5 deletes rows while inserts may race.

### Structure
- S14 ADR contains a full spec (journey table, rules, schema, eval order, env vars). Q: split spec out of the ADR into a separate doc?
- S15 Option B is a strawman (defeats goal 5 by its own text); recommend closing on Option A. "Telling the member" private-thread section is scope creep; candidate for follow-up issue.

### Minor
- Who accepted dormancy gap (line 74) and under what conditions it becomes unacceptable?
- No stated path for "Everyone" members to get start role.
- "a daily job was the requirement": cite source.

## Proposed section order (not agreed yet)
1. Status + Problem/goals (B2, B3, L6 goal 5 wording)
2. Decision / why not the intent (B1)
3. Journey table + rules (B4, L5, L7, L8)
4. Technical design (T9-T13)
5. Open decision: dormant read-only (S15, T12)

## Decisions made
None yet.
