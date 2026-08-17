import {
  type ChatInputCommandInteraction,
  Colors,
  ContainerBuilder,
  MessageFlags,
  time,
} from 'discord.js';
import { TagService } from '@/services/tags/tag-service.js';
import { basicMessage } from '@/util/components/basic-message.js';
import { getTagPrimaryAlias } from '@/util/tags.js';

export const getTagInfoCommandHandler = async (
  interaction: ChatInputCommandInteraction
) => {
  await interaction.deferReply();
  const tagName = interaction.options.getString('name', true);
  const tag = await TagService.getByName(tagName);
  if (tag === null) {
    await interaction.editReply({
      components: [basicMessage(`Tag \`${tagName}\` not found.`)],
      flags: MessageFlags.IsComponentsV2,
    });
    return;
  }

  const container = new ContainerBuilder().setAccentColor(Colors.DarkVividPink);
  container
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        [
          `**Tag info for \`${getTagPrimaryAlias(tag)}\`**`,
          `**Aliases:** ${tag.aliases.map((alias) => `\`${alias.name}\``).join(', ')}`,
        ].join('\n')
      )
    )
    .addSeparatorComponents((separator) => separator.setDivider(true))
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        [`**uses:** ${tag.uses}`, ` `, tag.desc].join('\n')
      )
    )
    .addSeparatorComponents((separator) => separator.setDivider(true))
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `-# Last modified by: <@${tag.lastModifiedBy}> ${time(tag.updatedAt, 'R')}`
      )
    );

  await interaction.editReply({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  });
};
