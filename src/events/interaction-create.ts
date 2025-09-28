import { Events } from 'discord.js';
import { getCommands } from '../util/loaders';
import type { DiscordEvent } from '.';

const commands = await getCommands(new URL('../commands/', import.meta.url));

export default {
	name: Events.InteractionCreate,
	execute: async (interaction) => {
		if (interaction.isChatInputCommand()) {
			const command = commands.get(interaction.commandName);

			if (!command) {
				throw new Error(
					`No command matching ${interaction.commandName} was found.`,
				);
			}

			await command.execute(interaction);
		}
	},
} satisfies DiscordEvent<Events.InteractionCreate>;
