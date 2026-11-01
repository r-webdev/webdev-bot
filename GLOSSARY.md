# Web Dev & Design Bot

A Discord bot for the Web Dev & Design server. This glossary covers the language of the new-member onboarding flow.

## Onboarding

**Onboarding**:
The bot's own, custom flow that moves a new member from limited access to full access through a series of roles.
_Avoid_: Discord onboarding (that is a different thing), welcome flow, verification

**Discord onboarding**:
Discord's built-in question flow shown when someone joins, in which the member picks a role such as Developer or Designer.
_Avoid_: Onboarding (reserved for the bot's flow)

**Everyone**:
A member holding no onboarding role, for example because they skipped Discord onboarding. They can only write in lounge and can read a few channels, including message mods.
_Avoid_: Roleless member, guest

**Start role** (`onboarding:start`):
The role a member receives from Discord onboarding. It unlocks write access to the first set of channels and is the entry point of Onboarding.

**7-day role** (`onboarding:7day`):
Granted once a member has been in the server for 7 days.

**Messages role** (`onboarding:messages`):
Granted once a member's counted messages reach 400 characters in total.

**Finished role** (`onboarding:finished`):
Granted when a member holds both the 7-day role and the messages role. It unlocks the rest of the server. The 7-day and messages roles are removed when it is granted.

**Dormant role** (`onboarding:dormant`):
Granted to a member who has not reached the finished role 3 months after joining. It strips their onboarding progress and signals that they must take action to return.

**Rectification**:
Leaving dormancy, either by the member pressing the button in the dormant channel or by a moderator using a command. It removes the dormant role and restarts the 7-day clock, the message count and the 3-month deadline from that moment.

**Restart anchor**:
The moment from which a member's Onboarding clocks run: their join date, or their latest rectification if that is later.

**Dormant channel**:
The one channel a dormant member can read besides message mods. It explains that their account is dormant and holds the button for rectification.

**Counted message**:
A message that contributes characters toward the messages role. Messages sent before the start role count; messages deleted or caught by spam detection do not. Only the text counts, stripped of whitespace, markdown formatting and links; attachments add nothing.

**Exempt member**:
A bot or moderator. They never receive onboarding roles and never go dormant.

**Legacy member**:
A member who joined before Onboarding launched. They skip the flow and receive the start, finished and legacy roles the first time the bot sees them post.
_Avoid_: Grandfathered member (gendered term)

**Legacy role** (`onboarding:legacy`):
A permanent marker that tells moderators a member was given the finished role by being a legacy member and did not earn it.
