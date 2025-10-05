import { ApplicationCommandOptionType, ApplicationCommandType, MessageFlags } from 'discord.js';
import { logToChannel } from '../../util/channel-logging.js';
import { loadMarkdownOptions } from '../../util/markdown.js';
import { createCommand } from '../index.js';

const subjectsDir = new URL('./subjects/', import.meta.url);
const subjectChoices = new Map<string, string>();

const loadChoices = async (): Promise<void> => {
  const choices = await loadMarkdownOptions<{ name: string }>(subjectsDir);

  for (const { frontmatter, content } of choices) {
    if (frontmatter.name !== undefined) {
      subjectChoices.set(frontmatter.name, content);
    }
  }
};

await loadChoices();

const slashCommand = createCommand(
  {
    name: 'tips',
    description: 'Provide a helpful tip on a given subject',
    options: [
      {
        name: 'subject',
        description: 'The subject you want a tip on',
        type: ApplicationCommandOptionType.String,
        choices: [...subjectChoices].map(([key]) => ({
          name: key,
          value: key,
        })),
      },
      {
        name: 'user',
        description: 'The user you want to send the tip to',
        type: ApplicationCommandOptionType.User,
        required: false,
      },
    ],
  },
  async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const subject = interaction.options.getString('subject', true);
    const user = interaction.options.getUser('user');

    if (!subjectChoices.has(subject)) {
      await loadChoices();
    }
    const tip = subjectChoices.get(subject);
    if (!tip) {
      await interaction.reply({ content: 'No tip found for that subject.', ephemeral: true });
      return;
    }

    const message = user !== null ? `Hey <@${user.id}> \n${tip}` : tip;

    await logToChannel({
      channel: interaction.channel,
      content: {
        type: 'simple',
        message,
      },
    });

    await interaction.reply({ content: 'Tip sent!', ephemeral: true });
  }
);

const contextMenuCommands = Array.from(subjectChoices).map(([key, value]) =>
  createCommand(
    {
      type: ApplicationCommandType.Message,
      name: `Tip: ${key}`,
    },
    async (interaction) => {
      if (!interaction.isMessageContextMenuCommand()) return;
      const message = interaction.targetMessage;

      await interaction.reply({ content: 'Fetching tip...', flags: MessageFlags.Ephemeral });

      await message.reply({
        content: value,
      });

      await interaction.editReply({ content: 'Tip sent!' });

      return;
    }
  )
);

export const tipsCommands = [slashCommand, ...contextMenuCommands];
