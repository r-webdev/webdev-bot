import {
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  ChannelType,
  type ChatInputCommandInteraction,
  Colors,
  ContainerBuilder,
  EmbedBuilder,
  MessageFlags,
  TextDisplayBuilder,
} from 'discord.js';
import { createSlashCommand } from '@/common/commands/create-commands.js';
import {
  type ButtonSubmitInteraction,
  registerButtonSubmitInteraction,
} from '@/common/interactions/button-interaction.js';
import {
  type ModalSubmitInteraction,
  registerModalSubmitInteraction,
} from '@/common/interactions/modal-interaction.js';
import { config } from '@/env.js';
import { logToChannel } from '@/util/channel-logging.js';
import { customId } from '@/util/custom-id.js';
import { deleteShowcase } from './delete-showcase.js';
import { editShowcaseInteraction } from './edit-showcase.js';
import {
  buildShowcaseModal,
  createShowcaseMessageContent,
  getShowcaseLogChannel,
} from './util.js';

export const showModal = async (
  interaction: ButtonInteraction | ChatInputCommandInteraction
) => {
  try {
    const channel = interaction.guild?.channels.cache.get(
      config.channelIds.showcase
    );
    if (channel === undefined || channel.type !== ChannelType.GuildForum) {
      await interaction.reply({
        content:
          'Showcase channel is not properly configured. Please contact an administrator.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const modal = buildShowcaseModal({
      id: customId('showcase', interaction.user.id),
      tags: channel.availableTags,
    });

    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error showing showcase modal:', error);
    await interaction.reply({
      content:
        'There was an error showing the showcase modal. Please try again later.',
      flags: MessageFlags.Ephemeral,
    });
  }
};

export const createShowcaseCommand = createSlashCommand({
  data: {
    name: 'showcase',
    description: 'Showcase a project in the showcase channel',
  },
  execute: showModal,
});

const createShowcaseButtonHandler: ButtonSubmitInteraction = {
  commandName: 'create_showcase',
  handler: showModal,
};

registerButtonSubmitInteraction(createShowcaseButtonHandler);

const modalHandler: ModalSubmitInteraction = {
  commandName: 'showcase',
  handler: async (interaction) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const projectName = interaction.fields.getTextInputValue('projectName');
    const projectLink = interaction.fields.getTextInputValue('projectLink');
    const projectDescription =
      interaction.fields.getTextInputValue('projectDescription');
    const projectTags = interaction.fields.getStringSelectValues('projectTags');
    const projectMedia = interaction.fields.getUploadedFiles('projectMedia');

    const channel = interaction.guild?.channels.cache.get(
      config.channelIds.showcase
    );
    if (channel === undefined || channel.type !== ChannelType.GuildForum) {
      await interaction.editReply({
        content:
          'Showcase channel is not properly configured. Please contact an administrator.',
      });
      return;
    }

    try {
      const thread = await channel.threads.create({
        name: projectName,
        appliedTags: projectTags,
        message: {
          content: createShowcaseMessageContent({
            link: projectLink,
            authorId: interaction.user.id,
            description: projectDescription,
          }),
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

      try {
        const logChannel = getShowcaseLogChannel(interaction.guild);
        const author = {
          name: interaction.user.tag,
          iconURL: interaction.user.displayAvatarURL(),
        };

        const embed = new EmbedBuilder()
          .setAuthor(author)
          .setTitle('Showcase Created')
          .addFields(
            { name: 'Project Name', value: projectName || '—', inline: false },
            {
              name: 'Author',
              value: `<@${interaction.user.id}>`,
              inline: true,
            },
            { name: 'Thread', value: thread.url ?? '—', inline: true }
          )
          .setColor(Colors.Green)
          .setTimestamp();

        await logToChannel({
          channel: logChannel,
          content: { type: 'embed', embed },
          silent: true,
        });
      } catch (error) {
        console.error('Failed to log showcase creation:', error);
      }

      await interaction.editReply({
        content: `Your project has been showcased successfully! You can view it here: ${thread.url}`,
      });
    } catch (error) {
      console.error('Error creating showcase thread:', error);
      await interaction.editReply({
        content:
          'There was an error showcasing your project. Please try again later.',
      });
    }
  },
};

registerModalSubmitInteraction(modalHandler);
registerButtonSubmitInteraction(deleteShowcase);
registerButtonSubmitInteraction(editShowcaseInteraction);
