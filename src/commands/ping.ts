import type { Command } from '.';

export default {
	data: {
		name: 'ping',
		description: 'Replies with Pong!',
	},
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
} satisfies Command;
