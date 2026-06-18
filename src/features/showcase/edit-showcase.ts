import { ChannelType, MessageFlags } from 'discord.js';
import type { ButtonSubmitInteraction } from '@/common/interactions/button-interaction.js';
import {
  type ModalSubmitInteraction,
  registerModalSubmitInteraction,
} from '@/common/interactions/modal-interaction.js';
import { customId, parseCustomId } from '@/util/custom-id.js';
import { isUserInServer, isUserModerator } from '@/util/member.js';
import { buildShowcaseModal, parseShowcaseMessage } from './util.js';

export const editShowcaseInteraction: ButtonSubmitInteraction = {
  commandName: 'edit_showcase',
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
        content: '❌ You do not have permission to edit this showcase.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const forumPost =
      interaction.channel?.type === ChannelType.PublicThread ? interaction.channel : null;
    if (forumPost === null) {
      await interaction.reply({
        content: '❌ This command can only be used in a forum post.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      const message = await forumPost.fetchStarterMessage();
      if (!message) {
        await interaction.reply({
          content: '❌ Could not find the showcase message to edit.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const parent = forumPost.parent?.type === ChannelType.GuildForum ? forumPost.parent : null;
      if (parent === null) {
        await interaction.reply({
          content: '❌ Could not find the parent forum channel.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const { name, link, description } = parseShowcaseMessage(message.content);
      const appliedTags = forumPost.appliedTags;
      const tags = parent.availableTags;

      const modal = buildShowcaseModal({
        id: customId('edit_showcase_modal', ownerId, forumPost.id),
        title: 'Edit Showcase',
        tags,
        name,
        link,
        description,
        appliedTagIds: appliedTags,
      });

      await interaction.showModal(modal);
    } catch (error) {
      console.error('Error editing showcase:', error);
      await interaction.reply({
        content: '❌ An error occurred while trying to edit the showcase.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

const modalHandler: ModalSubmitInteraction = {
  commandName: 'edit_showcase_modal',
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
        content: '❌ You do not have permission to edit this showcase.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const forumPost =
      interaction.channel?.type === ChannelType.PublicThread ? interaction.channel : null;
    if (forumPost === null) {
      await interaction.reply({
        content: '❌ This command can only be used in a forum post.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      const message = await forumPost.fetchStarterMessage();
      if (!message) {
        await interaction.reply({
          content: '❌ Could not find the showcase message to edit.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.reply({
        content: '⏳ Updating showcase...',
        flags: MessageFlags.Ephemeral,
      });

      const { authorId } = parseShowcaseMessage(message.content);
      const effectiveAuthorId = authorId || ownerId;

      const projectName = interaction.fields.getTextInputValue('projectName');
      const projectLink = interaction.fields.getTextInputValue('projectLink');
      const projectDescription = interaction.fields.getTextInputValue('projectDescription');
      const projectTags = interaction.fields.getStringSelectValues('projectTags');
      const projectMedia = interaction.fields.getUploadedFiles('projectMedia');

      await message.edit({
        content: [
          `## Project Name: ${projectName}`,
          `**Author:** <@${effectiveAuthorId}>`,
          projectLink ? `**Link:** ${projectLink}` : '',
          '',
          projectDescription,
        ].join('\n'),
      });

      await forumPost.setName(projectName);
      await forumPost.setAppliedTags(projectTags);

      if (projectMedia !== null && projectMedia.size > 0) {
        await message.edit({
          files: [...projectMedia.values()].map((file) => file.url),
        });
      }

      await interaction.editReply({
        content: '✅ Showcase updated successfully!',
      });
    } catch (error) {
      console.error('Error updating showcase:', error);
      await interaction.reply({
        content: '❌ An error occurred while trying to update the showcase.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

registerModalSubmitInteraction(modalHandler);
