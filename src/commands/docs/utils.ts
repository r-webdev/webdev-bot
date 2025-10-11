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
}): Pick<ProviderConfig, 'color' | 'icon' | 'commandDescription' | 'directUrl'> => options;

export const executeDocCommand = async (
  config: ProviderConfig,
  interaction: CommandInteraction
): Promise<void> => {
  if (interaction.replied || interaction.deferred) {
    return;
  }

  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  } catch (error) {
    console.error(`deferReply FAILED:`, error);
    return;
  }

  if (!interaction.isChatInputCommand()) {
    return;
  }

  const query = interaction.options.getString('query', true).trim();

  try {
    const items = await config.getFilteredData(query);

    if (items.length === 0) {
      await interaction.editReply({ content: `No results found for "${query}"` });
      return;
    }

    const collection = config.createCollection(items);
    const { selectRow, buttonRow } = config.createActionBuilders(collection);

    const choiceInteraction = await interaction.editReply({
      content: config.getSelectionMessage(query),
      components: [selectRow, buttonRow],
    });

    const collector = choiceInteraction.createMessageComponentCollector({
      filter: (componentInteraction) => componentInteraction.user.id === interaction.user.id,
    });

    collector.once('collect', async (componentInteraction) => {
      if (componentInteraction.isStringSelectMenu()) {
        const selectedSet = new Set(componentInteraction.values);
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
      } else if (componentInteraction.isButton()) {
        await choiceInteraction.delete();
      }
    });
  } catch (error) {
    console.error(`executeDocCommand FAILED:`, error);
    await interaction.editReply({ content: `Error: ${error}` });
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
