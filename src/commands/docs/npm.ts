import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Collection,
  EmbedBuilder,
  type MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { CHAIN_EMOJI } from '../../constants/emoji.js';
import { clampText } from '../../util/text.js';
import type { ProviderConfig } from './types.js';
import { createBaseConfig, getSearchUrl, SEARCH_TERM, TERM } from './utils.js';

type SearchResult = {
  objects: Array<{
    package: {
      name: string;
      version: string;
      description: string;
      license: string;
      links: {
        npm: string;
        homepage?: string;
        repository?: string;
      };
    };
  }>;
};

type Item = SearchResult['objects'][number]['package'];

const baseConfig = createBaseConfig({
  color: 0xfb_3e_44,
  icon: 'https://avatars0.githubusercontent.com/u/6078720',
  directUrl: `https://www.npmjs.com/package/${TERM}`,
  commandDescription: 'Search NPM for JavaScript packages',
});

export const npmProvider: ProviderConfig<Item> = {
  ...baseConfig,
  getFilteredData: async (query: string) => {
    const response = await fetch(
      getSearchUrl(`https://registry.npmjs.org/-/v1/search?text=${SEARCH_TERM}&size=10`, query)
    );

    if (!response.ok) {
      throw new Error(`Error fetching NPM data: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as SearchResult;
    return data.objects.map((obj) => obj.package);
  },
  createCollection: (items) => new Collection(items.map((item) => [item.name, item])),
  createActionBuilders: (data) => {
    const selectRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('npm-select')
        .setPlaceholder('Select a package')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(
          ...data.map((pkg) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(pkg.name)
              .setDescription(pkg.description)
              .setValue(pkg.name)
          )
        )
    );
    const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder().setCustomId('npm-cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
    );
    return { selectRow, buttonRow };
  },
  createResultEmbeds: (selectedItems) =>
    selectedItems.map((pkg) =>
      new EmbedBuilder()
        .setTitle(`${CHAIN_EMOJI} ${pkg.name}`)
        .setThumbnail(baseConfig.icon)
        .setURL(pkg.links.npm)
        .setColor(baseConfig.color)
        .setDescription(clampText(pkg.description, 200))
        .setFields(
          Object.entries(pkg.links)
            .filter(([key, value]) => key !== 'npm' && value !== undefined)
            .map(([key, value]) => ({
              name: key,
              value,
            }))
        )
        .setFooter({ text: `Version ${pkg.version} | License: ${pkg.license ?? 'N/A'}` })
        .setTimestamp()
    ),
  getDisplayTitle: (item) => item.name,
  getSelectionMessage: (query) => `Select a package for **${query}**:`,
  getDisplayMessage: (selectedTitles) =>
    `Displaying Result for **${new Intl.ListFormat('en-US').format(selectedTitles)}**:`,
};
