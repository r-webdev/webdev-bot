import type { Message } from 'discord.js';
import { cachedMessages } from '@/util/cache/recent-message-store.js';
import { config } from '../../env.js';
import { MAX_RULE_TIMEFRAME } from './constants.js';
import type { Rule } from './rules-config.js';
import { rules } from './rules-config.js';

type CheckRuleOptions = {
  newMessage: Message;
  rule: Rule;
  startTime: number;
  userMessages: Message[];
};

export async function checkRules(newMessage: Message): Promise<void> {
  const startTime = Date.now();
  const maxLookback = startTime - MAX_RULE_TIMEFRAME * 1.5;
  const userMessages = cachedMessages.getMessagesInTimeRange(
    newMessage.author.id,
    maxLookback
  );

  for (const rule of rules) {
    const result = checkRule({
      newMessage,
      rule,
      startTime,
      userMessages,
    });

    if (result.broken) {
      const logChannel = newMessage.client.channels.cache.get(
        config.channelIds.spamDetection
      );
      await rule.action(result.messages, rule, logChannel);
      return;
    }
  }
}

export const checkRule = ({
  newMessage,
  rule,
  startTime,
  userMessages,
}: CheckRuleOptions): {
  broken: boolean;
  messages: Message[];
} => {
  switch (rule.type) {
    case 'contentBased': {
      const broken = rule.isBrokenBy(newMessage);
      return {
        broken,
        messages: broken ? [newMessage] : [],
      };
    }
    case 'crossChannel': {
      const recentMessages = userMessages.filter(
        (msg) => msg.createdTimestamp >= startTime - rule.timeframe
      );
      const violatingMessages = recentMessages.filter((msg) =>
        rule.isBrokenBy(newMessage, msg)
      );
      const uniqueChannels = new Set(
        violatingMessages.map((msg) => msg.channelId)
      );
      uniqueChannels.add(newMessage.channelId);

      const broken = uniqueChannels.size >= rule.channelCount;

      return {
        broken,
        messages: broken ? [...violatingMessages, newMessage] : [],
      };
    }
    case 'frequencyBased': {
      const recentMessages = userMessages.filter(
        (msg) => msg.createdTimestamp >= startTime - rule.timeframe
      );

      const otherViolatingMessages = recentMessages.filter(
        (msg) => msg.id !== newMessage.id && rule.isBrokenBy(newMessage, msg)
      );

      // Include the current message since it's part of the pattern
      const allViolatingMessages = [newMessage, ...otherViolatingMessages];

      const broken = allViolatingMessages.length >= rule.frequency;
      return {
        broken,
        messages: broken ? allViolatingMessages : [],
      };
    }
  }
};
