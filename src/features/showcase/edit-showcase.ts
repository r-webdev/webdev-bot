import {
  ChannelType,
  Colors,
  EmbedBuilder,
  escapeCodeBlock,
  MessageFlags,
} from 'discord.js';
import type { ButtonSubmitInteraction } from '@/common/interactions/button-interaction.js';
import {
  type ModalSubmitInteraction,
  registerModalSubmitInteraction,
} from '@/common/interactions/modal-interaction.js';
import { customId, parseCustomId } from '@/util/custom-id.js';
import { toDiscordDiff } from '@/util/discord-diff.js';
import { isUserInServer, isUserModerator } from '@/util/member.js';
import { clampText, wrapInDiffBlock } from '@/util/text.js';
import type { ShowcaseEditChange } from './types.js';
import {
  buildShowcaseModal,
  createShowcaseMessageContent,
  getAttachmentsCount,
  getShowcaseLogChannel,
  parseShowcaseMessage,
  resolveTagNames,
} from './util.js';

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

    if (
      interactionUser.id !== ownerId &&
      !isUserModerator(interaction.member, interaction)
    ) {
      await interaction.reply({
        content: '❌ You do not have permission to edit this showcase.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

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

    try {
      const message = await forumPost.fetchStarterMessage();
      if (!message) {
        await interaction.reply({
          content: '❌ Could not find the showcase message to edit.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const parentChannel =
        forumPost.parent?.type === ChannelType.GuildForum
          ? forumPost.parent
          : null;
      if (parentChannel === null) {
        await interaction.reply({
          content: '❌ Could not find the parent forum channel.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const { link, description } = parseShowcaseMessage(message.content);
      const appliedTags = forumPost.appliedTags;
      const tags = parentChannel.availableTags;

      const modal = buildShowcaseModal({
        id: customId('edit_showcase_modal', ownerId, forumPost.id),
        tags,
        projectName: forumPost.name,
        link,
        description,
        appliedTagIds: appliedTags,
        isEdit: true,
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

    if (
      interactionUser.id !== ownerId &&
      !isUserModerator(interaction.member, interaction)
    ) {
      await interaction.reply({
        content: '❌ You do not have permission to edit this showcase.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

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

      const threadParent =
        forumPost.parent?.type === ChannelType.GuildForum
          ? forumPost.parent
          : null;
      if (threadParent === null) {
        await interaction.reply({
          content: '❌ Could not find the parent forum channel.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const prev = parseShowcaseMessage(message.content);
      const effectiveAuthorId = prev.authorId || ownerId;
      const prevTitle = forumPost.name;
      const prevLink = prev.link;
      const prevDescription = prev.description;
      const prevTagIds = forumPost.appliedTags ?? [];
      const prevAttachmentsCount = getAttachmentsCount(message.attachments);

      const newProjectName =
        interaction.fields.getTextInputValue('projectName');
      const newProjectLink =
        interaction.fields.getTextInputValue('projectLink');
      const newProjectDescription =
        interaction.fields.getTextInputValue('projectDescription');
      const newProjectTags =
        interaction.fields.getStringSelectValues('projectTags');
      const projectMedia = interaction.fields.getUploadedFiles('projectMedia');

      let newAttachmentsCount = prevAttachmentsCount;
      if (projectMedia != null) {
        if (projectMedia.size > 0) {
          newAttachmentsCount = projectMedia.size;
        }
      }

      const changes: ShowcaseEditChange[] = [];
      if (prevTitle !== newProjectName) {
        changes.push({
          field: 'title',
          before: prevTitle,
          after: newProjectName,
        });
      }
      if (prevLink !== newProjectLink) {
        changes.push({
          field: 'link',
          before: prevLink,
          after: newProjectLink,
        });
      }
      if (prevDescription !== newProjectDescription) {
        changes.push({
          field: 'description',
          before: prevDescription,
          after: newProjectDescription,
        });
      }
      const tagsEqual = () => {
        if (prevTagIds.length !== newProjectTags.length) {
          return false;
        }
        const s = new Set(prevTagIds);
        return newProjectTags.every((t) => s.has(t));
      };
      if (!tagsEqual()) {
        changes.push({
          field: 'tags',
          before: resolveTagNames(prevTagIds, threadParent.availableTags).join(
            ', '
          ),
          after: resolveTagNames(
            newProjectTags,
            threadParent.availableTags
          ).join(', '),
        });
      }
      if (newAttachmentsCount > 0) {
        changes.push({
          field: 'attachments',
          before: prevAttachmentsCount.toString(),
          after: newAttachmentsCount.toString(),
        });
      }

      await message.edit({
        // content: [
        //   `## Project Name: ${newProjectName}`,
        //   `**Author:** <@${effectiveAuthorId}>`,
        //   newProjectLink ? `**Link:** ${newProjectLink}` : '',
        //   '',
        //   newProjectDescription,
        // ].join('\n'),
        content: createShowcaseMessageContent({
          link: newProjectLink,
          authorId: effectiveAuthorId,
          description: newProjectDescription,
        }),
      });

      await forumPost.setName(newProjectName);
      await forumPost.setAppliedTags(newProjectTags);

      if (projectMedia !== null && projectMedia.size > 0) {
        const files = projectMedia.map((file) => file.url);
        await message.edit({
          files,
        });
      }

      if (changes.length > 0) {
        try {
          const logChannel = getShowcaseLogChannel(interaction.guild);
          const author = {
            name: interaction.user.tag,
            iconURL: interaction.user.displayAvatarURL(),
          };

          const diff = changes
            .reduce<string[]>((acc, change) => {
              acc.push(`**${change.field.toUpperCase()}**`);
              acc.push(
                wrapInDiffBlock(
                  clampText(
                    toDiscordDiff(
                      escapeCodeBlock(change.before),
                      escapeCodeBlock(change.after)
                    ),
                    3500
                  )
                )
              );
              return acc;
            }, [])
            .join('\n');

          const embed = new EmbedBuilder()
            .setAuthor(author)
            .setTitle('Showcase Updated')
            .setDescription(
              clampText(
                `Showcase ${forumPost.url} updated by <@${interaction.user.id}> \n\n${diff}`,
                3999
              )
            )
            .setColor(Colors.Orange)
            .setTimestamp();

          await logChannel.send({
            embeds: [embed],
            allowedMentions: { parse: [] },
          });
        } catch (error) {
          console.error('Failed to log showcase edit:', error);
        }
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
