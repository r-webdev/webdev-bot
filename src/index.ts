import { ActivityType, Client, GatewayIntentBits } from 'discord.js';
import { config } from './internal/env';
import {
	getCommands,
	getEvents,
	loadCommands,
	loadEvents,
} from './util/loaders';

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
		activities: [{ type: ActivityType.Custom, name: 'Watching...' }],
		status: 'online',
	},
});

// Load events and commands
const events = await getEvents(new URL('events/', import.meta.url));
const commands = await getCommands(new URL('commands/', import.meta.url));

await loadEvents(client, events);
await loadCommands(client, commands);

void client.login(config.discord.token);
