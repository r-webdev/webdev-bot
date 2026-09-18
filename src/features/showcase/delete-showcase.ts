import {
  ChannelType,
  Colors,
  EmbedBuilder,
  MessageFlags,
  User,
} from 'discord.js';
import type { ButtonSubmitInteraction } from '@/common/interactions/button-interaction.js';
import type { ModalSubmitInteraction } from '@/common/interactions/modal-interaction.js';
import { logToChannel } from '@/util/channel-logging.js';
import { customId, parseCustomId } from '@/util/custom-id.js';
import { isUserInServer, isUserModerator } from '@/util/member.js';
import { SERVER_CHANNELS } from '@/constants/channels.js';
import { buildDeleteShowcaseModal, parseShowcaseMessage } from './util.js';

const logShowcaseDeletion = async ({
  projectName,
  authorId,
  interactionUser,
  reason,
}: {
  projectName: string;
  authorId: string;
  interactionUser: User;
  reason?: string;
}): Promise<void> => {
  const embed = new EmbedBuilder()
    .setTitle('Showcase Deleted')
    .setDescription(
      [
        `**Project Name:** ${projectName}`,
        `**Author:** <@${authorId}>`,
        `**Deleted By:** <@${interactionUser.id}>`,
        reason ? `**Reason:** ${reason}` : undefined,
      ]
        .filter((line) => line !== undefined)
        .join('\n')
    )
    .setColor(Colors.Red)
    .setAuthor({
      name: interactionUser.tag,
      iconURL: interactionUser.displayAvatarURL(),
    });

  await logToChannel({
    channel: SERVER_CHANNELS.showcaseLogs,
    content: {
      type: 'embed',
      embed,
    },
  });
};

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

    if (
      interactionUser.id !== ownerId &&
      !isUserModerator(interaction.member, interaction)
    ) {
      await interaction.reply({
        content: '❌ You do not have permission to delete this showcase.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      const forumPost =
        interaction.channel?.type === ChannelType.PublicThread
          ? interaction.channel
          : null;
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

      if (
        interactionUser.id !== ownerId &&
        isUserModerator(interaction.member, interaction)
      ) {
        const modal = buildDeleteShowcaseModal({
          id: customId('delete_showcase_modal', forumPost.id),
        });
        await interaction.showModal(modal);
        return;
      }

      const projectName = forumPost.name;
      const { authorId } = parseShowcaseMessage(message.content);
      await interaction.channel?.delete();
      await logShowcaseDeletion({ projectName, authorId, interactionUser });
      await interaction.reply({
        content: '✅ Showcase post has been deleted.',
        flags: MessageFlags.Ephemeral,
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

export const deleteShowcaseModal: ModalSubmitInteraction = {
  commandName: 'delete_showcase_modal',
  handler: async (interaction) => {
    const interactionUser = interaction.user;
    const [, forumPostId] = parseCustomId(interaction.customId);
    const deleteReason =
      interaction.fields.getTextInputValue('deleteReason') || undefined;

    if (!interaction.member || !isUserInServer(interaction.member)) {
      await interaction.reply({
        content: '❌ This command can only be used by server members.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!isUserModerator(interaction.member, interaction)) {
      await interaction.reply({
        content: '❌ You do not have permission to delete this showcase.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      const forumPost =
        interaction.channel?.type === ChannelType.PublicThread
          ? interaction.channel
          : null;
      if (forumPost === null || forumPost.id !== forumPostId) {
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

      const projectName = forumPost.name;
      const { authorId } = parseShowcaseMessage(message.content);
      await interaction.reply({
        content: '✅ Showcase deleted successfully.',
        flags: MessageFlags.Ephemeral,
      });
      await interaction.channel?.delete();

      void logShowcaseDeletion({
        projectName,
        authorId,
        interactionUser,
        reason: deleteReason,
      });
    } catch (error) {
      console.error('Error deleting showcase via modal:', error);
      await interaction.reply({
        content: '❌ An error occurred while trying to delete the showcase.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
