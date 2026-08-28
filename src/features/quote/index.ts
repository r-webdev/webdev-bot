import { Client, Events, type Message } from 'discord.js';
import { createEvent } from '@/common/events/create-event.js';
import { UserBotMessagesService } from '@/services/user-bot-messages/user-bot-messages-service.js';
import { createQuoteEmbed, DELETE_HINT_EMOJI } from './embed.js';

export const quoteEvent = createEvent(
  {
    name: Events.MessageCreate,
  },
  async (message) => {
    if (message.system || message.author.bot) {
      return;
    }
    const guildId = message.guildId;

    const messageLinkRegex = new RegExp(
      `https:\\/\\/discord\\.com\\/channels\\/${guildId}\\/(\\d+)\\/(\\d+)`,
      'g'
    );

    const matchedQuoteLinks = Array.from(
      message.content.matchAll(messageLinkRegex)
    );

    if (matchedQuoteLinks.length === 0) {
      return;
    }

    const quotedMessages = await Promise.allSettled(
      matchedQuoteLinks.map((match) =>
        getMessage({
          channelId: match[1],
          messageId: match[2],
          client: message.client,
        })
      )
    );

    const validQuotedMessages = quotedMessages.reduce<Message<true>[]>(
      (acc, result) => {
        if (result.status === 'fulfilled' && result.value !== null) {
          acc.push(result.value);
        }
        return acc;
      },
      []
    );

    const onlyContainsLinks =
      message.content.replace(messageLinkRegex, '').trim().length === 0;

    const embedOptions = validQuotedMessages.map((quotedMessage) =>
      createQuoteEmbed({ quotedMessage, quotedBy: message.author })
    );

    const validEmbeds = embedOptions.filter(
      (embed): embed is NonNullable<typeof embed> => embed !== null
    );

    const shouldDelete = onlyContainsLinks && validEmbeds.length > 0;

    if (shouldDelete) {
      try {
        void message.delete();
      } catch {}
    }

    if (validEmbeds.length === 0) {
      return;
    }

    const referenceMessageId =
      message.reference?.messageId || (shouldDelete ? undefined : message.id);

    const channel = message.channel;

    const results = await Promise.allSettled(
      validEmbeds.map(async (options, i) => {
        const sentMessage = await channel.send(
          i === 0 && referenceMessageId
            ? { ...options, reply: { messageReference: referenceMessageId } }
            : options
        );
        void sentMessage.react(DELETE_HINT_EMOJI);
        void UserBotMessagesService.addUserBotMessage({
          messageId: sentMessage.id,
          userId: message.author.id,
          channelId: message.channel.id,
        });
      })
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('Failed to send quote message:', result.reason);
      }
    }

    return;
  }
);

async function getMessage({
  channelId,
  messageId,
  client,
}: {
  channelId: string;
  messageId: string;
  client: Client;
}) {
  const channel = await client.channels.fetch(channelId);
  if (!channel?.isTextBased() || channel.isDMBased()) {
    return null;
  }
  try {
    const quotedMessage = await channel.messages.fetch(messageId);
    return quotedMessage;
  } catch {
    return null;
  }
}
