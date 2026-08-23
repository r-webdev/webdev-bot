import {
  type ChatInputCommandInteraction,
  Colors,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
} from 'discord.js';
import { TagService } from '@/services/tags/tag-service.js';
import { basicMessage } from '@/util/components/basic-message.js';
import { getTagPrimaryAlias } from '@/util/tags.js';

export const topTagsCommandHandler = async (
  interaction: ChatInputCommandInteraction
) => {
  await interaction.deferReply();
  const topTags = await TagService.getTopTags(10);

  if (topTags.length === 0) {
    await interaction.editReply({
      components: [basicMessage('No tags have been used yet.')],
      flags: MessageFlags.IsComponentsV2,
    });
    return;
  }
  const longestName = Math.max(
    ...topTags.map((tag) => getTagPrimaryAlias(tag).length)
  );
  const medals = ['🥇', '🥈', '🥉'];

  const response = [
    '```',
    ...topTags.map((tag, index) => {
      const isMedal = index < 3;

      const prefix = isMedal
        ? `${medals[index]} \u2005`
        : `${String(index + 1).padStart(2, ' ')}. `;

      const paddedName = getTagPrimaryAlias(tag).padEnd(longestName + 2);

      return `${prefix}${paddedName}${tag.uses} use${tag.uses !== 1 ? 's' : ''}`;
    }),
    '```',
  ].join('\n');

  await interaction.editReply({
    components: [
      new ContainerBuilder()
        .setAccentColor(Colors.Gold)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`### Top Tags\n\n${response}`)
        ),
    ],
    flags: MessageFlags.IsComponentsV2,
  });
};
