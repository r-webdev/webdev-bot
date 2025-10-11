import { ApplicationCommandOptionType, ApplicationCommandType, MessageFlags } from 'discord.js';
import { logToChannel } from '../../util/channel-logging.js';
import { createCommand } from '../../util/commands.js';
import { loadMarkdownOptions } from '../../util/markdown.js';

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

export const guidesCommand = createCommand({
  data: {
    name: 'guides',
    description: 'Get a guide on a specific subject',
    type: ApplicationCommandType.ChatInput,
    options: [
      {
        name: 'subject',
        description: 'The subject you want a guide on',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [...subjectChoices].map(([key]) => ({
          name: key,
          value: key,
        })),
      },
      {
        name: 'user',
        description: 'The user you want to send the guide to',
        type: ApplicationCommandOptionType.User,
        required: false,
      },
    ],
  },
  execute: async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }
    const subject = interaction.options.getString('subject', true);
    const user = interaction.options.getUser('user');
    if (!subjectChoices.has(subject)) {
      await loadChoices();
    }
    const guide = subjectChoices.get(subject);
    if (!guide) {
      await interaction.reply({
        content: 'No guide found for that subject.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await logToChannel({
      channel: interaction.channel,
      content: {
        type: 'simple',
        message: user !== null ? `<@${user.id}>\n${guide}` : guide,
      },
    });

    await interaction.reply({ content: 'Guide sent!', flags: MessageFlags.Ephemeral });

    return;
  },
});
