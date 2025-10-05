import { ActivityType, Client, GatewayIntentBits } from 'discord.js';
import { config } from './env.js';
import { commands, events, registerCommands, registerEvents } from './util/loaders.js';

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
    activities: [{ type: ActivityType.Custom, name: '/help for commands' }],
    status: 'online',
  },
});

// Register events and commands
await registerEvents(client, events);
await registerCommands(client, commands);

void client.login(config.discord.token);
