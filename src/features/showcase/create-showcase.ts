import {
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
} from 'discord.js';
import { createSlashCommand } from '@/common/commands/create-commands.js';
import { registerButtonSubmitInteraction } from '@/common/interactions/button-interaction.js';
import {
  type ModalSubmitInteraction,
  registerModalSubmitInteraction,
} from '@/common/interactions/modal-interaction.js';
import { config } from '@/env.js';
import { customId } from '@/util/custom-id.js';
import { deleteShowcase } from './delete-showcase.js';
import { editShowcaseInteraction } from './edit-showcase.js';
import { buildShowcaseModal } from './util.js';

export const createShowcaseCommand = createSlashCommand({
  data: {
    name: 'showcase',
    description: 'Showcase a project in the showcase channel',
  },
  execute: async (interaction) => {
    const channel = interaction.guild?.channels.cache.get(config.channelIds.showcase);
    if (channel === undefined || channel.type !== ChannelType.GuildForum) {
      await interaction.reply({
        content: 'Showcase channel is not properly configured. Please contact an administrator.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    console.log(channel.availableTags);

    const modal = buildShowcaseModal({
      id: customId('showcase', interaction.user.id),
      title: 'Showcase your project',
      tags: channel.availableTags,
    });

    await interaction.showModal(modal);
  },
});

const modalHandler: ModalSubmitInteraction = {
  commandName: 'showcase',
  handler: async (interaction) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const projectName = interaction.fields.getTextInputValue('projectName');
    const projectLink = interaction.fields.getTextInputValue('projectLink');
    const projectDescription = interaction.fields.getTextInputValue('projectDescription');
    const projectTags = interaction.fields.getStringSelectValues('projectTags');
    const projectMedia = interaction.fields.getUploadedFiles('projectMedia');

    const channel = interaction.guild?.channels.cache.get(config.channelIds.showcase);
    if (channel === undefined || channel.type !== ChannelType.GuildForum) {
      await interaction.reply({
        content: 'Showcase channel is not properly configured. Please contact an administrator.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      const thread = await channel.threads.create({
        name: projectName,
        appliedTags: projectTags,
        message: {
          content: [
            `## Project Name: ${projectName}`,
            `**Author:** <@${interaction.user.id}>`,
            projectLink && `**Link:** ${projectLink}`,
            '',
            projectDescription,
          ].join('\n'),
          files: projectMedia?.map((file) => file.url) ?? [],
          allowedMentions: { users: [interaction.user.id] },
        },
      });

      await thread.send({
        flags: MessageFlags.IsComponentsV2,
        components: [
          new ContainerBuilder()
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                [
                  'Congratulations on showcasing your project! 🎉',
                  'People can view your project and leave comments here. If you want to edit or delete this post, use the buttons below.',
                ].join('\n\n')
              )
            )
            .addActionRowComponents((row) =>
              row.addComponents(
                new ButtonBuilder()
                  .setCustomId(customId('delete_showcase', interaction.user.id))
                  .setLabel('Delete post')
                  .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                  .setCustomId(customId('edit_showcase', interaction.user.id))
                  .setLabel('Edit post')
                  .setStyle(ButtonStyle.Secondary)
              )
            ),
        ],
      });
      await interaction.editReply({
        content: `Your project has been showcased successfully! You can view it here: ${thread.url}`,
      });
    } catch (error) {
      console.error('Error creating showcase thread:', error);
    }
  },
};

registerModalSubmitInteraction(modalHandler);
registerButtonSubmitInteraction(deleteShowcase);
registerButtonSubmitInteraction(editShowcaseInteraction);
