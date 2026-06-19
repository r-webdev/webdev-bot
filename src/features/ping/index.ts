import { createSlashCommand } from '@/common/commands/create-commands.js';

export const pingCommand = createSlashCommand({
  data: {
    name: 'ping',
    description: 'Replies with Pong!',
  },
  execute: async (interaction) => {
    const sent = await interaction.reply({
      content: 'pinging...',
      withResponse: true,
    });
    const message = sent.resource?.message;
    if (!message) {
      await interaction.editReply('Failed to send ping message.');
      return;
    }
    const roundTrip = message.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = interaction.client.ws.ping;
    await interaction.editReply(
      `latency: ${apiLatency}ms | Roundtrip: ${roundTrip}ms`
    );
  },
});
