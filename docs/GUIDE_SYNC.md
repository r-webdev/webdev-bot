# Guide Synchronization System

The bot automatically synchronizes guide markdown files from `src/commands/guides/subjects/` to a Discord channel when it starts up.

## Setup

Add to your `.env` file:
```
GUIDES_CHANNEL_ID=1234567890123456789
```

## Commands

- `npm run sync-guides` - Manual sync (updates only changed guides)
- `npm run sync-guides:init` - Force sync (posts all guides fresh)

## Guide Format

Guides need frontmatter with a `name` field:

```markdown
---
name: JavaScript
---

Your guide content here...
```