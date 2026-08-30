import {
  type Channel,
  Colors,
  ContainerBuilder,
  type Message,
  MessageFlags,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from 'discord.js';
import { timeToString } from '@/constants/time.js';
import type { Rule } from './rules-config.js';

const makeLogMessageTitleAndContent = (title: string, content: string) => {
  return `**${title}:** ${content}`;
};

const SPACER = `\n--------------------\n`;

export type LogFunctionOptions<T = Rule> = {
  messages: Message[];
  reason: string;
  deletedMessagesCount: number;
  muteDuration?: number;
  logChannel?: Channel;
  rule: T;
};
export type LogFunction<T = Rule> = (
  options: LogFunctionOptions<T>
) => Promise<void>;

export const createLogTextContent = <T extends Rule>(
  options: LogFunctionOptions<T>
) => {
  const content: string[] = [];

  content.push(
    makeLogMessageTitleAndContent('Rule Broken', `${options.reason}\n`)
  );
  content.push(
    makeLogMessageTitleAndContent(
      'User',
      `<@${options.messages[0].author.id}>\n`
    )
  );

  switch (options.rule.type) {
    case 'contentBased': {
      const flaggedMessage = options.messages[0];
      content.push(
        makeLogMessageTitleAndContent(
          'Flagged Message',
          `\`\n\n${flaggedMessage.content}\`\n`
        )
      );
      content.push(SPACER);
      content.push(
        makeLogMessageTitleAndContent(
          'Channel',
          `<#${flaggedMessage.channelId}>`
        )
      );
      break;
    }
    case 'crossChannel': {
      if (options.rule.logType === 'crossPost') {
        content.push(
          `Posted in **${options.rule.channelCount}** channels within **${timeToString(options.rule.timeframe)} **\n`
        );
        const flaggedMessage = options.messages[0];
        const affectedChannels = new Set(
          options.messages.map((message) => message.channelId)
        );
        const hasMessage =
          flaggedMessage.content && flaggedMessage.content.trim().length > 0;
        const hasAttachments = flaggedMessage.attachments.size > 0;
        if (hasMessage) {
          content.push(
            makeLogMessageTitleAndContent(
              'Flagged Message',
              `\n\n${flaggedMessage.content}\n`
            )
          );
        }
        if (hasAttachments) {
          content.push(
            makeLogMessageTitleAndContent(
              'Flagged Message',
              `\n\n[Attachment: ${flaggedMessage.attachments.first()?.name}]\n`
            )
          );
        }
        if (!hasMessage && !hasAttachments) {
          content.push(
            makeLogMessageTitleAndContent(
              'Flagged Message',
              `\n\n[No Text Content]\n`
            )
          );
        }
        content.push(SPACER);
        content.push(
          makeLogMessageTitleAndContent(
            'Channels Involved',
            Array.from(affectedChannels)
              .map((id) => `<#${id}>`)
              .join(', ')
          )
        );
      }
      break;
    }
    case 'frequencyBased': {
      content.push(
        `Sent **${options.rule.frequency}** messages within **${timeToString(options.rule.timeframe)}**\n`
      );
      const displayedMessages = options.messages.slice(0, 5);
      const displayedCount = displayedMessages.length;
      const remainingCount = options.messages.length - displayedCount;

      content.push(`**Messages Involved:**\n`);
      content.push(
        displayedMessages
          .map((message) => {
            const contentPreview =
              message.content.length > 50
                ? `${message.content.slice(0, 47)}...`
                : message.content;
            return `- ${contentPreview}`;
          })
          .join('\n')
      );
      if (remainingCount > 0) {
        content.push(`\n  ...and ${remainingCount} more\n`);
      }
      break;
    }
  }

  content.push(SPACER);
  content.push('**Action(s) Taken:**\n');
  if (options.deletedMessagesCount > 0) {
    content.push(
      `- Deleted ${options.deletedMessagesCount} message${options.deletedMessagesCount > 1 ? 's' : ''}\n`
    );
  }
  if (options.muteDuration) {
    content.push(`- Muted user for ${timeToString(options.muteDuration)}\n`);
  }

  return content.join('');
};

export const defaultLogFunction: LogFunction = async (options) => {
  if (!options.logChannel?.isSendable()) {
    return;
  }

  const content = createLogTextContent(options);
  const textTextDisplayComponent = new TextDisplayBuilder().setContent(content);

  const sectionComponent = new SectionBuilder()
    .addTextDisplayComponents(textTextDisplayComponent)
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(
        options.messages[0].author.displayAvatarURL()
      )
    );

  const containerComponent = new ContainerBuilder()
    .addSectionComponents(sectionComponent)
    .setAccentColor(Colors.Red);

  await options.logChannel.send({
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { users: undefined },
    components: [containerComponent],
  });
};
