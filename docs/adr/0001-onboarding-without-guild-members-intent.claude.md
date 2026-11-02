# Scratchpad: ADR 0001 (onboarding without GuildMembers intent)

Main doc: `0001-onboarding-without-guild-members-intent.md`. Front matter (status) removed from main doc at the human's direction: the ADR carries no status at all.

## Session 1 state

Harsh review done (in chat). Nothing in the main doc edited yet. All findings below are OPEN until the human decides.

## Open findings (need human decisions)

### Blockers
- B1 Intent rationale self-contradicts: bot already depends on MessageContent (privileged, `src/index.ts:17`); the 400-char mechanic needs it. "Approval could be refused/revoked" applies equally. Also no evidence anyone applied for GuildMembers and was refused. 10,000-user claim unverified. Q: has GuildMembers been applied for? What is the guild/bot size? What is the real reason to avoid the intent?
- B2 Goal 1 (protect regulars) is defeated: start role (granted at join by Discord onboarding) opens help forum + showcase, the exact channels that caused the problem. Q: move those behind finished role, or reword goal 1?
- B3 RESOLVED: status/front matter removed entirely (human: "it should have no status at all"). Section 5 open items still stand on their own.
- B4 Contradictions: line 22/34 say dormant can read; journey table line 45 says dormant loses access to everything except message mods + dormant channel. Table says "start role stays"; Option A removes start role. Rectification text and eval-order step 5 silent on start role.

### Logic bugs
- (Q3 decided: dormancy now activity-based, see Decisions; L6 largely addressed except finished-member scope and legacy non-posters)
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
- ADR has no status and no YAML front matter. Done in main doc.

- Q2 (goal 1 vs start role channels), human's facts: new joiners with the start role can COMMENT on showcases in the showcase forum but cannot CREATE showcases. Creation goes through the bot via a button in showcase-guidelines, which the start role cannot reach. Start role can "participate" in the help forum. So the journey table line "write in ... showcase" is inaccurate; must say comment-only. Reasoning: showcase spam is already blocked structurally; the remaining question is help forum posting.
- Q3 (goal 5): dormancy becomes ACTIVITY-based. Store `lastActivity` datetime in DB. Activity = wrote a message anywhere, created a forum post, joined and talked in voice. Each updates lastActivity. Dormant after 3 months with no activity. Replaces "3 months after restart anchor without finished". Reasoning: dormancy should target accounts with no sign of life, not slow members.

## Implications of Q3 to resolve (asked via AskUserQuestion)
- Does activity dormancy apply to finished members too? Today: finished => row deleted, permanent. Covering finished means keeping a row (lastActivity) for every finished member, which reverses "row deleted on finish" and affects the leave/rejoin design and the no-intent tracking (finished members only seen when they post/join voice).
- Voice: bot cannot detect "talking", only joining (VoiceStateUpdate, GuildVoiceStates already enabled). 
- Write volume: updating lastActivity on every message; probably throttle (only write if older than N hours).
- Initial lastActivity for a new row = join date; rectification sets lastActivity = now.
- Interaction with message-count bug L5: dormant-period messages are activity AND get counted; still needs fixing.
- Eval order step 5 and journey table dormant row need rewording once decided.

## Decisions from AskUserQuestion round (session 1)
- Help forum: start role can CREATE and reply. So goal 1 cannot claim to stop low-effort help requests; draft rewords it and the "do not do" paragraph says so. Flag to human: this means the original trigger (low-effort help requests) is NOT addressed by this ADR. Ask whether that is intended.
- Dormancy scope: ONLY unfinished members. Finished stay permanent and row is still deleted on finish. Consequence: hijack goal covers only never-finished accounts (stated in goal 5 draft). Human chose this over recommended "everyone".
- Voice activity = joining a voice channel (VoiceStateUpdate).
- lastActivity writes throttled (only update when stored value older than an interval, e.g. 1 day). Exact interval to settle in technical design.

## Drafted in main doc (awaiting human review): Problem and goals
- Goal 1 reworded, goal 5 reworded, "what the gates do" paragraph shortened to help forum only.
- Not yet touched: journey table (still says showcase write; must become comment-only), dormant row, eval order step 5, Data section (lastActivity column), rectification (sets lastActivity), L5 etc.

## Still waiting on human
- Q4 section order; and whether to split the spec out of the ADR
- Review of the drafted Problem and goals section
