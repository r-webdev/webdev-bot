# Scratchpad: ADR 0001 (onboarding without GuildMembers intent)

Main doc: `0001-onboarding-without-guild-members-intent.md` (human controls it; Claude never commits it).
Workflow: iterative authoring skill. Ask, don't guess. Prefer AskUserQuestion (human asked for this). Commit only this scratchpad, with descriptive messages.

## Where we are (end of session 1)

Business half is DRAFTED in the main doc and the human finalized it, except one last read-through they have not explicitly done:
- "Problem and goals" (goals 1, 2, 5 and the gates paragraph reworded) and "1. What Onboarding is" (journey table + rules).
- Sections 2-5 (decision, technical design, considered options, to-verify/open decision) are UNTOUCHED and now STALE: they still describe anchor-based dormancy, Option A/B as undecided, no lastActivity.
- The human has already committed the main doc edits themselves (17e95a4 "clarify goal dormancy", 06d6704 "7 day gives users also enough time to get a read on the server and its community"). The working tree is clean for that file. They may have tweaked wording, so RE-READ the main doc at the start of the next session and treat it as the source of truth over this file. `pnpm exec oxfmt` fails on Node v20.17 (needs newer, see .nvmrc), so the widened table rows may still be unformatted; check `pnpm fmt:check` on a supported Node.
- Note: AGENTS.md and docs/agents/ are also uncommitted in the working tree and are not ours.

## Decisions made (business, reasoning kept for context)

- No status/front matter in the ADR.
- Goal 1 = protect GENERAL CHAT. Human: low-effort or low-quality messages should not pollute the main area where people hang out; newcomers (no roles) only have the lounge. Start role adds help forum (create+reply), ai, gaming, real life, frontend, design, backend, and showcase COMMENTS only. Showcase creation goes through a bot button in a channel the start role cannot reach. Finished = full server.
- Dormancy is ACTIVITY-based: 3 months without activity, unfinished members only (finished are permanent and never dormant; human chose this over covering everyone, so goal 5 does not cover finished accounts). Activity = message anywhere (forum post counts) or joining voice (bot cannot detect talking). lastActivity stored, writes throttled, starts at join date, rectification sets it to now.
- Dormant behaviour = Option B (delete and notify), chosen over my recommendation of Option A (permission deny). Known cost: message briefly visible, weakens goal 5, bot needs Manage Messages. Start role stays on dormancy.
- Messages from members holding the dormant role are not counted toward the 400.
- Rejoin within the 7-day grace: time away does NOT count; anchor and lastActivity shift forward by away time (measured from when the daily job noticed the leave).
- Dormant notice: member told privately and immediately, with a way to reactivate. Reasoning (human): a user who cannot write somewhere churns rather than investigates; this keeps them in the server and makes reactivating easy.
- No start role (skipped Discord onboarding): stays lounge-only, no nudge.
- Gates: 7 days = friction for drive-bys. 400 chars = rough engagement sign and friction; no quality judgement. Goal 2 reworded: the 7 days give time to read, nothing checks it.
- Legacy rule confirmed: start + finished + legacy role on first post.

## Open items

Business, for the TEAM to decide (not the human alone): dormant notice in a private thread (member, bot, mods only) vs a reply in the channel itself. Written into the ADR rules as an open point.

Business, optional: human reads the business half once more and signs off.

Technical (PARKED by human: "business definition first, technical details later"). Suggested order when resumed:
1. B1 Intent rationale. The bot already depends on MessageContent (privileged, `src/index.ts:17`) and the 400-char mechanic needs it, so "approval could be refused/revoked" applies to it equally. No evidence anyone applied for GuildMembers and was refused. The "10,000 users" claim is unverified. Ask: has GuildMembers been applied for, how big is the server, what is the real reason to avoid it? Revisit "Why not the intent" and "Considered options".
2. Rewrite the "open decision: making dormant members read-only" section: Option B chosen; keep A in Considered options. "Telling the member" (DM vs ephemeral vs private thread) ties to the team decision above.
3. Update section 3 for the new business rules: Data (lastActivity column; maybe left-time already exists), evaluation order step 5 (dormancy by lastActivity, skip recording while dormant), join-message entry point ("changes nothing else" now shifts anchor + lastActivity), message entry point (update lastActivity, throttle), new VoiceStateUpdate entry point, Option B handler (delete dormant members' messages, Manage Messages, exclude the dormant channel), daily job wording, entry-point step 3 legacy check.
4. Technical gaps from the review:
   - T9 No `Partials` in `src/index.ts`: discord.js does not emit messageDelete/messageUpdate for uncached messages, and messageDeleteBulk drops uncached ones. The ADR relies on an ID-only delete event.
   - T10 Deletes/edits while the bot is offline are lost, counts drift forever; startup catch-up replays only join messages.
   - T11 No estimate of tracked-member count N; daily job does N fetches; dormant rows never expire.
   - T13 Concurrency argument against the JSON column is applied selectively; evaluate() is also read-modify-write, and step 5 deletes rows while inserts may race.
   - T12 (mostly moot under Option B) read-only would need more than Send Messages deny.
5. L8 Launch date is listed as both a config constant and an env var. Decide which.
6. S14 Split the spec (journey, rules, schema, eval order, env vars) out of the ADR? Human deferred; edit in place first.
7. Minor: who accepted the dormancy best-effort gap (invisible members) and when does it become unacceptable; cite the source of "a daily job was the requirement".
8. Verify before building: forum post starter message arrives as MessageCreate; VoiceStateUpdate available (GuildVoiceStates already on); join messages visible in the system channel; single-member fetch works without the intent.

## New suggestions from the human (end of session 1), NOT yet discussed or scoped

S1. Prevent media attachments while Onboarding is not finished.
- My notes (unconfirmed): could be a Discord permission (deny Attach Files / Embed Links on the unfinished roles, set by moderators, which fits the rule "the bot only moves roles") or the bot deleting such messages (Manage Messages, briefly visible, like Option B). Journey rules currently say "Attachments add nothing" to the count, so wording changes too.
- Questions to ask: which stage (Everyone, start role, 7-day/messages milestone holders, dormant)? Attachments only, or also embeds/links? All channels or only some? Which goal does it serve (spam/raids, goal 3, and general-chat quality, goal 1)? Does a finished member keep full access? Does dormant need it?

S2. Replace the Discord onboarding rules quiz (rules shown with 4 answers, 3 wrong and 1 right) with the newcomer writing the rules out in their own words in a channel.
- My notes (unconfirmed): this is a bigger change than it looks. Today Discord onboarding grants the start role and is the only gate for goal 2. Writing in a channel means someone or something must grant the start role afterwards, so the bot (or a moderator) would take over granting it. That would also remove a technical cost in the ADR ("roles granted outside the bot are noticed late"). It touches the "Everyone" stage, "Discord onboarding" in the glossary, goal 2 (the "nothing checks it" wording could become false), the "No start role" rule and the technical sections.
- Questions to ask: what exactly do they write (rules in own words, an introduction, both)? Who validates it: moderators, the bot (length/keywords), or nobody? Which channel, and can the Everyone stage write there (it is currently lounge-only)? Does Discord onboarding still exist for picking the Developer/Designer role? What is the grant mechanism: moderator button/command or automatic? Is spam in that channel a risk (goal 3)?
- Do this as its own business-level discussion BEFORE the technical sections, because it changes the journey.

## Next session: how to start

Read the main doc and this file, then ask (AskUserQuestion) which to do: (a) business sign-off read-through, (b) the two new suggestions S1 and S2 (business level, S2 may reshape the journey, so probably first), or (c) start the technical sections at item 1 (B1). Do not edit sections 2-5 without confirming scope.
