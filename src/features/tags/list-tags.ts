import {
  OptionKey,
  type Tag,
  type TagAlias,
} from '@generated/prisma/client.js';
import type { TagWhereInput } from '@generated/prisma/models.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  Colors,
  ComponentType,
  ContainerBuilder,
  type MessageActionRowComponentBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder,
  type TopLevelComponent,
} from 'discord.js';
import {
  type ButtonSubmitInteraction,
  registerButtonSubmitInteraction,
} from '@/common/interactions/button-interaction.js';
import { prisma } from '@/db/prisma.js';
import { getBotOption } from '@/options.js';
import { customId, parseCustomId } from '@/util/custom-id.js';
import { getTagPrimaryAlias } from '@/util/tags.js';
import { clampText } from '@/util/text.js';

export type FullTag = Tag & { aliases: TagAlias[] };

const PAGE_SIZE = 10;

const buildTagWhere = (search?: string | null): TagWhereInput | undefined =>
  search
    ? {
        OR: [
          { aliases: { some: { name: { contains: search } } } },
          { desc: { contains: search } },
        ],
      }
    : undefined;

const fetchTags = async (page: number, search?: string | null) => {
  const where = buildTagWhere(search);
  const [tags, totalCount] = await Promise.all([
    prisma.tag.findMany({
      where,
      include: { aliases: { orderBy: { id: 'asc' }, take: 1 } },
      orderBy: { aliases: { _count: 'asc' } },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.tag.count(where ? { where } : undefined),
  ]);
  return { tags, totalCount };
};

export const buildListTagsComponents = (
  tags: FullTag[],
  page: number,
  userId: string,
  totalCount: number,
  search?: string | null
) => {
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const container = new ContainerBuilder().setAccentColor(Colors.DarkGreen);

  const headerText = search
    ? `### Tags (Page ${page}/${totalPages}) - Search: "${search}"`
    : `### Tags (Page ${page}/${totalPages})`;

  const offset = (page - 1) * PAGE_SIZE;

  const tagLines = tags
    .map((tag, index) => {
      const primaryName = getTagPrimaryAlias(tag) ?? '(unnamed)';
      return `${index + offset + 1}) **${primaryName}** • ${clampText(tag.desc, 120)} ${tag.uses > 0 ? `• Used **${tag.uses}x**` : ''}`;
    })
    .join('\n');

  container
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(tagLines || 'No tags found.')
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# Total tags: ${totalCount} | Prefix: ${getBotOption(OptionKey.TAG_PREFIX).value}`
      )
    );
  const actionRow =
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId('list-tags', 'prev', userId))
        .setEmoji('⬅️')
        .setLabel('Prev')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 1),
      new ButtonBuilder()
        .setCustomId(customId('list-tags', 'next', userId))
        .setLabel('Next')
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages)
    );

  const components = [container, actionRow];

  return { components, totalPages };
};

export const listTagsCommandHandler = async (
  interaction: ChatInputCommandInteraction
) => {
  const search = interaction.options.getString('search', false);
  const userId = interaction.user.id;
  const currentPage = 1;

  const { tags, totalCount } = await fetchTags(currentPage, search);
  const { components } = buildListTagsComponents(
    tags,
    totalCount > 0 ? currentPage : 0,
    userId,
    totalCount,
    search
  );

  await interaction.reply({
    components,
    flags: MessageFlags.IsComponentsV2,
  });
};

const handleButtonSubmission: ButtonSubmitInteraction = {
  commandName: 'list-tags',
  handler: async (buttonInteraction) => {
    const [_, action, userId] = parseCustomId(buttonInteraction.customId);
    if (buttonInteraction.user.id !== userId) {
      await buttonInteraction.reply({
        content: 'Only the command invoker can use these buttons.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!buttonInteraction.isMessageComponent()) {
      return;
    }

    const info = getInfoFromComponents(buttonInteraction.message.components);
    if (info === undefined) {
      await buttonInteraction.reply({
        content: 'An error occurred while processing the pagination.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const { page, search } = info;
    const direction = action === 'next' ? 1 : -1;
    const currentPage = page + direction;
    await buttonInteraction.deferUpdate();

    const { tags, totalCount } = await fetchTags(currentPage, search);
    const { components } = buildListTagsComponents(
      tags,
      currentPage,
      userId,
      totalCount,
      search
    );

    await buttonInteraction.editReply({
      components,
      flags: MessageFlags.IsComponentsV2,
    });
  },
};

const getInfoFromComponents = (
  components: TopLevelComponent[]
):
  | {
      page: number;
      search?: string;
    }
  | undefined => {
  const container = components[0];
  if (container.type !== ComponentType.Container) {
    return;
  }
  const component = container.components[0];
  if (component.type !== ComponentType.TextDisplay) {
    return;
  }
  return {
    page: parseInt(component.content.match(/Page (\d+)/)?.[1] || '1', 10),
    search: component.content.match(/Search: "(.+)"/)?.[1],
  };
};

registerButtonSubmitInteraction(handleButtonSubmission);
