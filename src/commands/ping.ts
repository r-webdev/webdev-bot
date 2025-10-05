import { createCommand } from './index.js';

export default createCommand(
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
  async (interaction) => {
    const user = interaction.user;
    await interaction.reply(`<@${user.id}> Pong!`);
  }
);
