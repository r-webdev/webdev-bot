import type { Message } from 'discord.js';
import { jaccardSimilarity } from '@/util/text.js';
import { replaceSpoilerHack } from '@/util/text.js';
import { stripCode } from '@/util/text.js';
import { MESSAGE_SIMILARITY_THRESHOLD } from './constants.js';

export const containsLink = (message: Message): boolean => {
  const withoutCode = stripCode(message.content);
  return withoutCode.includes('http://') || withoutCode.includes('https://');
};

export const containsBannedTag = (message: Message): boolean => {
  const withoutCode = stripCode(message.content);
  return withoutCode.includes('@everyone') || withoutCode.includes('@here');
};

export const containsDiscordInvite = (message: Message): boolean => {
  const withoutCode = stripCode(message.content);
  const keywords = [
    'discord.gg/',
    'discord.com/invite/',
    'discordapp.com/invite/',
  ];
  return keywords.some((keyword) => withoutCode.includes(keyword));
};

export const containsSpoilerHack = (message: Message) => {
  const withoutCode = stripCode(message.content);

  return withoutCode !== replaceSpoilerHack(withoutCode, '');
};

export const isDuplicate = (message: Message, oldMessage: Message) => {
  // cheaper comparison first
  const a = message.content.toLowerCase().trim();
  const b = oldMessage.content.toLowerCase().trim();
  if (a === b) {
    return true;
  }
  // followed by jaccard for catching reordered/slightly altered messages with high similarity
  return jaccardSimilarity(a, b) > MESSAGE_SIMILARITY_THRESHOLD;
};

export const isCrossPost = (message: Message, oldMessage: Message) => {
  return (
    message.channelId !== oldMessage.channelId &&
    isDuplicate(message, oldMessage)
  );
};

export const anyMessage = () => true;
