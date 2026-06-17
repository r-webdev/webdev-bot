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

  // Create result embeds to show after selection
  createResultEmbeds: (data: Collection<string, Item>) => EmbedBuilder | EmbedBuilder[];

  // Get display title for an item
  getDisplayTitle: (item: Item) => string;

  // Get selection content message
  getSelectionMessage: (query: string) => string;

  // Get display message after selection
  getDisplayMessage: (selectedTitles: string[]) => string;
};
