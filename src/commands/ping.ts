import { createCommand } from '../util/commands.js';

export const pingCommand = createCommand(
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
  async (interaction) => {
    const user = interaction.user;
    await interaction.reply(`<@${user.id}> Pong!`);
  }
);
