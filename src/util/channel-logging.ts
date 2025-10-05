import type {
  EmbedBuilder,
  MessageCreateOptions,
  SendableChannels,
  TextBasedChannel,
} from 'discord.js';

export type SimpleLogContent = {
  type: 'simple';
  message: string;
};

export type EmbedLoadContent = {
  type: 'embed';
  embed: EmbedBuilder | EmbedBuilder[];
  content?: string;
};

export type CustomLogContent = {
  type: 'custom';
  options: MessageCreateOptions;
};

export type LogContent = SimpleLogContent | EmbedLoadContent | CustomLogContent;

export type LoggerOptions = {
  channel: TextBasedChannel | null;
  content: LogContent;
  fallbackChannelId?: string;
  silent?: boolean;
};

const sendMessage = async (channel: SendableChannels, content: LogContent): Promise<boolean> => {
  try {
    let options: MessageCreateOptions;
    switch (content.type) {
      case 'simple':
        options = { content: content.message };
        break;
      case 'embed':
        options = {
          embeds: Array.isArray(content.embed) ? content.embed : [content.embed],
          content: content.content,
        };
        break;
      case 'custom':
        options = content.options;
        break;
      default:
        throw new Error('Invalid content type');
    }

    await channel.send(options);
    return true;
  } catch (error) {
    console.error('Failed to send log message:', error);
    return false;
  }
};

export const logToChannel = async (options: LoggerOptions): Promise<boolean> => {
  try {
    const { channel, content } = options;
    if (!channel || !channel.isSendable()) {
      throw new Error('Channel is not a text-based channel or is null');
    }
    const sent = await sendMessage(channel, content);
    if (!sent) {
      throw new Error('Failed to send message to the specified channel');
    }
    return true;
  } catch (error) {
    if (!options.silent) {
      console.error('Logging error:', error);
    }
    if (options.fallbackChannelId && options.channel?.client) {
      const fallbackChannel = await options.channel.client.channels.fetch(
        options.fallbackChannelId
      );
      if (fallbackChannel?.isSendable()) {
        return sendMessage(fallbackChannel, options.content);
      } else {
        if (!options.silent) {
          console.error('Fallback channel is not a text-based channel or could not be fetched');
        }
        return false;
      }
    }
    return false;
  }
};
