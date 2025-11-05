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

### Discord Server Tips
- **`/tips [subject]`** - Get quick tips on interacting within the Web Dev Discord server

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
   cd webdev-bot
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file based on `.env.example` and fill in the required environment variables:
   ```bash
   cp .env.example .env
   # Edit .env to add your Discord bot token and other configurations
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


## Docker Support
To use docker with the bot, run:
```bash
# Development
pnpm run docker:dev

# Production
pnpm run docker:prod

# Build only
pnpm run docker:build
```

<br>




# Required Permissions

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


### Adding New Guides or Tips
1. Add markdown files to `src/commands/guides/subjects/` or `src/commands/tips/subjects/`
2. Include frontmatter with `name` field
3. The bot will automatically detect and load new content

<br>

# Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact the Web Dev Discord server moderators

<br>


**Made with ❤️ for the Web Dev Discord community**
