import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Collection,
  EmbedBuilder,
  type MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { features as data } from 'web-features';
import { fuzzySearch } from '../../util/fuzzy-search.js';
import { clampText } from '../../util/text.js';
import type { ProviderConfig } from './types.js';
import { createBaseConfig, getBaselineFeatures } from './utils.js';

export type FeatureData = {
  name: string;
  kind: 'feature';
  description: string;
  status: {
    baseline: 'high' | 'low' | false;
    support: Record<string, string>;
  };
};
type FeatureItem = FeatureData & { key: string };

// Prepare baseline features by excluding non-feature entries and converting to array
const features: FeatureItem[] = Object.entries(getBaselineFeatures(data)).map(([key, feature]) => ({
  ...feature,
  key,
}));

const baselines = {
  high: {
    image:
      'https://web-platform-dx.github.io/web-features/assets/img/baseline-widely-word-dark.png',
    description: 'Widely supported',
  },
  low: {
    image: 'https://web-platform-dx.github.io/web-features/assets/img/baseline-newly-word-dark.png',
    description: 'Newly supported',
  },
  none: {
    image:
      'https://web-platform-dx.github.io/web-features/assets/img/baseline-limited-word-dark.png',
    description: 'Not supported',
  },
};

const baseConfig = createBaseConfig({
  color: 0x4e_8c_2f,
  icon: '',
  commandDescription: 'Get baseline support information for web platform features',
});

export const baselineProvider: ProviderConfig<FeatureItem> = {
  ...baseConfig,
  getFilteredData: (query: string) => {
    return fuzzySearch({
      items: features,
      query,
      findIn: [(feature) => feature.name],
      limit: 20,
    });
  },
  createCollection: (items) => new Collection(items.map((item) => [item.key, item])),
  createActionBuilders: (data) => {
    const selectRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('baseline-select')
        .setPlaceholder('Select one feature')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(
          ...data.map((feature) => ({
            label: clampText(feature.name, 100),
            description: clampText(feature.description, 100),
            value: feature.key,
          }))
        )
    );

    const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger)
        .setCustomId('baseline-cancel')
    );

    return { selectRow, buttonRow };
  },
  createResultEmbeds: (selectedItems) =>
    selectedItems.map((feature) => {
      const support = Object.entries(feature.status.support)
        .map(([browser, data]) => `${browser}: **${data}**`)
        .join('\n');
      return new EmbedBuilder()
        .setTitle(feature.name)
        .setColor(baseConfig.color)
        .setDescription(`
          ${feature.description}\n
          ${support}
        `)
        .setImage(
          typeof feature.status.baseline === 'string'
            ? baselines[feature.status.baseline].image
            : baselines.none.image
        )
        .addFields({
          name: 'Baseline status',
          value:
            typeof feature.status.baseline === 'string'
              ? baselines[feature.status.baseline].description
              : baselines.none.description,
        })
        .setFooter({
          text: 'Powered by web-features (web-platform-dx.github.io/web-features)',
        })
        .setTimestamp();
    }),
  getDisplayMessage: (selectedTitles) =>
    `Displaying Result for **${new Intl.ListFormat('en-US').format(selectedTitles)}**:`,
  getDisplayTitle: (feature) => feature.name,
  getSelectionMessage: (query) => `Select a feature for **${query}**:`,
};
