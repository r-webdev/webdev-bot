import type { Channel, Message } from 'discord.js';
import { cachedMessages } from '@/util/cache/recent-message-store.js';
import { DAY, HOUR } from '../../constants/time.js';
import { defaultLogFunction, type LogFunction } from './logs.js';
import { finishModeration, startModeration } from './moderation-state.js';
import type { Rule } from './rules-config.js';

type ActionConfig = {
  reason: string;
  deleteMessages?: boolean;
  muteDuration?: number;
  log?: LogFunction;
};

export const deleteMessageDuringModeration = async (
  message: Message
): Promise<void> => {
  if (!message.deletable) {
    return;
  }

  cachedMessages.delete(message.id);
  await message.delete();
};

const handleBulkDeleteMessages = async (messages: Message[]) => {
  const messagesByChannel = new Map<string, string[]>();
  for (const message of messages) {
    if (!message.deletable || !message.inGuild()) {
      continue;
    }
    if (!messagesByChannel.has(message.channelId)) {
      messagesByChannel.set(message.channelId, [message.id]);
    } else {
      messagesByChannel.get(message.channelId)!.push(message.id);
    }
  }

  let deletedMessagesCount = 0;

  await Promise.allSettled(
    Array.from(messagesByChannel.entries()).map(([channelId, messageIds]) => {
      const channel = messages.find(
        (message) => message.channelId === channelId
      )?.channel;
      if (!channel || channel.isDMBased()) {
        return Promise.resolve();
      }
      cachedMessages.bulkDeleteByIds(messageIds);
      deletedMessagesCount += messageIds.length;
      return channel.bulkDelete(messageIds, true);
    })
  );

  return deletedMessagesCount;
};

const handleAction = (config: ActionConfig) => {
  return async (messages: Message[], rule: Rule, logChannel?: Channel) => {
    const firstMessage = messages[0];
    const author = firstMessage.author;

    if (author === undefined) {
      return;
    }

    startModeration(author.id);
    try {
      let muted = false;
      if (config.muteDuration) {
        try {
          const guildMember = await firstMessage.guild?.members.fetch(
            author.id
          );
          if (guildMember?.moderatable) {
            await guildMember.timeout(config.muteDuration, config.reason);
            muted = true;
          }
        } catch (error) {
          console.error('Failed to mute user:', error);
        }
      }

      let deletedMessagesCount = 0;

      if (config.deleteMessages) {
        deletedMessagesCount = await handleBulkDeleteMessages(messages);
      }

      const logFunction = config.log || defaultLogFunction;
      await logFunction({
        messages,
        reason: config.reason,
        logChannel,
        deletedMessagesCount,
        muteDuration: muted ? config.muteDuration : undefined,
        rule,
      });
    } finally {
      finishModeration(author.id);
    }
  };
};

export const handleBannedTagsAction = handleAction({
  reason: 'Banned Tag',
  deleteMessages: true,
  muteDuration: 1 * DAY,
});

export const handleDiscordInvitesAction = handleAction({
  reason: 'Discord Invite Link',
  deleteMessages: true,
  muteDuration: 1 * DAY,
});

export const handleSpoilerHackAction = handleAction({
  reason: 'Spoiler Tag Hack',
  deleteMessages: true,
  muteDuration: 12 * HOUR,
});

export const handleCrossPostingAction = handleAction({
  reason: 'Cross-posting',
  deleteMessages: true,
  muteDuration: 12 * HOUR,
});

export const handleHighFrequencyAction = handleAction({
  reason: 'High Frequency Messaging',
  deleteMessages: true,
  muteDuration: 12 * HOUR,
});
