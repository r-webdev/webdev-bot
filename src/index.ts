import { ActivityType, Client, GatewayIntentBits } from 'discord.js';
import { commands } from './commands/index.js';
import { config } from './env.js';
import { events } from './events/index.js';
import { registerCommands } from './util/commands.js';
import { registerEvents } from './util/events.js';

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildExpressions,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
  ],
  presence: {
    activities: [{ type: ActivityType.Custom, name: 'Helping you out in the community' }],
    status: 'online',
  },
});

// Register events and commands
await registerEvents(client, events);
await registerCommands(client, commands);

void client.login(config.discord.token);
