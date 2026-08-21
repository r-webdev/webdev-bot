import { Prisma } from '@generated/prisma/client.js';
import {
  type ChatInputCommandInteraction,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import {
  type ModalSubmitInteraction,
  registerModalSubmitInteraction,
} from '@/common/interactions/modal-interaction.js';
import { prisma } from '@/db/prisma.js';
import { ErrorMessages } from '@/error-messages/index.js';
import { TagService } from '@/services/tags/tag-service.js';
import { basicMessage } from '@/util/components/basic-message.js';
import { customId } from '@/util/custom-id.js';
import { getTagPrimaryAlias, isValidTagName } from '@/util/tags.js';
import { canAccessTags } from './permissions.js';
import { getCommandUser } from '@/util/member.js';

const BASE_NAME = 'create-tag';
export const createTagCommandHandler = async (
  interaction: ChatInputCommandInteraction
) => {
  const commandUser = getCommandUser(interaction);
  if (!canAccessTags(commandUser)) {
    await interaction.reply({
      components: [ErrorMessages.User.MissingRole],
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(customId(BASE_NAME, interaction.user.id, Date.now()))
    .setTitle('Create Tag')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Aliases')
        .setDescription(
          'Comma-separated list of aliases (first one is the primary name)'
        )
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('aliases')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
      new LabelBuilder()
        .setLabel('Short Description')
        .setDescription('What is this tag about?')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('desc')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
      new LabelBuilder()
        .setLabel('Content')
        .setDescription('The content of the tag')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('content')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        )
    );
  await interaction.showModal(modal);
};

const submissionHandler: ModalSubmitInteraction = {
  commandName: BASE_NAME,
  handler: async (interaction) => {
    const commandUser = getCommandUser(interaction);
    if (!canAccessTags(commandUser)) {
      await interaction.reply({
        components: [ErrorMessages.User.MissingRole],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      });
      return;
    }

    const aliasesRaw = interaction.fields.getTextInputValue('aliases');
    const aliases = aliasesRaw
      .split(',')
      .map((alias) => alias.trim())
      .filter(Boolean);
    const content = interaction.fields.getTextInputValue('content');
    const desc = interaction.fields.getTextInputValue('desc');

    if (
      aliases.length === 0 ||
      aliases.some((alias) => !isValidTagName(alias))
    ) {
      await interaction.reply({
        components: [ErrorMessages.Tags.InvalidTagName],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      });
      return;
    }

    const userId = interaction.user.id;
    try {
      const tag = await TagService.create({
        content,
        desc,
        userId,
        aliases,
      });

      await interaction.reply({
        components: [
          basicMessage(
            `Tag created with name: \`${getTagPrimaryAlias(tag)}\`.`
          ),
        ],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const existingTags = await prisma.tagAlias.findMany({
            where: {
              name: { in: aliases },
            },
          });
          await interaction.reply({
            components: [
              ErrorMessages.Tags.TagAlreadyExists(
                existingTags.map((t) => t.name).join(', ')
              ),
            ],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
          });
          return;
        }
      }
    }
  },
};
registerModalSubmitInteraction(submissionHandler);
