import { createEvent } from '@/common/events/create-event.js';
import {
  Events,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  User,
} from 'discord.js';
import { removeUserBotMessage } from './remove-user-bot-message.js';

export type ReactionAddEvent = {
  reaction: MessageReaction | PartialMessageReaction;
  user: User | PartialUser;
};

const handlers = [removeUserBotMessage];

export const reactionAddEvent = createEvent(
  {
    name: Events.MessageReactionAdd,
  },
  async (reaction, user, details) => {
    if (user.bot) {
      return;
    }
    try {
      if (reaction.partial) {
        await reaction.fetch();
      }
    } catch {
      return;
    }

    for (const handler of handlers) {
      await handler(reaction, user, details);
    }
  }
);
