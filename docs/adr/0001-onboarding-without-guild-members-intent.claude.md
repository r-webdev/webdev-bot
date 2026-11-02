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

## FINALIZED by human: Problem and goals (goals 1 and 5, gates paragraph)
- Human on the trigger gap: "low effort or low quality messages should not pollute the main area where people hang out, notably general chat. this is why all new comers only have access to the lounge." Intended scope of goal 1 = protect GENERAL CHAT. Trigger paragraph left as is.
- Human on stages: "people without any roles only have access to lounge, then the start role gives access to more channels, and after finishing the onboarding they gain access to the full server." So the journey table channel list is right; just showcase is comment-only.

## Decisions (journey section round)
- Dormant = Option B (delete and notify). Human chose it over my recommendation A. Known cost, recorded in ADR already: message is visible briefly, weakens goal 5, bot needs Manage Messages and must handle every message from dormant members. Option A text and S15/T12 now partly moot; Option A can be kept in "considered options" instead of "open decision". Start role stays on dormancy (matches table).
- Messages from dormant members are NOT counted (skip recording while dormant role held). Resolves L5.
- Time away does NOT count on rejoin within grace: anchor AND lastActivity shift forward by away time. Human chose this. Away time measured from when the daily job noticed the leave (imprecise by up to a day, consistent with grace period). Resolves L7. Needs stored state: Onboarding row already has "left noticed" time; shift on rejoin.

## Drafted in main doc (awaiting human review): Journey table and rules
- Start-role row: showcase comment-only, help forum create+reply.
- Dormant row: 3 months without activity; keeps channel access, messages deleted + notified.
- Rules: activity definition (message anywhere incl. forum post, voice join; throttled; initial = join date), dormancy runs from lastActivity, finished never dormant, rectification sets lastActivity=now and dormant messages not counted, rejoin shifts anchor+lastActivity.
- Formatting NOT run: `pnpm exec oxfmt` fails on Node v20.17 (needs newer; .nvmrc). Table padding is unformatted; run fmt before commit of main doc.

## SCOPE DECISION (human): business definition first, technical details later
Work only on "Problem and goals" and "1. What Onboarding is" (journey + rules) until the business definition is settled. Do NOT edit sections 2-5 (decision, technical design, considered options, open decision) yet. Technical items below are parked, not dropped. Business items still open are listed under "Business questions open".

## Business questions open
- Review of drafted journey table and rules
- How is a dormant member told what happened (what the member experiences)? DM / reply / private thread: business-visible, decide wording only, mechanism later
- Path for "Everyone" (no start role) members to get the start role / are they nudged
- Why 7 days and 400 chars (trace each gate to a goal)
- Legacy member rule is business-visible: confirm

## Not yet touched (later sections; PARKED until business definition done)
- Section 2/5: Option A/B open-decision section needs rewriting to reflect B chosen. "Telling the member" thread section now relevant to B (DM vs ephemeral vs private thread: still undecided).
- Section 3: Data (add lastActivity column on Onboarding), evaluation order step 5 (dormancy by lastActivity, not anchor), join-message entry point ("changes nothing else" now shifts anchor/lastActivity), message entry point (skip recording when dormant, update lastActivity incl. voice and forum posts), new VoiceStateUpdate entry point, Option B handler (delete messages from dormant members, Manage Messages permission), daily job wording.
- Verify: forum post starter message arrives as MessageCreate; VoiceStateUpdate available.
- L8 launch date in both constants and env vars: still open, decide which.
- B1 (intent argument), T9-T13, S14 (split spec) still open.

## Still waiting on human
- Review of drafted Journey table and rules
- Launch date: constant or env var (L8)
- Q4: whether to split spec out of ADR (deferred; human chose to edit in place first)
