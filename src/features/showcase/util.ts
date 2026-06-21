import type { Collection } from 'discord.js';
import {
  FileUploadBuilder,
  type Guild,
  type GuildForumTag,
  LabelBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { config } from '@/env.js';

export type ShowcaseMessageData = {
  link: string;
  description: string;
  authorId: string;
};

export const parseShowcaseMessage = (content: string): ShowcaseMessageData => {
  const isOldStructure = content.startsWith('## Project Name:');
  if (isOldStructure) {
    const [header = '', ...descriptionParts] = content.split(/\n\n+/);
    const headerLines = header.split('\n');

    const authorLine = headerLines.find((line) =>
      line.startsWith('**Author:** ')
    );
    const authorId = authorLine?.match(/<@(\d+)>/)?.[1] ?? '';
    const linkLine = headerLines.find((line) => line.startsWith('**Link:** '));
    const link = linkLine?.replace(/^\*\*Link:\*\*\s*/, '') ?? '';
    const description = descriptionParts.join('\n\n').trim();

    return { link, description, authorId };
  }

  const authorMatch = content.match(/\*\*Author:\*\* <@(\d+)>/);
  const linkMatch = content.match(/\*\*Link:\*\* (.+)/);
  const description = content
    .replace(/\*\*Author:\*\* <@\d+>/, '')
    .replace(/\*\*Link:\*\* .+/, '')
    .trim();

  return {
    authorId: authorMatch?.[1] ?? '',
    link: linkMatch?.[1] ?? '',
    description,
  };
};

export const createShowcaseMessageContent = ({
  link,
  description,
  authorId,
}: ShowcaseMessageData): string => {
  return [
    description,
    '',
    '',
    `**Author:** <@${authorId}>`,
    link ? `**Link:** ${link}` : undefined,
  ]
    .filter((line) => line !== undefined)
    .join('\n');
};

export type BuildShowcaseModalOptions = {
  id: string;
  title: string;
  tags: GuildForumTag[];
  projectName?: string;
  link?: string;
  description?: string;
  appliedTagIds?: string[];
};

export const buildShowcaseModal = ({
  id,
  title,
  tags,
  projectName = '',
  link = '',
  description = '',
  appliedTagIds = [],
}: BuildShowcaseModalOptions): ModalBuilder => {
  return new ModalBuilder()
    .setCustomId(id)
    .setTitle(title)
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Project Name')
        .setDescription('Enter the name of your project')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('projectName')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setValue(projectName)
        ),
      new LabelBuilder()
        .setLabel('Project Link')
        .setDescription('GitHub or website link for your project (optional)')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('projectLink')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setValue(link)
        ),
      new LabelBuilder()
        .setLabel('Project Description')
        .setDescription('Enter a detailed description of your project')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('projectDescription')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(3000)
            .setRequired(true)
            .setValue(description)
        ),
      new LabelBuilder()
        .setLabel('Tags')
        .setDescription('Select up to 5 tags that best describe your project')
        .setStringSelectMenuComponent(
          new StringSelectMenuBuilder()
            .setCustomId('projectTags')
            .setMinValues(1)
            .setMaxValues(5)
            .setRequired(true)
            .addOptions(
              tags.map((tag) => {
                const option = new StringSelectMenuOptionBuilder()
                  .setLabel(tag.name)
                  .setValue(tag.id)
                  .setDefault(appliedTagIds.includes(tag.id));

                if (tag.emoji !== null) {
                  option.setEmoji({
                    id: tag.emoji?.id ?? undefined,
                    name: tag.emoji?.name ?? undefined,
                  });
                }
                return option;
              })
            )
        ),
      new LabelBuilder()
        .setLabel('Media')
        .setDescription(
          'Attach images or videos showcasing your project (optional)'
        )
        .setFileUploadComponent(
          new FileUploadBuilder()
            .setCustomId('projectMedia')
            .setMinValues(0)
            .setMaxValues(5)
            .setRequired(false)
        )
    );
};

export const getAttachmentsCount = (
  files: Collection<string, unknown>
): number => {
  return files.size;
};

export const resolveTagNames = (
  tagIds: readonly string[],
  availableTags: GuildForumTag[]
): string[] => {
  return tagIds.map((id) => availableTags.find((t) => t.id === id)?.name ?? id);
};

export const getShowcaseLogChannel = (guild: Guild | null) => {
  if (!guild) {
    throw new Error('Guild is null');
  }
  const channelId = config.channelIds.showcaseLogs;
  const channel = guild.channels.cache.get(channelId);
  if (!channel?.isTextBased() || !channel.isSendable()) {
    throw new Error('Showcase log channel not found or is not text-based');
  }
  return channel;
};
