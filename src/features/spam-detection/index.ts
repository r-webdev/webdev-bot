import { Events } from 'discord.js';
import { cachedMessages } from '@/util/cache/recent-message-store.js';
import { config } from '@/env.js';
import { createEvent } from '@/common/events/create-event.js';
import { deleteMessageDuringModeration } from './actions.js';
import { isUserBeingModerated } from './moderation-state.js';
import { checkRules } from './rules.js';
import { isNormalUserMessage } from '@/util/messages.js';

export const spamDetection = createEvent(
  {
    name: Events.MessageCreate,
  },
  async (message) => {
    if (!isNormalUserMessage(message)) {
      return;
    }

    if (isUserBeingModerated(message.author.id)) {
      await deleteMessageDuringModeration(message);
      return;
    }

    const regularRole = message.guild?.roles.cache.get(config.roleIds.regular);
    if (
      regularRole === undefined ||
      message.member === null ||
      message.member.roles.highest.position >= regularRole.position
    ) {
      return;
    }

    cachedMessages.add(message);
    await checkRules(message);
  }
);
