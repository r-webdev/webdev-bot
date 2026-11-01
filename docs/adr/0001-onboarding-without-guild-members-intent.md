---
status: accepted
---

# Onboarding: a role-based member journey, built without the GuildMembers intent

Terms in **bold** are defined in [GLOSSARY.md](../../GLOSSARY.md).

## Problem and goals

Regulars have said they are tired of dealing with low-quality content from new joiners every day: badly formed help requests, and "look at my site" posts for projects that are fully vibe coded. They would prefer a calmer environment, with newcomers kept out of general chat and given the lounge instead. The trigger for this work is low-effort help requests, not a specific spam incident.

Onboarding exists to serve these goals, in this order of weight:

1. **Protect regulars' attention.** Keep low-effort questions and self-promotion out of the busiest channels until a newcomer has had time to settle in.
2. **Server comprehension.** Newcomers should have seen the rules and learned how to ask a good question before they reach the whole server.
3. **Spam and raids.** Fresh accounts have limited reach while trust is unknown.
4. **Drive-by accounts.** People who join, post once and leave should not cost moderators time.
5. **Limit hijacked dormant accounts.** An account that has never taken part for months can later be compromised and used to post scam messages. Dormancy removes the ability to write from accounts that have shown no sign of life.
6. **Encourage participation.** Newcomers get a friendly place to take part straight away (the lounge and a few topic channels) and a path to the rest.

Reading is not restricted by this flow. Members who read but rarely post keep their access to read the server. Onboarding gates where a member can write, not whether they may be here. A dormant member can read but cannot write until they reactivate.

### What the gates do and do not do

The 7-day wait and the 400-character threshold are deliberate friction. They keep newcomers out of general chat and the rest of the server while they settle in, and they cost a drive-by account some effort. They do not judge quality. A member can pass them with filler, and a newcomer can still post a low-effort question or project in the channels the start role opens, including help forum and showcase. Moderation and the community's own norms remain responsible for quality. Onboarding only limits how much of the server a newcomer can reach while that happens.

Every gate in section 1 must trace back to one of these goals. A gate that serves none of them should be removed.

## 1. What Onboarding is

New members of the Web Dev & Design server start with very little access and earn the rest of the server over time. **Onboarding** is the bot's own flow for this. It is separate from **Discord onboarding**, the question Discord shows at join, where the member picks a role such as Developer or Designer.

The purpose is to let newcomers take part in a few friendly channels straight away, while the rest of the server is held back until they have shown they are present and engaged. Members who never finish lose the ability to write again, though they can still read.

### The journey

| Stage             | How a member gets there                                                     | What they can do                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Everyone**      | Joined, but has no onboarding role (for example skipped Discord onboarding) | Write in lounge, read a few channels, read message mods to open a ticket                                                                   |
| **Start role**    | Granted by Discord onboarding                                               | Also write in help forum, ai, gaming, real life, frontend, design, backend and showcase                                                    |
| **7-day role**    | 7 days after the **restart anchor**                                         | Milestone only                                                                                                                             |
| **Messages role** | 400 **counted message** characters since the restart anchor                 | Milestone only                                                                                                                             |
| **Finished role** | Holds start, 7-day and messages                                             | Full server access. Permanent. The 7-day and messages roles are removed                                                                    |
| **Dormant role**  | 3 months after the restart anchor without the finished role                 | Loses access to everything except message mods and the **dormant channel**. The 7-day and messages roles are removed; the start role stays |
| **Legacy member** | Joined before launch, first seen posting                                    | Receives start, finished and **legacy role** at once                                                                                       |

### Rules

- The restart anchor is the later of the member's join date and their latest rectification. The 7-day clock, the message count and the 3-month dormancy deadline all run from it.
- Dormancy applies to anyone without the finished role, including members who never held the start role.
- Finishing needs the start role. A member could meet the 7-day and message conditions without it, but the finished role waits until Discord onboarding has been completed.
- Counted messages are text only, with whitespace, markdown syntax and links removed. Attachments add nothing. Messages written before the start role count. Messages that are deleted, or removed by spam detection, do not. Edits recount the message.
- **Rectification** leaves dormancy. A moderator runs `/onboarding reactivate @member`, or the member presses the button in the dormant channel. Both remove the dormant role and set a new restart anchor. The message count is already empty, because it is cleared when the member becomes dormant. A returning member starts over on purpose, with another 7 days and 400 characters: the point is to show they are present again.
- The messages role is held only while the counted characters stay at or above the threshold. If deletions or spam removals drop a member below it before they finish, the role is removed, so posting 400 characters and deleting them does not count.
- A member who leaves keeps their Onboarding progress for a grace period of 7 days, counted from when the daily job first notices they are gone. If they rejoin within it, their restart anchor and counted messages are as they were, however soon after leaving they return. The time away counts toward the 7 days and the dormancy deadline, because the anchor does not move. After the grace period the progress is deleted and they start Onboarding again. Members who had already finished always start again, because their record is gone and Discord removes their roles when they leave. Counted messages are only deleted in two cases: their onboarding record is deleted (they finished, or the grace period after leaving ran out), or they become dormant.
- Bots and moderators (**exempt members**) are never touched.
- Which channels each role can see or write in is configured by moderators in Discord. The bot only adds and removes roles. It never edits channel permission overwrites.

## 2. The decision

Onboarding is implemented as a role reconciler that works **without the GuildMembers privileged intent**. It relies on a small tracking table, the join system message, per-message events and a daily job that fetches members one by one.

### Why not use the intent

The intent is the obvious route. It delivers join, leave and role-update events and lets the bot list every member. It is privileged. Discord's [Gateway documentation](https://docs.discord.com/developers/events/gateway) says apps with fewer than 10,000 users can switch privileged intents on in the Developer Portal, and approval is needed above that. This app already needed approval for the Message Content intent, so the same process would apply to GuildMembers. We chose not to depend on an approval that Discord controls and could refuse or revoke.

### What this costs

- Roles granted outside the bot (Discord onboarding giving the start role) are noticed late: when the member next posts, or at the next daily run.
- Leaves are noticed late, at the next daily run.
- Time-based roles (7-day, dormant) are applied once a day, so they can arrive up to a day late.
- Existing members can't be listed, so they become **legacy members** one at a time, as they post.
- Dormancy is best-effort. It only covers members the bot saw join or post. A silent member whose join message was missed is invisible to the daily run, and a legacy member who never posts is never evaluated, so neither goes dormant and both stay exposed to the hijacked-account risk in the goals. This is accepted.
- The leave grace period starts when the daily job notices the leave, not when the member left, so it can run up to a day longer than 7 days.

## 3. Technical design

### Signals the bot uses

| Need               | Source                                                                                                          | Needs privileged intent |
| ------------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------- |
| A member joined    | System join message (`MessageType.UserJoin`) in the server's system channel. `message.author` is the joiner     | No (GuildMessages)      |
| Join date, roles   | `message.member` on every guild message (`joinedAt`, `roles`)                                                   | No                      |
| Message counted    | `MessageCreate`                                                                                                 | No                      |
| Message edited     | `MessageUpdate`                                                                                                 | No                      |
| Message uncounted  | `MessageDelete` and `MessageDeleteBulk`                                                                         | No                      |
| Member left        | Daily run fetches each tracked member by ID and treats Discord's "Unknown Member" error (code 10007) as a leave | No                      |
| Start role granted | Seen on the member's next message, or when the daily run fetches them                                           | No                      |

Spam detection removes messages with `bulkDelete`. discord.js reports that with a separate bulk-delete event, and the bot has no delete listeners today. Both events must be handled, otherwise spam would still count toward the 400 characters.

### Data

Two new Prisma models in [schema.prisma](../../prisma/schema.prisma):

- **Onboarding**: one row per member who is in progress or dormant. Columns are the user ID (primary key), join date, restart anchor, and the time the bot first noticed the member had left (empty while they are in the server). The row is deleted when the member finishes, or when the grace period after leaving has ended.
- **OnboardingMessage**: one row per counted message. Columns are the message ID (primary key), the user ID (a foreign key to `Onboarding` that cascades on delete) and the counted length. A member's total is the sum of their rows. A message's creation time is not stored: messages before the anchor are filtered when they arrive, and the time is encoded in the message ID if it is ever needed. A member's rows are deleted in exactly two cases: their `Onboarding` row is deleted, or they become dormant.

Roles are not mirrored in the database. Discord's role list is the source of truth for the current stage, and the tables hold only what Discord cannot tell us (the anchor and the message lengths).

### Why message records get their own table

Counting a message, uncounting a deleted one and recounting an edited one are each a single statement keyed by message ID, so concurrent events for the same member cannot overwrite each other. A delete event for a message that is not in the bot's cache carries only the message ID and no author, and the primary key finds the owner directly. Replays (startup catch-up, duplicate events) become upserts on the primary key and cannot double-count. Message rows are removed by a cascade, not by application code. `OnboardingMessage` declares its relation to `Onboarding` with `onDelete: Cascade`, so deleting a member's `Onboarding` row deletes all of their `OnboardingMessage` rows in the same operation. The code that finishes a member or handles a leave only deletes the `Onboarding` row and cannot forget the messages. Becoming dormant is the exception: the `Onboarding` row stays, so the dormancy step deletes that member's message rows explicitly. Rectification and rejoining never delete message rows.

SQLite only enforces foreign keys when they are switched on for the connection. A test must confirm the cascade really fires with the better-sqlite3 adapter in use, and the schema must not rely on it silently doing nothing.

Storing the messages as a JSON column on `Onboarding` was considered and rejected; see section 4.

### One decision function

All entry points call the same two pieces:

1. A pure function takes the member's roles, restart anchor, counted characters, join date and the current time, and returns the roles to add and remove. It has no Discord calls, so it can be unit-tested.
2. An applier makes the role changes and writes a line to the onboarding log channel.

Evaluation order inside the pure function:

1. **Exempt member**: nothing.
2. **Finished role present**: remove any leftover 7-day and messages roles, stop tracking.
3. **Joined before the launch date**: add start, finished and legacy.
4. **Dormant role present**: nothing until rectification.
5. **3 months past the anchor**: remove 7-day and messages, add dormant, delete the member's message rows.
6. **7 days past the anchor**: add 7-day.
7. **400 counted characters**: add messages. Below 400 while holding the messages role: remove it.
8. **Start, 7-day and messages all held**: add finished, remove 7-day and messages.

Role changes run one at a time, as the existing [addRoleToUser](../../src/util/add-role-to-user.ts) does, so a large first run stays inside Discord's rate limits. Functions throw when they cannot complete their job and the caller handles it.

### Entry points

- **Join message**: create the member's `Onboarding` row. If a row already exists, the bot clears its left time and changes nothing else, whether the join message is a replay or the member is returning within the grace period. The row keeps its original join date and restart anchor, so a member who had been in the server for 6 days does not restart their 7-day clock, and the message rows are untouched. The roles lost while away are re-granted by the next evaluation.
- **Any guild message from a member who is not exempt and not finished**: if there is no tracking row, create one from `message.member.joinedAt`. Record the counted length (messages before the restart anchor are ignored), then evaluate.
- **Message edit and delete events**: recompute or remove the message record, then evaluate.
- **Daily job**: scheduled with `node-cron` at a fixed UTC time, like the showcase digest. For each tracked member it fetches the member by ID. If the member is gone, it records when it first noticed, and deletes their data once the grace period has passed; members marked as left are not evaluated. If the member is present, it clears any recorded left time and re-evaluates them.
- **Startup catch-up**: fetch recent history of the system channel and replay join messages the bot missed while offline.
- **Rectification**: a shared function checks the member holds the dormant role (throws if not), removes it, sets the anchor to now and evaluates. It does not touch message rows. The `/onboarding reactivate` slash command and the dormant-channel button both call it.

### Dormant channel

At startup the bot makes sure one fixed message with a "Reactivate" button exists in the dormant channel, and posts it if missing. The placeholder text says the account has been dormant and the member should press the button to restart onboarding. The final wording is a constant that will be replaced later. The button is handled by the persistent interaction handlers so it survives restarts, and it rejects members without the dormant role.

### Configuration

- **Constants** in one onboarding config file: counted-character threshold (400), days until the 7-day role (7) and dormancy period (3 months), leave grace period (7 days), daily-job time, launch-date constant.
- **Required env vars** in [env.ts](../../src/env.ts): the five onboarding role IDs plus the legacy role ID, the dormant channel ID and the onboarding log channel ID, and the launch date. The optional `ONBOARDING_ROLE_ID` and `ONBOARDING_CHANNEL_ID` and the unused `/onboarding` stub are removed.
- **Permissions**: the bot's own role must sit above all onboarding roles and have Manage Roles, and it needs View Channel on the system channel.
- The GuildMembers intent stays off. No change to the intents in [index.ts](../../src/index.ts).

## 4. Considered options

- **Apply for the GuildMembers intent.** Simplest design. It would also give events for role changes and leaves, and a list of all members for a clean backfill. Rejected because it depends on Discord's approval, which has been needed before and is not ours to decide.
- **Keep a running character total per member instead of per-message records.** Less storage. Rejected because deleted and spam-removed messages must stop counting, and a total alone cannot tell which characters to subtract.
- **One table, with the per-message lengths in a JSON column on `Onboarding`** (message ID mapped to counted length). Simpler schema, one read for a member's whole state, and one delete for cleanup. Rejected for three reasons. Every update is a read-modify-write of the whole column, so two events for the same member, such as a new message during a spam bulk-delete, can silently overwrite each other unless updates are serialised per member. A delete event for an uncached message gives only the message ID, so finding the member who owns it means scanning every member's JSON with raw SQL, since Prisma cannot filter inside JSON on SQLite as far as we know. And the total would be computed in code, with the whole blob rewritten on every message. Fixing the first two with a per-member lock and a message-to-member lookup would rebuild the second table in a worse form.
- **Restore finished members who leave and rejoin.** Would need a permanent record of every finished member. Without the intent the bot only learns of a rejoin, never of the leave, so the 7-day grace period given to in-progress members cannot be applied: the choices are restoring access whenever they return, or guessing from the finish time. Rejected to keep the design small and not grant full access automatically; a finished member who returns starts again.
- **Hourly job instead of daily.** Faster role delivery. Not chosen: a daily job was the requirement and the lag is acceptable.
- **Bot manages channel permission overwrites.** Would let the bot enforce what "dormant" means. Rejected because channel permissions belong to moderators and the onboarding flow is meant to be roles only.

## 5. To verify before building

- That the bot can see and read the system join messages in the real server, and that welcome messages are enabled there.
- That fetching a single member by ID works with the intent off. Discord's docs say only List Guild Members requires the intent. The Get Guild Member page does not mention one, and the existing stub in [features/onboarding](../../src/features/onboarding/index.ts) already calls it.
- How a dormant member is made read-only. Decision pending; the two options are described below.

### Open decision: making dormant members read-only

A dormant member must be able to read the server but not write anywhere, including the lounge. The lounge stays open to every other member. Two ways to get there.

**Option A: channel permissions.** Dormancy removes the start role. Moderators configure the dormant role with read access everywhere and a Send Messages deny on every writable channel, the lounge included. Discord applies `@everyone` overwrites first and role overwrites after, so the dormant role's deny beats the lounge's `@everyone` allow. Another role's explicit allow would beat the deny, because Discord combines role overwrites so that an allow from any role wins over a deny from another. The start role's write allows are such an allow, which is why the start role has to be removed. Reactivation re-adds it.

- Discord enforces it. Nothing is posted, and it works when the bot is down.
- The bot still only moves roles and never edits overwrites.
- The member cannot write anywhere and gets no prompt on their own. They may not know why, or how to come back, unless they are told (see "Telling the member" below).
- Reactivation skips Discord onboarding the second time.

**Option B: delete and notify.** Dormant members keep their channel permissions. When one writes a message, the bot deletes the message and tells them to press a reactivate button. This gives the member a clear, immediate task without searching the server.

- Discord only allows an ephemeral message as the response to an interaction (a slash command or button press). The bot cannot send one in reply to a normal message. The message that carries the button is therefore a DM, which fails if the member has DMs closed, a visible reply that deletes itself, or a private thread (see "Telling the member" below). Pressing the button can then respond ephemerally.
- The offending message is posted before it is deleted. It can ping people and unfurl links for the moment it exists, and it stays if the bot is down or rate-limited. This weakens the hijacked-account goal, since a compromised account can post a scam before the delete lands.
- The bot needs the Manage Messages permission and must act on every guild message from a dormant member.
- Every dormant member who writes is deleted and notified, so a member with a legitimate message sees it removed.

### Telling the member

A dormant member should be told what happened and given one action to take, without searching the server. A private thread does this better than a DM: it does not fail when DMs are closed, the message stays inside the server, and the reactivate button sits next to the explanation. When the member becomes dormant (or, in option B, when they first write), the bot creates a private thread, adds the member, and posts the explanation and the reactivate button. The member is notified because they were added to the thread.

This works with either option and replaces the single shared button message in the dormant channel, or sits beside it. To verify before relying on it:

- A member added to a private thread can see and use it when the parent channel is otherwise hidden from them.
- The bot has permission to create private threads and add members.
- The number of threads stays manageable, and an archived thread can still be used. Threads should be deleted or reused on reactivation.
