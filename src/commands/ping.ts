import { createCommand } from '../util/commands.js';

export const pingCommand = createCommand({
  data: {
    name: 'ping',
    description: 'Replies with Pong!',
  },
  execute: async (interaction) => {
    const user = interaction.user;
    await interaction.reply(`<@${user.id}> Pong!`);
  },
});
