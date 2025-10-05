import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Collection,
  type CommandInteraction,
  EmbedBuilder,
  type MessageActionRowComponentBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { logToChannel } from '../../util/channel-logging.js';

const SEARCH_TERM = '%SEARCH%';
const TERM = '%TERM%';

export type NPMSearchResult = {
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

export type MDNSearchResult = {
  documents: Array<{
    mdn_url: string;
    title: string;
    slug: string;
    summary: string;
  }>;
};

export type ActionBuilders = {
  selectRow: ActionRowBuilder<MessageActionRowComponentBuilder>;
  buttonRow: ActionRowBuilder<MessageActionRowComponentBuilder>;
};

export type DocProvider = 'mdn' | 'npm';

export type ProviderData<T extends DocProvider> = T extends 'mdn'
  ? MDNSearchResult
  : T extends 'npm'
    ? NPMSearchResult
    : never;

export type ProviderItem<T extends DocProvider> = T extends 'mdn'
  ? MDNSearchResult['documents'][number]
  : T extends 'npm'
    ? NPMSearchResult['objects'][number]['package']
    : never;

export type ProviderKey<T extends DocProvider> = T extends 'mdn'
  ? MDNSearchResult['documents'][number]['slug']
  : T extends 'npm'
    ? NPMSearchResult['objects'][number]['package']['name']
    : never;

export type DocProviderConfig<T extends DocProvider> = {
  searchUrl: string;
  directUrl?: string;
  icon: string;
  color: number;
  commandDescription: string;

  // Transform raw API response to array of items
  transformResponse: (data: ProviderData<T>) => Array<ProviderItem<T>>;

  // Create collection from items
  createCollection: (items: Array<ProviderItem<T>>) => Collection<ProviderKey<T>, ProviderItem<T>>;

  // Create action builders (select menu and buttons)
  createActionBuilders: (data: Collection<ProviderKey<T>, ProviderItem<T>>) => ActionBuilders;

  // Create result embeds to show after selection
  createResultEmbeds: (
    data: Collection<ProviderKey<T>, ProviderItem<T>>
  ) => EmbedBuilder | EmbedBuilder[];

  // Get display title for an item
  getDisplayTitle: (item: ProviderItem<T>) => string;

  // Get selection content message
  getSelectionMessage: (query: string) => string;

  // Get display message after selection
  getDisplayMessage: (selectedTitles: string[]) => string;
};

export type DocProviders = {
  [K in DocProvider]: DocProviderConfig<K>;
};

export const docProviders: DocProviders = {
  mdn: {
    color: 0x83_d0_f2,
    icon: 'https://avatars0.githubusercontent.com/u/7565578',
    searchUrl: `https://developer.mozilla.org/api/v1/search?q=${SEARCH_TERM}&locale=en-US`,
    directUrl: `https://developer.mozilla.org${TERM}`,
    commandDescription: 'Search MDN for documentation on web development topics',
    transformResponse: (data) => data.documents,
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
              description:
                doc.summary.length > 100 ? `${doc.summary.slice(0, 97)}...` : doc.summary,
              value: doc.slug,
            }))
          )
      );

      const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Danger)
          .setCustomId('mdn-cancel')
      );

      return { selectRow, buttonRow };
    },
    createResultEmbeds: (selectedItems) =>
      selectedItems.map((doc) =>
        new EmbedBuilder()
          .setTitle(doc.title)
          .setURL(getDirectUrl('mdn', doc.mdn_url) ?? '')
          .setDescription(doc.summary)
          .setColor(getColor('mdn'))
          .setFooter({ text: 'Powered by MDN' })
          .setTimestamp()
      ),
    getDisplayTitle: (item) => item.title,
    getSelectionMessage: (query) => `Select 1 to 5 results for **${query}**:`,
    getDisplayMessage: (selectedTitles) =>
      `Displaying Result for **${new Intl.ListFormat('en-US').format(selectedTitles)}**:`,
  },
  npm: {
    color: 0xfb_3e_44,
    icon: 'https://avatars0.githubusercontent.com/u/6078720',
    searchUrl: `https://registry.npmjs.org/-/v1/search?text=${SEARCH_TERM}&size=10`,
    commandDescription: 'Search NPM for JavaScript packages',
    transformResponse: (data) => data.objects.map((obj) => obj.package),
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
        new ButtonBuilder()
          .setCustomId('npm-cancel')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Danger)
      );
      return { selectRow, buttonRow };
    },
    createResultEmbeds: (selectedItems) =>
      selectedItems.map((pkg) =>
        new EmbedBuilder()
          .setTitle(pkg.name)
          .setThumbnail(getIconUrl('npm'))
          .setURL(pkg.links.npm)
          .setColor(getColor('npm'))
          .setDescription(pkg.description)
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
  },
};

// Utility functions
export const getSearchUrl = (provider: DocProvider, search: string) =>
  docProviders[provider].searchUrl.replace(SEARCH_TERM, encodeURIComponent(search));

export const getDirectUrl = <T extends DocProvider>(
  provider: T,
  term: string
): DocProviders[T]['directUrl'] => {
  const direct = docProviders[provider].directUrl;
  if (!direct) return undefined;
  return direct.replace(TERM, term);
};

export const getIconUrl = (provider: DocProvider): string => docProviders[provider].icon;

export const getColor = (provider: DocProvider): number => docProviders[provider].color;

export const executeDocCommand = async <T extends DocProvider>(
  provider: T,
  interaction: CommandInteraction
): Promise<void> => {
  if (!interaction.isChatInputCommand()) return;

  const query = interaction.options.getString('query', true).trim();
  const config = docProviders[provider];

  try {
    const url = getSearchUrl(provider, query);
    const response = await fetch(url);
    if (!response.ok) {
      await interaction.reply({
        content: `Error: ${response.status} ${response.statusText}`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const data = (await response.json()) as ProviderData<T>;
    const items = config.transformResponse(data);

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
