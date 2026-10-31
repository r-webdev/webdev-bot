---
status: accepted
---

# Onboarding: a role-based member journey, built without the GuildMembers intent

Terms in **bold** are defined in [GLOSSARY.md](../../GLOSSARY.md).

## 1. What Onboarding is

New members of the Web Dev & Design server start with very little access and earn the rest of the server over time. **Onboarding** is the bot's own flow for this. It is separate from **Discord onboarding**, the question Discord shows at join, where the member picks a role such as Developer or Designer.

The purpose is to let newcomers take part in a few friendly channels straight away, while the rest of the server is held back until they have shown they are present and engaged. Members who never come back lose access again.

### The journey

| Stage                  | How a member gets there                                                          | What they can do                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Everyone**           | Joined, but has no onboarding role (for example skipped Discord onboarding)      | Write in lounge, read a few channels, read message mods to open a ticket                                                                                  |
| **Start role**         | Granted by Discord onboarding                                                    | Also write in help forum, ai, gaming, real life, frontend, design, backend and showcase                                                                   |
| **7-day role**         | 7 days after the **restart anchor**                                              | Milestone only                                                                                                                                            |
| **Messages role**      | 400 **counted message** characters since the restart anchor                      | Milestone only                                                                                                                                            |
| **Finished role**      | Holds start, 7-day and messages                                                  | Full server access. Permanent. The 7-day and messages roles are removed                                                                                   |
| **Dormant role**       | 3 months after the restart anchor without the finished role                      | Loses access to everything except message mods and the **dormant channel**. The 7-day and messages roles are removed; the start role stays                |
| **Legacy member**      | Joined before launch, first seen posting                                         | Receives start, finished and **legacy role** at once                                                                                                      |

### Rules

- The restart anchor is the later of the member's join date and their latest rectification. The 7-day clock, the message count and the 3-month dormancy deadline all run from it.
- Dormancy applies to anyone without the finished role, including members who never held the start role.
- Finishing needs the start role. A member could meet the 7-day and message conditions without it, but the finished role waits until Discord onboarding has been completed.
- Counted messages are text only, with whitespace, markdown syntax and links removed. Attachments add nothing. Messages written before the start role count. Messages that are deleted, or removed by spam detection, do not. Edits recount the message.
- **Rectification** leaves dormancy. A moderator runs `/onboarding reactivate @member`, or the member presses the button in the dormant channel. Both remove the dormant role, set a new restart anchor and discard the old message count.
- A member who leaves and rejoins starts from nothing, even if they had finished before.
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
- A silent member whose join message was missed is invisible to the daily run and will never go dormant.

## 3. Technical design

### Signals the bot uses

| Need                  | Source                                                                                                                                               | Needs privileged intent |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| A member joined       | System join message (`MessageType.UserJoin`) in the server's system channel. `message.author` is the joiner                                          | No (GuildMessages)      |
| Join date, roles      | `message.member` on every guild message (`joinedAt`, `roles`)                                                                                        | No                      |
| Message counted       | `MessageCreate`                                                                                                                                      | No                      |
| Message edited        | `MessageUpdate`                                                                                                                                      | No                      |
| Message uncounted     | `MessageDelete` and `MessageDeleteBulk`                                                                                                              | No                      |
| Member left           | Daily run fetches each tracked member by ID and treats Discord's "Unknown Member" error (code 10007) as a leave                                      | No                      |
| Start role granted    | Seen on the member's next message, or when the daily run fetches them                                                                                | No                      |

Spam detection removes messages with `bulkDelete`. discord.js reports that with a separate bulk-delete event, and the bot has no delete listeners today. Both events must be handled, otherwise spam would still count toward the 400 characters.

### Data

Two new Prisma models in [schema.prisma](../../prisma/schema.prisma):

- **Onboarding**: one row per member who is in progress or dormant. Columns are the user ID (primary key), join date and restart anchor. The row is deleted when the member finishes or leaves.
- **OnboardingMessage**: one row per counted message. Columns are the message ID (primary key), the user ID (a foreign key to `Onboarding` that cascades on delete) and the counted length. A member's total is the sum of their rows. A message's creation time is not stored: messages before the anchor are filtered when they arrive, and the time is encoded in the message ID if it is ever needed. Rectification deletes the member's rows.

Roles are not mirrored in the database. Discord's role list is the source of truth for the current stage, and the tables hold only what Discord cannot tell us (the anchor and the message lengths).

### Why message records get their own table

Counting a message, uncounting a deleted one and recounting an edited one are each a single statement keyed by message ID, so concurrent events for the same member cannot overwrite each other. A delete event for a message that is not in the bot's cache carries only the message ID and no author, and the primary key finds the owner directly. Replays (startup catch-up, duplicate events) become upserts on the primary key and cannot double-count. The cascading foreign key removes a member's messages when their row goes.

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
5. **3 months past the anchor**: remove 7-day and messages, add dormant.
6. **7 days past the anchor**: add 7-day.
7. **400 counted characters**: add messages.
8. **Start, 7-day and messages all held**: add finished, remove 7-day and messages.

Role changes run one at a time, as the existing [addRoleToUser](../../src/util/add-role-to-user.ts) does, so a large first run stays inside Discord's rate limits. Functions throw when they cannot complete their job and the caller handles it.

### Entry points

- **Join message**: create the tracking row, or reset it if the member is already tracked with an earlier join date. Handling is idempotent so replays are safe.
- **Any guild message from a member who is not exempt and not finished**: if there is no tracking row, create one from `message.member.joinedAt`. Record the counted length (messages before the restart anchor are ignored), then evaluate.
- **Message edit and delete events**: recompute or remove the message record, then evaluate.
- **Daily job**: scheduled with `node-cron` at a fixed UTC time, like the showcase digest. For each tracked member it fetches the member by ID. If the member is gone, their data is deleted. Otherwise it re-evaluates them.
- **Startup catch-up**: fetch recent history of the system channel and replay join messages the bot missed while offline.
- **Rectification**: a shared function checks the member holds the dormant role (throws if not), removes it, sets the anchor to now, deletes the message records and evaluates. The `/onboarding reactivate` slash command and the dormant-channel button both call it.

### Dormant channel

At startup the bot makes sure one fixed message with a "Reactivate" button exists in the dormant channel, and posts it if missing. The placeholder text says the account has been dormant and the member should press the button to restart onboarding. The final wording is a constant that will be replaced later. The button is handled by the persistent interaction handlers so it survives restarts, and it rejects members without the dormant role.

### Configuration

- **Constants** in one onboarding config file: counted-character threshold (400), days until the 7-day role (7) and dormancy period (3 months), daily-job time, launch-date constant.
- **Required env vars** in [env.ts](../../src/env.ts): the five onboarding role IDs plus the legacy role ID, the dormant channel ID and the onboarding log channel ID, and the launch date. The optional `ONBOARDING_ROLE_ID` and `ONBOARDING_CHANNEL_ID` and the unused `/onboarding` stub are removed.
- **Permissions**: the bot's own role must sit above all onboarding roles and have Manage Roles, and it needs View Channel on the system channel.
- The GuildMembers intent stays off. No change to the intents in [index.ts](../../src/index.ts).

## 4. Considered options

- **Apply for the GuildMembers intent.** Simplest design. It would also give events for role changes and leaves, and a list of all members for a clean backfill. Rejected because it depends on Discord's approval, which has been needed before and is not ours to decide.
- **Keep a running character total per member instead of per-message records.** Less storage. Rejected because deleted and spam-removed messages must stop counting, and a total alone cannot tell which characters to subtract.
- **One table, with the per-message lengths in a JSON column on `Onboarding`** (message ID mapped to counted length). Simpler schema, one read for a member's whole state, and one delete for cleanup. Rejected for three reasons. Every update is a read-modify-write of the whole column, so two events for the same member, such as a new message during a spam bulk-delete, can silently overwrite each other unless updates are serialised per member. A delete event for an uncached message gives only the message ID, so finding the member who owns it means scanning every member's JSON with raw SQL, since Prisma cannot filter inside JSON on SQLite as far as we know. And the total would be computed in code, with the whole blob rewritten on every message. Fixing the first two with a per-member lock and a message-to-member lookup would rebuild the second table in a worse form.
- **Hourly job instead of daily.** Faster role delivery. Not chosen: a daily job was the requirement and the lag is acceptable.
- **Bot manages channel permission overwrites.** Would let the bot enforce what "dormant" means. Rejected because channel permissions belong to moderators and the onboarding flow is meant to be roles only.

## 5. To verify before building

- That the bot can see and read the system join messages in the real server, and that welcome messages are enabled there.
- That fetching a single member by ID works with the intent off. Discord's docs say only List Guild Members requires the intent. The Get Guild Member page does not mention one, and the existing stub in [features/onboarding](../../src/features/onboarding/index.ts) already calls it.
- Whether the `messages` role should be revoked if later deletions drop a member below the threshold before they finish. The current design reconciles in that direction, but it needs a decision.
