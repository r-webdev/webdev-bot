import {
  type ApplicationCommandOptionChoiceData,
  ApplicationCommandOptionType,
} from 'discord.js';
import { createSlashCommand } from '@/common/commands/create-commands.js';
import {
  type AutoCompleteSubmitInteraction,
  registerAutocompleteInteraction,
} from '@/common/interactions/autocomplete-interaction.js';
import { prisma } from '@/db/prisma.js';
import { createTagCommandHandler } from './create-tag.js';
import { deleteTagCommandHandler } from './delete-tag.js';
import { editTagCommandHandler } from './edit-tag.js';
import { getTagInfoCommandHandler } from './get-tag-info.js';
import { listTagsCommandHandler } from './list-tags.js';
import { pruneTagsCommandHandler } from './prune-tags.js';
import { topTagsCommandHandler } from './top-tags.js';

export const tagCommand = createSlashCommand({
  data: {
    name: 'tags',
    description: 'Manage tags in the server',
    options: [
      {
        name: 'create',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Create a new tag',
      },
      {
        name: 'edit',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Edit an existing tag',
        options: [
          {
            name: 'name',
            type: ApplicationCommandOptionType.String,
            description: 'The name of the tag to edit',
            required: true,
            autocomplete: true,
          },
        ],
      },
      {
        name: 'list',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'List all tags in the server',
        options: [
          {
            name: 'search',
            type: ApplicationCommandOptionType.String,
            description: 'Search tags by name',
            required: false,
          },
        ],
      },
      {
        name: 'top',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Displays the top 10 most used tags in the server',
        options: [],
      },
      {
        name: 'delete',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Delete an existing tag',
        options: [
          {
            name: 'name',
            type: ApplicationCommandOptionType.String,
            description: 'The name of the tag to delete',
            required: true,
            autocomplete: true,
          },
        ],
      },
      {
        name: 'info',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Get information about a tag',
        options: [
          {
            name: 'name',
            type: ApplicationCommandOptionType.String,
            description: 'The name of the tag to get information about',
            required: true,
            autocomplete: true,
          },
        ],
      },
      {
        name: 'prune',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'List unused tags that can be pruned',
        options: [
          {
            name: 'per_page',
            type: ApplicationCommandOptionType.Integer,
            description:
              'How many prunable tags to show per page (default: 10, max: 25)',
            required: false,
            min_value: 1,
            max_value: 25,
          },
        ],
      },
    ],
  },
  async execute(interaction) {
    const subCommand = interaction.options.getSubcommand();
    const handlersMap = {
      create: createTagCommandHandler,
      edit: editTagCommandHandler,
      list: listTagsCommandHandler,
      top: topTagsCommandHandler,
      delete: deleteTagCommandHandler,
      info: getTagInfoCommandHandler,
      prune: pruneTagsCommandHandler,
    };

    if (subCommand in handlersMap) {
      await handlersMap[subCommand as keyof typeof handlersMap](interaction);
    }

    return;
  },
});

const autoCompleteHandler: AutoCompleteSubmitInteraction = {
  commandName: 'tags',
  handler: async (interaction) => {
    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name !== 'name') {
      return;
    }
    const input = focusedOption.value;
    const allTags = await prisma.tag.findMany({
      where: {
        aliases: {
          some: {
            name: { contains: input },
          },
        },
      },
      include: { aliases: true },
      take: 25,
    });

    const choices = allTags.flatMap((tag) =>
      tag.aliases.map(
        (alias): ApplicationCommandOptionChoiceData => ({
          name: alias.name,
          value: alias.name,
        })
      )
    );

    await interaction.respond(choices);
  },
};
registerAutocompleteInteraction(autoCompleteHandler);
