import {
  FileUploadBuilder,
  type GuildForumTag,
  LabelBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

export type ShowcaseMessageData = {
  projectName: string;
  link: string;
  description: string;
  authorId: string;
};

export const parseShowcaseMessage = (content: string): ShowcaseMessageData => {
  const [header = '', ...descriptionParts] = content.split(/\n\n+/);
  const headerLines = header.split('\n');

  const projectName = headerLines[0]?.replace(/^## Project Name:\s*/, '') ?? '';
  const authorLine = headerLines.find((line) => line.startsWith('**Author:** '));
  const authorId = authorLine?.match(/<@(\d+)>/)?.[1] ?? '';
  const linkLine = headerLines.find((line) => line.startsWith('**Link:** '));
  const link = linkLine?.replace(/^\*\*Link:\*\*\s*/, '') ?? '';
  const description = descriptionParts.join('\n\n').trim();

  return { projectName, link, description, authorId };
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
            .setRequired(true)
            .setValue(description)
        ),
      new LabelBuilder()
        .setLabel('Tags')
        .setDescription('Select the tags that best describe your project')
        .setStringSelectMenuComponent(
          new StringSelectMenuBuilder()
            .setCustomId('projectTags')
            .setMinValues(1)
            .setMaxValues(tags.length > 0 ? tags.length : 1)
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
        .setDescription('Attach images or videos showcasing your project (optional)')
        .setFileUploadComponent(
          new FileUploadBuilder()
            .setCustomId('projectMedia')
            .setMinValues(0)
            .setMaxValues(5)
            .setRequired(false)
        )
    );
};
