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
import {
  basicErrorMessage,
  basicMessage,
} from '@/util/components/basic-message.js';
import { customId, parseCustomId } from '@/util/custom-id.js';
import { isValidTagName } from '@/util/tags.js';
import { getCommandUser } from '@/util/member.js';
import { canAccessTags } from './permissions.js';

const BASE_NAME = 'tags-edit';

export const editTagCommandHandler = async (
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

  const name = interaction.options.getString('name', true);

  const tag = await TagService.getByName(name);
  if (tag === null) {
    await interaction.reply({
      components: [ErrorMessages.Tags.TagNotFound(name)],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
    return;
  }

  const modal = new ModalBuilder()
    .setTitle(`Edit Tag: ${name}`)
    .setCustomId(customId(BASE_NAME, name))
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
            .setValue(tag.aliases.map((a) => a.name).join(', '))
        ),
      new LabelBuilder()
        .setLabel('Short Description')
        .setDescription('What is this tag about?')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('desc')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setValue(tag.desc)
        ),
      new LabelBuilder()
        .setLabel('Content')
        .setDescription('The new content of the tag')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('content')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setValue(tag.content)
        )
    );

  await interaction.showModal(modal);
};

const modalHandler: ModalSubmitInteraction = {
  commandName: BASE_NAME,
  handler: async (interaction) => {
    const [_, tagName] = parseCustomId(interaction.customId);
    const aliasesRaw = interaction.fields.getTextInputValue('aliases');
    const newAliases = aliasesRaw
      .split(',')
      .map((string) => string.trim())
      .filter(Boolean);
    const content = interaction.fields.getTextInputValue('content');
    const desc = interaction.fields.getTextInputValue('desc');
    if (
      newAliases.length === 0 ||
      newAliases.some((alias) => !isValidTagName(alias))
    ) {
      await interaction.reply({
        components: [ErrorMessages.Tags.InvalidTagName],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      });
      return;
    }

    try {
      const updatedTag = await TagService.update(tagName, {
        content,
        desc,
        aliases: newAliases,
        userId: interaction.user.id,
      });

      await interaction.reply({
        components: [
          basicMessage(
            `Tag ${updatedTag?.aliases.map((tag) => tag.name).join(', ')} has been updated.`
          ),
        ],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      });
    } catch (error) {
      console.error(error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existingTags = await prisma.tagAlias.findMany({
          where: {
            name: { in: newAliases },
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
      await interaction.reply({
        components: [
          basicErrorMessage(
            `Failed to update tag \`${tagName}\`. It may have been deleted.`
          ),
        ],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      });
    }
  },
};
registerModalSubmitInteraction(modalHandler);
