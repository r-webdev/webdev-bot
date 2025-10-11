import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Collection,
  EmbedBuilder,
  type MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { CHAIN_EMOJI } from '../../constants/emoji.js';
import { clampText } from '../../util/text.js';
import type { ProviderConfig } from './types.js';
import { createBaseConfig, getSearchUrl, SEARCH_TERM, TERM } from './utils.js';

type SearchItem = {
  mdn_url: string;
  title: string;
  slug: string;
  summary: string;
};
type SearchResult = {
  documents: SearchItem[];
};

const baseConfig = createBaseConfig({
  color: 0x83_d0_f2,
  icon: 'https://avatars0.githubusercontent.com/u/7565578',
  directUrl: `https://developer.mozilla.org${TERM}`,
  commandDescription: 'Search MDN for documentation on web development topics',
});

export const mdnProvider: ProviderConfig<SearchItem> = {
  ...baseConfig,
  getFilteredData: async (query: string) => {
    const response = await fetch(
      getSearchUrl(
        `https://developer.mozilla.org/api/v1/search?q=${SEARCH_TERM}&locale=en-US`,
        query
      )
    );

    if (!response.ok) {
      throw new Error(`Error fetching MDN data: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as SearchResult;
    return data.documents;
  },
  createCollection: (items) => new Collection(items.map((item) => [item.slug, item])),
  createActionBuilders: (data) => {
    const selectRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('mdn-select')
        .setPlaceholder('Select 1 to 5 results')
        .setMinValues(1)
        .setMaxValues(Math.min(5, data.size))
        .addOptions(
          ...data.map((doc) => ({
            label: doc.title.length > 100 ? `${doc.title.slice(0, 97)}...` : doc.title,
            description: doc.summary.length > 100 ? `${doc.summary.slice(0, 97)}...` : doc.summary,
            value: doc.slug,
          }))
        )
    );

    const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder().setLabel('Cancel').setStyle(ButtonStyle.Danger).setCustomId('mdn-cancel')
    );

    return { selectRow, buttonRow };
  },
  createResultEmbeds: (selectedItems) =>
    selectedItems.map((doc) =>
      new EmbedBuilder()
        .setTitle(`${CHAIN_EMOJI} ${doc.title}`)
        .setURL(baseConfig.directUrl!.replace(TERM, doc.mdn_url))
        .setDescription(clampText(doc.summary, 200))
        .setColor(baseConfig.color)
        .setThumbnail(baseConfig.icon)
        .setFooter({ text: 'Powered by MDN' })
        .setTimestamp()
    ),
  getDisplayTitle: (item) => item.title,
  getSelectionMessage: (query) => `Select 1 to 5 results for **${query}**:`,
  getDisplayMessage: (selectedTitles) =>
    `Displaying Result for **${new Intl.ListFormat('en-US').format(selectedTitles)}**:`,
};
