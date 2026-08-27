import { type ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { ErrorMessages } from '@/error-messages/index.js';
import { TagService } from '@/services/tags/tag-service.js';
import {
  basicErrorMessage,
  basicMessage,
} from '@/util/components/basic-message.js';
import { getTagPrimaryAlias } from '@/util/tags.js';
import { getCommandUser } from '@/util/member.js';
import { canAccessTags } from './permissions.js';

export const deleteTagCommandHandler = async (
  interaction: ChatInputCommandInteraction
) => {
  const name = interaction.options.getString('name', true);

  const commandUser = getCommandUser(interaction);

  if (!canAccessTags(commandUser)) {
    await interaction.reply({
      components: [ErrorMessages.User.MissingRole],
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const tag = await TagService.getByName(name);
  if (tag === null) {
    await interaction.editReply({
      components: [ErrorMessages.Tags.TagNotFound(name)],
      flags: MessageFlags.IsComponentsV2,
    });
    return;
  }

  try {
    await TagService.delete(tag.id);
    await interaction.editReply({
      components: [
        basicMessage(`Tag \`${getTagPrimaryAlias(tag)}\` has been deleted.`),
      ],
      flags: MessageFlags.IsComponentsV2,
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    if (!interaction.replied) {
      await interaction.editReply({
        components: [
          basicErrorMessage('An error occurred while deleting the tag.'),
        ],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  }
};
