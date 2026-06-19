import { ChannelType, Colors, EmbedBuilder, MessageFlags } from 'discord.js';
import type { ButtonSubmitInteraction } from '@/common/interactions/button-interaction.js';
import { logToChannel } from '@/util/channel-logging.js';
import { parseCustomId } from '@/util/custom-id.js';
import { isUserInServer, isUserModerator } from '@/util/member.js';
import { getShowcaseLogChannel, parseShowcaseMessage } from './util.js';

export const deleteShowcase: ButtonSubmitInteraction = {
  commandName: 'delete_showcase',
  handler: async (interaction) => {
    const interactionUser = interaction.user;
    const [, ownerId] = parseCustomId(interaction.customId);

    if (!interaction.member || !isUserInServer(interaction.member)) {
      await interaction.reply({
        content: '❌ This command can only be used by server members.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (interactionUser.id !== ownerId && !isUserModerator(interaction.member, interaction)) {
      await interaction.reply({
        content: '❌ You do not have permission to delete this showcase.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      const forumPost =
        interaction.channel?.type === ChannelType.PublicThread ? interaction.channel : null;
      if (forumPost === null) {
        await interaction.reply({
          content: '❌ This command can only be used in a forum post.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      if (forumPost === null) {
        await interaction.reply({
          content: '❌ This command can only be used in a forum post.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const message = await forumPost.fetchStarterMessage();
      if (!message) {
        await interaction.reply({
          content: '❌ Could not find the showcase message to delete.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const { projectName } = parseShowcaseMessage(message.content);
      await interaction.channel?.delete();
      const logChannel = getShowcaseLogChannel(interaction.guild);
      await logToChannel({
        channel: logChannel,
        content: {
          type: 'embed',
          embed: new EmbedBuilder()
            .setTitle('Showcase Deleted')
            .setDescription(
              `**Project Name:** ${projectName}\n**Deleted By:** <@${interactionUser.id}>`
            )
            .setColor(Colors.Red)
            .setAuthor({ name: interactionUser.tag, iconURL: interactionUser.displayAvatarURL() }),
        },
      });
    } catch (error) {
      console.error('Error deleting showcase:', error);
      await interaction.reply({
        content: '❌ An error occurred while trying to delete the showcase.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

// Registration is in create-showcase.ts
