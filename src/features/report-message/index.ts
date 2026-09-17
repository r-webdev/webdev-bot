import { createMessageContextMenuCommand } from '@/common/commands/create-commands.js';
import { SERVER_CHANNELS } from '@/constants/channels.js';
import { Colors, EmbedBuilder, MessageFlags } from 'discord.js';

export const reportMessage = createMessageContextMenuCommand({
  data: {
    name: 'Report to Moderators',
  },
  execute: async (interaction) => {
    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    const guild = interaction.guild;

    if (!guild) {
      await interaction.editReply({
        content: 'This can only be used in a server.',
      });
      return;
    }

    const targetMessage = interaction.targetMessage;
    const reporter = interaction.user;

    try {
      const jumpLink = targetMessage.url;
      const authorTag = targetMessage.author.tag ?? 'Unknown';
      const authorId = targetMessage.author.id ?? 'Unknown';

      const embed = new EmbedBuilder()
        .setTitle('🚩 Message Report')
        .setColor(Colors.DarkOrange)
        .setTimestamp()
        .setURL(jumpLink)
        .addFields(
          { name: 'Reporter', value: `<@${reporter.id}>`, inline: true },
          {
            name: 'Message Link',
            value: `[Jump to message](${jumpLink})`,
            inline: true,
          },
          { name: 'Message ID', value: targetMessage.id, inline: true },
          { name: 'Username', value: authorTag, inline: true },
          { name: 'User ID', value: authorId, inline: true },
          { name: 'Linked User', value: `<@${authorId}>`, inline: true }
        );

      await SERVER_CHANNELS.spamDetection.send({ embeds: [embed] });

      await interaction.editReply({
        content: 'Thanks. The message was reported to moderators.',
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: 'Failed to report the message.',
      });
    }
  },
});
