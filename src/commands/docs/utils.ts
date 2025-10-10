import { type CommandInteraction, MessageFlags } from 'discord.js';
import { logToChannel } from '../../util/channel-logging.js';
import type { FeatureData } from './baseline.js';
import type { ProviderConfig } from './types.js';

export const SEARCH_TERM = '%SEARCH%';
export const TERM = '%TERM%';

// Utility functions
export const getSearchUrl = (url: string, search: string) => {
  return url.replace(SEARCH_TERM, encodeURIComponent(search));
};

export const createBaseConfig = (options: {
  color: number;
  icon: string;
  commandDescription: string;
  directUrl?: string;
}) => ({
  color: options.color,
  icon: options.icon,
  commandDescription: options.commandDescription,
  directUrl: options.directUrl,
});

export const executeDocCommand = async (
  config: ProviderConfig,
  interaction: CommandInteraction
): Promise<void> => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const query = interaction.options.getString('query', true).trim();

  try {
    const items = await config.getFilteredData(query);

    if (items.length === 0) {
      await interaction.reply({
        content: `No results found for "${query}"`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const collection = config.createCollection(items);
    const { selectRow, buttonRow } = config.createActionBuilders(collection);

    const choiceInteraction = await interaction.reply({
      content: config.getSelectionMessage(query),
      components: [selectRow, buttonRow],
      flags: MessageFlags.Ephemeral,
    });

    const collector = choiceInteraction.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
    });

    collector.once('collect', async (i) => {
      if (i.isStringSelectMenu()) {
        const selectedSet = new Set(i.values);
        const selectedItems = collection.filter((_, key) => selectedSet.has(key));
        const selectedTitles = selectedItems.map(config.getDisplayTitle);

        await interaction.editReply({
          content: config.getDisplayMessage(selectedTitles),
          components: [],
        });

        const embeds = config.createResultEmbeds(selectedItems);

        logToChannel({
          channel: interaction.channel,
          content: {
            type: 'embed',
            embed: embeds,
            content: interaction.options.getUser('user')
              ? `<@${interaction.options.getUser('user')?.id}>`
              : undefined,
          },
        });
      } else if (i.isButton()) {
        await choiceInteraction.delete();
      }
    });
  } catch (error) {
    console.error('Error executing doc command:', error);
    await interaction.reply({
      content: `Error: ${error}`,
      flags: MessageFlags.Ephemeral,
    });
  }
};

export const NON_BASELINE_FEATURES = ['numeric-seperators', 'single-color-gradients'];
export const getBaselineFeatures = (
  originalFeatures: Record<string, unknown>,
  nonFeatureKeys: string[] = NON_BASELINE_FEATURES
): Record<string, FeatureData> => {
  const features = { ...originalFeatures };
  for (const nonFeature of nonFeatureKeys) {
    delete features[nonFeature];
  }
  return features as Record<string, FeatureData>;
};
