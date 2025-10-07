import { ApplicationCommandOptionType } from 'discord.js';
import { createCommands } from '../../util/commands.js';
import { type DocProvider, docProviders, executeDocCommand } from './providers.js';

export const docsCommands = createCommands(
  Object.entries(docProviders).map(([providerKey, providerConfig]) => ({
    data: {
      name: providerKey,
      description: providerConfig.commandDescription,
      options: [
        {
          name: 'query',
          type: ApplicationCommandOptionType.String,
          description: 'The search query',
          required: true,
        },
        {
          name: 'user',
          type: ApplicationCommandOptionType.User,
          description: 'The user to mention in the response',
          required: false,
        },
      ],
    },
    execute: async (interaction) => executeDocCommand(providerKey as DocProvider, interaction),
  }))
);
