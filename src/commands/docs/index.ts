import { ApplicationCommandOptionType } from 'discord.js';
import { createCommands } from '../../util/commands.js';
import { baselineProvider } from './providers/baseline.js';
import { mdnProvider } from './providers/mdn.js';
import { npmProvider } from './providers/npm.js';
import type { ProviderConfig } from './types.js';
import { executeDocCommand } from './utils.js';

const docProviders = {
  mdn: mdnProvider,
  npm: npmProvider,
  baseline: baselineProvider,
};

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
    execute: async (interaction) =>
      executeDocCommand(providerConfig as ProviderConfig, interaction),
  }))
);
