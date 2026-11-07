import type { ClientEvents, Events, Message } from 'discord.js';
import { isDigestMessage, isVoteEmoji } from './util.js';

// Keeps votes unique: when a member reacts with a voting emoji on a digest, any
// earlier voting reaction of theirs on the same message is removed so a new
// reaction overrides the old one.
export const enforceSingleDigestVote: (
  ...args: ClientEvents[Events.MessageReactionAdd]
) => Promise<void> | void = async (reaction, user) => {
  if (!isVoteEmoji(reaction)) {
    return;
  }

  let message: Message;
  try {
    message = reaction.message.partial
      ? await reaction.message.fetch()
      : (reaction.message as Message);
  } catch {
    return;
  }

  if (message.author.id !== user.client.user.id || !isDigestMessage(message)) {
    return;
  }

  for (const otherReaction of message.reactions.cache.values()) {
    if (
      otherReaction.emoji.identifier === reaction.emoji.identifier ||
      !isVoteEmoji(otherReaction)
    ) {
      continue;
    }

    try {
      const reactors = await otherReaction.users.fetch();
      if (reactors.has(user.id)) {
        await otherReaction.users.remove(user.id);
      }
    } catch {
      continue;
    }
  }
};
