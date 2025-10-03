import { ApplicationCommandOptionType, MessageFlags } from 'discord.js';
import { createCommand } from '../index.js';
import { getSearchUrl } from './providers.js';

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

const list = new Intl.ListFormat('en-US');

export default createCommand(
  {
    name: 'npm',
    description: 'Search NPM for packages',
    options: [
      {
        name: 'query',
        type: ApplicationCommandOptionType.String,
        description: 'The search query',
        required: true,
      },
    ],
  },
  async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const query = interaction.options.getString('query', true);

    try {
      const url = getSearchUrl('npm', query);

      const response = await fetch(url);
      if (!response.ok) {
        await interaction.reply({
          content: `Error: ${response.status} ${response.statusText}`,
          ephemeral: true,
        });
        return;
      }

      const data = (await response.json()) as SearchResult;

      if (data.objects.length === 0) {
        await interaction.reply({ content: `No results found for "${query}"`, ephemeral: true });
        return;
      }
    } catch (error) {
      await interaction.reply({ content: `Error: ${error}`, flags: MessageFlags.Ephemeral });
      return;
    }
  }
);
