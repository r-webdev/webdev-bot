import type {
  ActionRowBuilder,
  Collection,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from 'discord.js';

export type ActionBuilders = {
  selectRow: ActionRowBuilder<MessageActionRowComponentBuilder>;
  buttonRow: ActionRowBuilder<MessageActionRowComponentBuilder>;
};

export type ProviderConfig<Item = unknown> = {
  color: number;
  icon: string;
  commandDescription: string;
  directUrl?: string;

  getFilteredData: (query: string) => Promise<Item[]> | Item[];

  createCollection: (items: Array<Item>) => Collection<string, Item>;

  createActionBuilders: (data: Collection<string, Item>) => ActionBuilders;

  createResultEmbeds: (
    data: Collection<string, Item>
  ) => EmbedBuilder | EmbedBuilder[];

  getDisplayTitle: (item: Item) => string;

  // e.g. "Select a result for **{query}**"
  getSelectionMessage: (query: string) => string;

  // e.g. "Showing results for **{selected}**"
  getDisplayMessage: (selectedTitles: string[]) => string;
};
