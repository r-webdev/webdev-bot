import { Events } from 'discord.js';
import type { DiscordEvent } from '.';
export default {
	name: Events.ClientReady,
	once: true,
	execute: (client) => {
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
} satisfies DiscordEvent<Events.ClientReady>;
