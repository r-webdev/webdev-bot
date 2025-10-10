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
import type { ProviderConfig } from './types.js';
import { createBaseConfig } from './utils.js';

export type FeatureData = {
  name: string;
  description: string;
  status: {
    baseline: 'high' | 'low' | false;
    support: Record<string, string>;
  };
};

const features = Object.fromEntries(
  Object.entries(data).filter(([, feature]) => feature.kind === 'feature')
) as Record<string, FeatureData>;

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

type Item = FeatureData;

const baseConfig = createBaseConfig({
  color: 0x4e_8c_2f,
  icon: '',
  commandDescription: 'Get baseline support information for web platform features',
});

export const baselineProvider: ProviderConfig<Item> = {
  ...baseConfig,
  getFilteredData: (query: string) => {
    return fuzzySearch({
      items: Object.entries(features),
      query,
      findIn: [([key]) => key],
      limit: 20,
    }).map(([, feature]) => feature);
  },
  createCollection: (items) => new Collection(items.map((item) => [item.name, item])),
  createActionBuilders: (data) => {
    const selectRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('baseline-select')
        .setPlaceholder('Select one feature')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(
          ...data.map((feature) => ({
            label: feature.name.length > 100 ? `${feature.name.slice(0, 97)}...` : feature.name,
            description:
              feature.description.length > 100
                ? `${feature.description.slice(0, 97)}...`
                : feature.description,
            value: feature.name,
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
