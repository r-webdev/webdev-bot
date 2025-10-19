A comprehensive Discord bot designed specifically for the Web Dev Discord server, providing helpful resources, documentation lookup, moderation tools, and educational content for web developers.
<br>
<br>

# Features


### Documentation Commands
- **`/mdn [query]`** - Search MDN Web Docs for web development documentation
- **`/npm [query]`** - Search npm registry for packages
- **`/baseline [query]`** - Check browser baseline compatibility for web features


### Educational Resources
- **`/guides [subject]`** - Access detailed guides on various web development topics
- **`/tips [subject]`** - Get helpful tips and best practices for web development


### Moderation Tools
- **`/repel [target] [reason]`** - Advanced moderation command (meant to be given to a high quantity of volunteer assistants) that:
  - 1: Checks bot permissions.
  - 2: Checks target's role to make sure it's under in hierarchy.
  - 3: Times out target user.
  - 4: Deletes target user's very recent messages across channels.
  - 5: Logs the action to a channel.


### Utility Commands
- **`/ping`** - Basic connectivity test to verify bot responsiveness

<br>

# Installation & Setup

### Prerequisites
- Node.js (version specified in `.nvmrc`)
- pnpm package manager
- Discord Bot Token

<br>


1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd webdev-bot-main
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables (create `.env` file):
   ```
   DISCORD_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_client_id_here
   DISCORD_GUILD_ID=your_guild_id_here
   ```

4. Build and start the bot:
   ```bash
   pnpm run build:dev
   pnpm start
   ```

- Or for development with hot reloading:
  ```bash
  pnpm run dev
  ```

<br>


### Docker Support
To use docker with the bot:
```bash
# Development
pnpm run docker:dev

# Production
pnpm run docker:prod

# Build only
pnpm run docker:build
```

<br>


# Configuration

### Environment Variables
- `DISCORD_TOKEN` - Discord bot token (required)
- `DISCORD_CLIENT_ID` - Discord application client ID
- `DISCORD_GUILD_ID` - Target guild/server ID
- Additional moderation-specific configuration in `src/env.ts`

<br>

### Bot Permissions
The bot requires the following Discord permissions:
- Send Messages
- Read Message History
- Manage Messages
- Moderate Members
- Use Slash Commands

<br>


# Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

<br>


#### Adding New Guides/Tips
1. Add markdown files to `src/commands/guides/subjects/` or `src/commands/tips/subjects/`
2. Include frontmatter with `name` field
3. The bot will automatically detect and load new content

<br>

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact the Web Dev Discord server moderators

<br>


**Made with ❤️ for the Web Dev Discord community**
