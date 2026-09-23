import type { Collection } from 'discord.js';
import {
  FileUploadBuilder,
  type GuildForumTag,
  LabelBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  type ModalActionRowComponentBuilder,
} from 'discord.js';

export type ShowcaseMessageData = {
  link: string;
  description: string;
  authorId: string;
};

const FOOTER_REGEX = /\n+\*\*Author:\*\* <@(\d+)>(?:\n\*\*Link:\*\* (.+))?\s*$/;

export const parseShowcaseMessage = (content: string): ShowcaseMessageData => {
  const footerMatch = content.match(FOOTER_REGEX);

  if (!footerMatch) {
    return { authorId: '', link: '', description: content.trim() };
  }

  const [, authorId, link] = footerMatch;
  const description = content.slice(0, footerMatch.index).trim();

  return {
    authorId: authorId ?? '',
    link: link?.trim() ?? '',
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
  tags: GuildForumTag[];
  projectName?: string;
  link?: string;
  description?: string;
  appliedTagIds?: string[];
  isEdit?: boolean;
};

export const buildShowcaseModal = ({
  id,
  tags,
  projectName = '',
  link = '',
  description = '',
  appliedTagIds = [],
  isEdit = false,
}: BuildShowcaseModalOptions): ModalBuilder => {
  return new ModalBuilder()
    .setCustomId(id)
    .setTitle(isEdit ? 'Edit Showcase' : 'Create Showcase')
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
        .setLabel('Media')
        .setDescription(
          isEdit
            ? 'Overwrite the existing media attachments (optional)'
            : 'Attach images or videos showcasing your project (optional)'
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
  return tagIds.map(
    (id) => availableTags.find((tag) => tag.id === id)?.name ?? id
  );
};

export type BuildDeleteShowcaseModalOptions = {
  id: string;
};

export const buildDeleteShowcaseModal = ({
  id,
}: BuildDeleteShowcaseModalOptions): ModalBuilder => {
  return new ModalBuilder()
    .setCustomId(id)
    .setTitle('Delete Showcase')
    .addLabelComponents((label) =>
      label
        .setLabel('Reason for deletion (optional)')
        .setDescription(
          'Provide a reason for deleting this showcase (optional)'
        )
        .setTextInputComponent((textInput) =>
          textInput
            .setCustomId('deleteReason')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(1000)
            .setRequired(false)
        )
    );
};
