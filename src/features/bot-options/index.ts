import {
  type ApplicationCommandOptionChoiceData,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  PermissionsBitField,
} from 'discord.js';
import { createSlashCommand } from '@/common/commands/create-commands.js';
import { BotOptions } from '@/options.js';
import { getOptionHandler } from './get-option.js';
import { setOptionHandler } from './set-option.js';

export const botOptionsCommand = createSlashCommand({
  data: {
    name: 'bot-options',
    description: 'Manage bot options',
    default_member_permissions: new PermissionsBitField(
      PermissionFlagsBits.ModerateMembers
    ).toJSON(),
    options: [
      {
        name: 'set',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Set a bot option',
        options: [
          {
            name: 'option',
            type: ApplicationCommandOptionType.String,
            description: 'The option to set',
            required: true,
            choices: buildChoices(),
          },
          {
            name: 'value',
            type: ApplicationCommandOptionType.String,
            description:
              "The value to set the option to (boolean values should be 'true' or 'false')",
            required: true,
          },
        ],
      },
      {
        name: 'get',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Get the value of a bot option',
        options: [
          {
            name: 'option',
            type: ApplicationCommandOptionType.String,
            description: 'The option to get',
            required: true,
            choices: buildChoices(),
          },
        ],
      },
    ],
  },
  execute: async (interaction) => {
    const subCommand = interaction.options.getSubcommand();
    const handlersMap = {
      set: setOptionHandler,
      get: getOptionHandler,
    };

    if (subCommand in handlersMap) {
      await handlersMap[subCommand as keyof typeof handlersMap](interaction);
    }
    return;
  },
});

function buildChoices(): ApplicationCommandOptionChoiceData<string>[] {
  return Object.entries(BotOptions).map(([key, option]) => ({
    name: option.displayName,
    value: key,
  }));
}
