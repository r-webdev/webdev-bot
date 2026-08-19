import {
  ActionRowBuilder,
  type ButtonInteraction,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ComponentType,
  Colors,
  ContainerBuilder,
  type MessageActionRowComponentBuilder,
  MessageFlags,
  SeparatorBuilder,
  type StringSelectMenuInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
  type TopLevelComponent,
  time,
} from 'discord.js';
import {
  type ButtonSubmitInteraction,
  registerButtonSubmitInteraction,
} from '@/common/interactions/button-interaction.js';
import {
  type SelectMenuSubmitInteraction,
  registerSelectMenuSubmitInteraction,
} from '@/common/interactions/select-menu-interaction.js';
import { ErrorMessages } from '@/error-messages/index.js';
import { TagService } from '@/services/tags/tag-service.js';
import {
  basicErrorMessage,
  basicMessage,
} from '@/util/components/basic-message.js';
import { customId, parseCustomId } from '@/util/custom-id.js';
import { getCommandUser } from '@/util/member.js';
import { isStaff } from '@/util/permissions.js';
import { clampText } from '@/util/text.js';
import { getTagPrimaryAlias } from '@/util/tags.js';

export const PRUNE_TAGS_COMMAND_NAME = 'prune-tags';
const DEFAULT_PER_PAGE = 10;
// Discord string select menus support at most 25 options.
const MAX_PER_PAGE = 25;

const HEADER_REGEX = /Page (\d+)\/(\d+) • Per Page (\d+)/;

export const clampPrunePerPage = (perPage: number | null): number => {
  if (perPage === null) {
    return DEFAULT_PER_PAGE;
  }
  return Math.min(Math.max(perPage, 1), MAX_PER_PAGE);
};

const buildPruneTagsMessage = async ({
  page,
  perPage,
}: {
  page: number;
  perPage: number;
}): Promise<{
  components: (
    | ContainerBuilder
    | ActionRowBuilder<MessageActionRowComponentBuilder>
  )[];
  totalCount: number;
  totalPages: number;
}> => {
  const { tags, totalCount } = await TagService.getPrunableTags(page, perPage);
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const offset = (page - 1) * perPage;

  const tagLines = tags
    .map((tag, index) => {
      const primaryName = getTagPrimaryAlias(tag);
      const lastUsed = tag.lastUsedAt
        ? time(tag.lastUsedAt, 'R')
        : 'never used';
      return `${index + offset + 1}) **${primaryName}** • ${clampText(tag.desc, 100)} • ${tag.uses} use${tag.uses === 1 ? '' : 's'} • last used ${lastUsed}`;
    })
    .join('\n');

  const container = new ContainerBuilder()
    .setAccentColor(Colors.Orange)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🧹 Prunable Tags (Page ${page}/${totalPages} • Per Page ${perPage})`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(tagLines || 'No prunable tags found.')
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# Total prunable: ${totalCount} | Select tags to KEEP below, then press Prune`
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(customId(PRUNE_TAGS_COMMAND_NAME, 'prev'))
          .setEmoji('⬅️')
          .setLabel('Prev')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page <= 1),
        new ButtonBuilder()
          .setCustomId(customId(PRUNE_TAGS_COMMAND_NAME, 'next'))
          .setEmoji('➡️')
          .setLabel('Next')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page >= totalPages)
      )
    );

  const components: (
    | ContainerBuilder
    | ActionRowBuilder<MessageActionRowComponentBuilder>
  )[] = [container];

  if (tags.length > 0) {
    const keepRow =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(customId(PRUNE_TAGS_COMMAND_NAME, 'keep'))
          .setPlaceholder('Select tags to KEEP (excludes them from pruning)')
          .setMinValues(0)
          .setMaxValues(tags.length)
          .addOptions(
            tags.map((tag) =>
              new StringSelectMenuOptionBuilder()
                .setLabel(clampText(getTagPrimaryAlias(tag), 100))
                .setValue(String(tag.id))
            )
          )
      );
    const pruneRow =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(customId(PRUNE_TAGS_COMMAND_NAME, 'execute'))
          .setLabel('Prune Tags')
          .setEmoji('🗑️')
          .setStyle(ButtonStyle.Danger)
      );
    components.push(keepRow, pruneRow);
  }

  return { components, totalCount, totalPages };
};

export const parseHeader = (
  components: readonly TopLevelComponent[]
): { page: number; perPage: number } | undefined => {
  const container = components[0];
  if (container?.type !== ComponentType.Container) {
    return;
  }
  const header = container.components[0];
  if (header?.type !== ComponentType.TextDisplay) {
    return;
  }
  const match = header.content.match(HEADER_REGEX);
  if (!match) {
    return;
  }
  return { page: Number(match[1]), perPage: Number(match[3]) };
};

export const getCandidateAndKeepIds = (
  components: readonly TopLevelComponent[]
): { candidateIds: number[]; keepIds: number[] } => {
  const selectRow = components[1];
  if (selectRow?.type !== ComponentType.ActionRow) {
    return { candidateIds: [], keepIds: [] };
  }
  const select = selectRow.components[0];
  if (select?.type !== ComponentType.StringSelect) {
    return { candidateIds: [], keepIds: [] };
  }
  const candidateIds = select.options.map((option) => Number(option.value));
  const keepIds = select.options
    .filter((option) => option.default)
    .map((option) => Number(option.value));
  return { candidateIds, keepIds };
};

export const pruneTagsCommandHandler = async (
  interaction: ChatInputCommandInteraction
) => {
  if (!isStaff(getCommandUser(interaction))) {
    await interaction.reply({
      components: [ErrorMessages.User.MissingPermissions],
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
    return;
  }

  const perPage = clampPrunePerPage(interaction.options.getInteger('per_page'));

  await interaction.deferReply();
  const { components } = await buildPruneTagsMessage({
    page: 1,
    perPage,
  });
  await interaction.editReply({
    components,
    flags: MessageFlags.IsComponentsV2,
  });
};

const handlePruneExecution = async (
  buttonInteraction: ButtonInteraction,
  perPage: number
): Promise<void> => {
  const { candidateIds, keepIds } = getCandidateAndKeepIds(
    buttonInteraction.message.components
  );
  const keepSet = new Set(keepIds);
  const deleteIds = candidateIds.filter((id) => !keepSet.has(id));

  await buttonInteraction.deferUpdate();

  if (deleteIds.length === 0) {
    await buttonInteraction.followUp({
      components: [
        basicErrorMessage('No tags were pruned (everything was kept).'),
      ],
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
    return;
  }

  const deletedCount = await TagService.deleteMany(deleteIds);

  const { components } = await buildPruneTagsMessage({ page: 1, perPage });
  await buttonInteraction.editReply({
    components,
    flags: MessageFlags.IsComponentsV2,
  });

  await buttonInteraction.followUp({
    components: [
      basicMessage(
        `🗑️ Pruned ${deletedCount} tag${deletedCount === 1 ? '' : 's'}.`
      ),
    ],
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
  });
};

const handleButtonSubmission: ButtonSubmitInteraction = {
  commandName: PRUNE_TAGS_COMMAND_NAME,
  handler: async (buttonInteraction) => {
    if (!isStaff(getCommandUser(buttonInteraction))) {
      await buttonInteraction.reply({
        components: [ErrorMessages.User.MissingPermissions],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      });
      return;
    }

    const [, action] = parseCustomId(buttonInteraction.customId);
    const info = parseHeader(buttonInteraction.message.components);
    if (!info) {
      await buttonInteraction.reply({
        components: [
          basicErrorMessage(
            'An error occurred while processing the pagination.'
          ),
        ],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      });
      return;
    }

    if (action === 'execute') {
      await handlePruneExecution(buttonInteraction, info.perPage);
      return;
    }

    const direction = action === 'next' ? 1 : -1;
    const nextPage = info.page + direction;

    await buttonInteraction.deferUpdate();
    const { components } = await buildPruneTagsMessage({
      page: nextPage,
      perPage: info.perPage,
    });
    await buttonInteraction.editReply({
      components,
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
registerButtonSubmitInteraction(handleButtonSubmission);

const handleSelectSubmission: SelectMenuSubmitInteraction = {
  commandName: PRUNE_TAGS_COMMAND_NAME,
  handler: async (selectInteraction: StringSelectMenuInteraction) => {
    if (!isStaff(getCommandUser(selectInteraction))) {
      await selectInteraction.reply({
        components: [ErrorMessages.User.MissingPermissions],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      });
      return;
    }

    const keepSet = new Set(selectInteraction.values);
    const updatedSelect = new StringSelectMenuBuilder()
      .setCustomId(selectInteraction.customId)
      .setPlaceholder('Select tags to KEEP (excludes them from pruning)')
      .setMinValues(0)
      .setMaxValues(selectInteraction.component.options.length)
      .addOptions(
        selectInteraction.component.options.map((option) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(option.label)
            .setValue(option.value)
            .setDefault(keepSet.has(option.value))
        )
      );

    const components = selectInteraction.message.components.map(
      (component, index) => {
        if (index !== 1) {
          return component;
        }
        return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          updatedSelect
        );
      }
    );

    await selectInteraction.update({
      components,
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
registerSelectMenuSubmitInteraction(handleSelectSubmission);
